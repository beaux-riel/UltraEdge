// Supabase Edge Function: RevenueCat webhook receiver.
//
// RevenueCat POSTs subscription lifecycle events here; we mirror the user's
// entitlement into public.user_subscriptions using the service role key.
// RLS on user_subscriptions only allows the service role to write, so this
// function (plus the trigger-maintained updated_at) is the single source of
// truth for premium status. The app's SubscriptionContext reconciles the
// RevenueCat SDK cache against this table and lets the database win.
//
// Deploy:  supabase functions deploy revenuecat-webhook --no-verify-jwt
// Secrets: supabase secrets set REVENUECAT_WEBHOOK_AUTH=<random-string>
// (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.)
//
// See docs/premium-webhook-setup.md for full setup instructions.

import { createClient } from "npm:@supabase/supabase-js@2";

// RevenueCat webhook payload (v1). Only fields we use are typed here.
// https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields
interface RevenueCatEvent {
  id?: string;
  type: string;
  app_user_id: string;
  original_app_user_id?: string;
  product_id?: string | null;
  new_product_id?: string | null;
  entitlement_ids?: string[] | null;
  period_type?: string | null; // NORMAL | TRIAL | INTRO
  purchased_at_ms?: number | null;
  expiration_at_ms?: number | null;
  event_timestamp_ms?: number | null;
  store?: string | null; // APP_STORE | PLAY_STORE | STRIPE | AMAZON | ...
  environment?: string | null; // SANDBOX | PRODUCTION
  cancel_reason?: string | null;
  transaction_id?: string | null;
  price_in_purchased_currency?: number | null;
  currency?: string | null;
}

interface RevenueCatWebhookBody {
  api_version?: string;
  event?: RevenueCatEvent;
}

// Event types that (re)grant premium access.
const GRANT_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "PRODUCT_CHANGE",
]);

// EXPIRATION means access has ended: deactivate immediately.
// CANCELLATION only turns off auto-renew — the user keeps access until the
// expiration date, so we record the cancellation but leave is_active alone
// (unless the entitlement has already expired).
const REVOKE_EVENTS = new Set(["EXPIRATION", "CANCELLATION"]);

// Values accepted by the revenuecat_event_type enum in 001_user_subscriptions.
const KNOWN_EVENT_TYPES = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "CANCELLATION",
  "UNCANCELLATION",
  "EXPIRATION",
  "BILLING_ISSUE",
  "PRODUCT_CHANGE",
  "TRANSFER",
  "REFUND",
  "SUBSCRIPTION_PAUSED",
  "SUBSCRIPTION_EXTENDED",
]);

// user_subscriptions.user_id references auth.users(id) (UUID). RevenueCat
// anonymous ids ($RCAnonymousID:...) can't be mapped to a Supabase user, so
// rows written for them carry user_id = null (keyed by rc_customer_id) and
// become attributable after the app calls Purchases.logIn(supabaseUserId).
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Map a RevenueCat store string to the purchase_platform enum (or null). */
function mapPlatform(store: string | null | undefined): string | null {
  switch ((store ?? "").toUpperCase()) {
    case "APP_STORE":
    case "MAC_APP_STORE":
      return "ios";
    case "PLAY_STORE":
    case "AMAZON":
      return "android";
    case "STRIPE":
      return "stripe";
    case "RC_BILLING":
      return "web";
    default:
      return null;
  }
}

/**
 * Derive the subscription_entitlement enum value for a grant event.
 * Prefers the event's entitlement_ids (configured in the RC dashboard as
 * "premium" / "premium_lifetime"); falls back to the product id.
 */
function deriveEntitlement(event: RevenueCatEvent, productId: string | null): string {
  const ids = event.entitlement_ids ?? [];
  if (ids.includes("premium_lifetime")) return "premium_lifetime";
  if (ids.includes("premium")) return "premium";
  if (productId && productId.includes("lifetime")) return "premium_lifetime";
  return "premium";
}

function toIso(ms: number | null | undefined): string | null {
  return typeof ms === "number" ? new Date(ms).toISOString() : null;
}

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  // --- Auth: RevenueCat sends the configured value in the Authorization
  // header verbatim (set it as "Bearer <secret>" in the RC dashboard and in
  // REVENUECAT_WEBHOOK_AUTH, or use a bare token in both).
  const expectedAuth = Deno.env.get("REVENUECAT_WEBHOOK_AUTH");
  if (!expectedAuth) {
    console.error("REVENUECAT_WEBHOOK_AUTH is not configured");
    return json(500, { error: "Webhook auth not configured" });
  }
  const gotAuth = req.headers.get("Authorization") ?? "";
  // Accept either the exact configured value or "Bearer <value>".
  if (gotAuth !== expectedAuth && gotAuth !== `Bearer ${expectedAuth}`) {
    return json(401, { error: "Unauthorized" });
  }

  let body: RevenueCatWebhookBody;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const event = body.event;
  if (!event || typeof event.type !== "string" || !event.app_user_id) {
    return json(400, { error: "Missing event" });
  }

  const eventType = event.type;
  const rcCustomerId = event.app_user_id;
  const userId = UUID_RE.test(rcCustomerId) ? rcCustomerId : null;
  const nowIso = new Date().toISOString();

  // Ignore event types we don't act on (BILLING_ISSUE, TRANSFER, TEST, ...)
  // but return 200 so RevenueCat does not retry them.
  if (!GRANT_EVENTS.has(eventType) && !REVOKE_EVENTS.has(eventType)) {
    return json(200, { received: true, ignored: eventType });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    return json(500, { error: "Server misconfigured" });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // For PRODUCT_CHANGE the user is moving to new_product_id.
  const productId =
    (eventType === "PRODUCT_CHANGE" ? event.new_product_id : null) ??
    event.product_id ??
    null;
  const expirationIso = toIso(event.expiration_at_ms);
  const entitlement = deriveEntitlement(event, productId);
  const isLifetime = entitlement === "premium_lifetime";

  // Row shared by all handled event types.
  const row: Record<string, unknown> = {
    rc_customer_id: rcCustomerId,
    rc_original_app_user_id: event.original_app_user_id ?? rcCustomerId,
    product_id: productId,
    platform: mapPlatform(event.store),
    store: event.store?.toLowerCase() ?? null,
    store_transaction_id: event.transaction_id ?? null,
    currency: event.currency ?? null,
    price_in_cents:
      typeof event.price_in_purchased_currency === "number"
        ? Math.round(event.price_in_purchased_currency * 100)
        : null,
    last_event_type: KNOWN_EVENT_TYPES.has(eventType) ? eventType : null,
    last_event_at: toIso(event.event_timestamp_ms) ?? nowIso,
    updated_at: nowIso,
  };
  if (userId) row.user_id = userId;

  if (GRANT_EVENTS.has(eventType)) {
    // INITIAL_PURCHASE / RENEWAL / UNCANCELLATION / PRODUCT_CHANGE:
    // subscription is active with the event's entitlement and expiry.
    Object.assign(row, {
      entitlement,
      is_active: true,
      purchase_date: toIso(event.purchased_at_ms) ?? nowIso,
      expiration_date: isLifetime ? null : expirationIso,
      will_renew: !isLifetime,
      is_trial: event.period_type === "TRIAL",
      unsubscribe_detected_at: null,
      cancellation_reason: null,
      is_in_billing_retry: false,
      billing_issue_detected_at: null,
    });
  } else if (eventType === "EXPIRATION") {
    // Access has ended: deactivate.
    Object.assign(row, {
      entitlement: "free",
      is_active: false,
      expiration_date: expirationIso ?? nowIso,
      will_renew: false,
      is_trial: false,
    });
  } else {
    // CANCELLATION: auto-renew turned off, but access continues until the
    // expiration date — keep the row active unless it has already expired.
    const alreadyExpired =
      typeof event.expiration_at_ms === "number" &&
      event.expiration_at_ms <= Date.now();
    Object.assign(row, {
      is_active: !alreadyExpired,
      ...(alreadyExpired ? { entitlement: "free" } : {}),
      expiration_date: expirationIso,
      will_renew: false,
      unsubscribe_detected_at: nowIso,
      cancellation_reason: event.cancel_reason ?? null,
    });
  }

  const { data, error } = await supabase
    .from("user_subscriptions")
    .upsert(row, { onConflict: "rc_customer_id" })
    .select("id, user_id")
    .maybeSingle();

  if (error) {
    console.error(
      `Failed to apply ${eventType} for ${rcCustomerId}: ${error.message}`,
    );
    // 500 so RevenueCat retries the delivery.
    return json(500, { error: "Database update failed" });
  }

  // Best-effort audit log (subscription_events); never fail the webhook on it.
  if (data && KNOWN_EVENT_TYPES.has(eventType)) {
    const { error: auditError } = await supabase.from("subscription_events").insert({
      subscription_id: data.id,
      user_id: data.user_id ?? userId,
      event_type: eventType,
      product_id: productId,
      raw_payload: body as Record<string, unknown>,
      event_timestamp: toIso(event.event_timestamp_ms) ?? nowIso,
    });
    if (auditError) {
      console.warn(`Audit log insert failed: ${auditError.message}`);
    }
  }

  console.log(
    `Applied ${eventType} for ${rcCustomerId} (user: ${userId ?? "anonymous"}, ` +
      `entitlement: ${row.entitlement ?? "unchanged"}, active: ${row.is_active})`,
  );
  return json(200, { received: true, updated: true });
});

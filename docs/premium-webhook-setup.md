# Premium Webhook Setup (RevenueCat → Supabase)

How premium status stays in sync server-side. RevenueCat sends subscription
lifecycle events to a Supabase Edge Function, which writes the authoritative
state into `public.user_subscriptions`. The app's `SubscriptionContext`
reconciles the RevenueCat SDK cache against this table — the **database wins**
when they disagree (except immediately after a fresh purchase, before the
webhook lands).

```
App Store / Play Store
        │ purchase events
        ▼
   RevenueCat ──POST /functions/v1/revenuecat-webhook──▶ Supabase Edge Function
                                                              │ service role
                                                              ▼
                                                    public.user_subscriptions
                                                              ▲ authenticated read (RLS)
                                                              │
                                                     SubscriptionContext (app)
```

## 1. Prerequisites

- Supabase project with migrations applied (at least
  `001_user_subscriptions.sql`, `008_rls_policies.sql`,
  `009_security_hardening.sql`).
- RevenueCat project with:
  - Entitlements: `premium` and `premium_lifetime`
    (must match `ENTITLEMENTS` in `src/config/revenuecat.ts`).
  - Products: `ultraedge_premium_monthly`, `ultraedge_premium_annual`
    (subscriptions, group "UltraEdge Premium") and
    `ultraedge_premium_lifetime` (non-consumable), attached to those
    entitlements.
  - A `default` offering with `$rc_monthly`, `$rc_annual`, and `$rc_lifetime`
    packages.

## 2. Deploy the Edge Function

```bash
# From the repo root
supabase link --project-ref <your-project-ref>

# Generate a strong shared secret for webhook auth
openssl rand -hex 32
# → e.g. 3f9c…

# Store it as a function secret
supabase secrets set REVENUECAT_WEBHOOK_AUTH=<generated-secret>

# Deploy. --no-verify-jwt is required: RevenueCat does not send a Supabase JWT;
# the function does its own auth via the Authorization header.
supabase functions deploy revenuecat-webhook --no-verify-jwt
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected into the function
automatically by Supabase — do not set them manually, and never put the
service role key in the app.

The function URL will be:

```
https://<your-project-ref>.supabase.co/functions/v1/revenuecat-webhook
```

## 3. Configure RevenueCat

1. RevenueCat dashboard → your project → **Integrations → Webhooks** →
   **+ New**.
2. **Webhook URL**: the function URL above.
3. **Authorization header value**: the same secret you set as
   `REVENUECAT_WEBHOOK_AUTH` (a bare token or `Bearer <secret>` — the function
   accepts either form, as long as it matches what you stored).
4. **Environment**: enable Production (and Sandbox while testing — sandbox
   events carry `environment: "SANDBOX"` and are processed identically).
5. Event types: send all (the function ignores types it doesn't act on and
   returns 200 so RevenueCat won't retry them).

Also make sure the app logs users into RevenueCat with their **Supabase user
id** (`Purchases.logIn(user.id)` — `SubscriptionContext` does this on auth
change). The webhook maps `event.app_user_id` to `user_subscriptions.user_id`
only when it is a UUID; anonymous RevenueCat ids are stored keyed by
`rc_customer_id` with `user_id = null`.

## 4. Events handled

| Event | Effect on `user_subscriptions` |
|---|---|
| `INITIAL_PURCHASE` | `is_active = true`, entitlement + expiry from event |
| `RENEWAL` | same as above (new expiry) |
| `UNCANCELLATION` | reactivated, `will_renew = true` |
| `PRODUCT_CHANGE` | active with `new_product_id` + new expiry |
| `EXPIRATION` | `is_active = false`, `entitlement = 'free'` |
| `CANCELLATION` | **stays active** until `expiration_date`; `will_renew = false`, `unsubscribe_detected_at` set (deactivated only if already expired) |
| everything else (`BILLING_ISSUE`, `TRANSFER`, `REFUND`, `TEST`, …) | acknowledged with 200, no state change |

Every handled event is also appended to `subscription_events` (audit trail,
raw payload included) — best effort, never fails the webhook.

## 5. App-side keys

Set the RevenueCat **public** SDK keys at build time (placeholders disable
purchases gracefully — the app treats the user as not premium and never
crashes):

```
REVENUECAT_IOS_API_KEY=appl_xxx
REVENUECAT_ANDROID_API_KEY=goog_xxx
```

## 6. Testing

1. In RevenueCat's webhook config, use **Send test event** — expect
   `200 {"received":true,"ignored":"TEST"}`.
2. Make a sandbox purchase in the app (the `UltraEdge.storekit` file contains
   matching monthly/annual/lifetime products for Xcode StoreKit testing;
   note StoreKit-config purchases don't reach RevenueCat — use a sandbox
   App Store account for end-to-end webhook testing).
3. Verify a row appears:
   ```sql
   select user_id, entitlement, is_active, expiration_date, will_renew,
          last_event_type
   from user_subscriptions
   order by updated_at desc limit 5;
   ```
4. Check `select has_premium_access('<user-uuid>');` returns `true`.
5. Watch logs: `supabase functions logs revenuecat-webhook`.
6. A request without the correct `Authorization` header must return 401.

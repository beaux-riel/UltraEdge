-- Migration: 009_security_hardening
-- Description: Security hardening from launch audit
--   1. Explicit WITH CHECK on all UPDATE / FOR ALL policies
--   2. Storage buckets: intentionally SKIPPED (v2 app performs no storage
--      uploads — no `storage.from(` / `.upload(` calls exist in src/)
--   3. delete_my_account() RPC for App Store Guideline 5.1.1(v)
--   4. Hardened has_premium_access() (STABLE, pinned search_path)
--   5. Hardened handle_new_user() + bounded share-token functions
-- Created: 2026-07-01
--
-- Note on (1): PostgreSQL treats a missing WITH CHECK as "reuse USING", so
-- these policies were not exploitable as written. We make WITH CHECK explicit
-- so the ownership invariant survives future edits to the USING clause and is
-- auditable at a glance.

-- ============================================================================
-- 1. EXPLICIT WITH CHECK ON UPDATE / FOR ALL POLICIES
-- ============================================================================

-- user_subscriptions ---------------------------------------------------------
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON user_subscriptions;
CREATE POLICY "Service role can manage subscriptions"
  ON user_subscriptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can manage subscription events" ON subscription_events;
CREATE POLICY "Service role can manage subscription events"
  ON subscription_events FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- user_profiles ---------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- events ----------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update own events" ON events;
CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- gear_items ------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update own gear" ON gear_items;
CREATE POLICY "Users can update own gear"
  ON gear_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- event_gear ------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update own event gear" ON event_gear;
CREATE POLICY "Users can update own event gear"
  ON event_gear FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- checkpoints -----------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update own checkpoints" ON checkpoints;
CREATE POLICY "Users can update own checkpoints"
  ON checkpoints FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- drop_bags -------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update own drop bags" ON drop_bags;
CREATE POLICY "Users can update own drop bags"
  ON drop_bags FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- drop_bag_items --------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update own drop bag items" ON drop_bag_items;
CREATE POLICY "Users can update own drop bag items"
  ON drop_bag_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- crew_members ----------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update own crew members" ON crew_members;
CREATE POLICY "Users can update own crew members"
  ON crew_members FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- event_crew ------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update own event crew" ON event_crew;
CREATE POLICY "Users can update own event crew"
  ON event_crew FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- crew_invites ----------------------------------------------------------------
DROP POLICY IF EXISTS "Inviters can update own invites" ON crew_invites;
CREATE POLICY "Inviters can update own invites"
  ON crew_invites FOR UPDATE
  USING (auth.uid() = inviter_user_id)
  WITH CHECK (auth.uid() = inviter_user_id);

-- Invitees may update the invite (accept/decline) but the updated row must
-- still be addressed to them — they cannot reassign it to another user/email.
DROP POLICY IF EXISTS "Invitees can respond to invites" ON crew_invites;
CREATE POLICY "Invitees can respond to invites"
  ON crew_invites FOR UPDATE
  USING (
    auth.uid() = invitee_user_id
    OR (
      invitee_email IS NOT NULL
      AND invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    auth.uid() = invitee_user_id
    OR (
      invitee_email IS NOT NULL
      AND invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- crew_event_access -----------------------------------------------------------
DROP POLICY IF EXISTS "Owners can manage event access" ON crew_event_access;
CREATE POLICY "Owners can manage event access"
  ON crew_event_access FOR ALL
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- crew_notifications ----------------------------------------------------------
DROP POLICY IF EXISTS "Recipients can update own notifications" ON crew_notifications;
CREATE POLICY "Recipients can update own notifications"
  ON crew_notifications FOR UPDATE
  USING (auth.uid() = recipient_user_id)
  WITH CHECK (auth.uid() = recipient_user_id);

-- ============================================================================
-- 2. STORAGE BUCKETS — SKIPPED
-- ============================================================================
-- Audited src/ for `storage.from(` and `.upload(`: the v2 app performs no
-- Supabase Storage operations (no GPX or image uploads). No buckets are
-- created here. If uploads are added later, create PRIVATE buckets with
-- per-user path RLS, e.g.:
--
--   INSERT INTO storage.buckets (id, name, public) VALUES ('gpx-files', 'gpx-files', false);
--   CREATE POLICY "Users manage own gpx files" ON storage.objects
--     FOR ALL USING (bucket_id = 'gpx-files' AND (storage.foldername(name))[1] = auth.uid()::text)
--     WITH CHECK (bucket_id = 'gpx-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================================
-- 3. ACCOUNT DELETION RPC (App Store Guideline 5.1.1(v))
-- ============================================================================
-- All v2 user-owned root tables reference auth.users(id) ON DELETE CASCADE
-- (user_profiles, user_subscriptions, events, gear_items, event_gear,
-- checkpoints, drop_bags, drop_bag_items, crew_members, event_crew,
-- crew_invites [inviter], crew_event_access, crew_notifications [recipient]).
-- Event-scoped children also cascade from events. We still delete explicitly
-- (belt and suspenders — the function stays correct even if a future FK loses
-- its CASCADE), then remove the auth.users row, which cascades anything left.

CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  uid uuid;
BEGIN
  uid := auth.uid();

  IF uid IS NULL THEN
    RAISE EXCEPTION 'delete_my_account() requires an authenticated user';
  END IF;

  -- Rows where this user is the crew member / invitee / sender on someone
  -- else's data are handled by ON DELETE CASCADE / SET NULL on auth.users.

  -- Crew layer (children first)
  DELETE FROM public.crew_notifications WHERE recipient_user_id = uid OR sender_user_id = uid;
  DELETE FROM public.crew_event_access  WHERE owner_user_id = uid OR crew_user_id = uid;
  DELETE FROM public.crew_invites       WHERE inviter_user_id = uid;
  DELETE FROM public.event_crew         WHERE user_id = uid;
  DELETE FROM public.crew_members       WHERE user_id = uid;

  -- Event layer (children first; these also cascade from events)
  DELETE FROM public.drop_bag_items     WHERE user_id = uid;
  DELETE FROM public.drop_bags          WHERE user_id = uid;
  DELETE FROM public.checkpoints        WHERE user_id = uid;
  DELETE FROM public.event_gear         WHERE user_id = uid;
  DELETE FROM public.events             WHERE user_id = uid;

  -- Library / profile / billing state
  DELETE FROM public.gear_items         WHERE user_id = uid;
  DELETE FROM public.subscription_events WHERE user_id = uid;
  DELETE FROM public.user_subscriptions WHERE user_id = uid;
  DELETE FROM public.user_profiles      WHERE user_id = uid;

  -- Finally remove the auth user; remaining FKs to auth.users cascade here.
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_my_account() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_my_account() FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;

COMMENT ON FUNCTION public.delete_my_account IS
  'Permanently deletes the calling user''s account and all associated data (Apple Guideline 5.1.1(v)).';

-- ============================================================================
-- 4. SERVER-SIDE PREMIUM CHECK
-- ============================================================================
-- has_premium_access() was introduced in 001 without STABLE or a pinned
-- search_path. Recreate it hardened. Signature is unchanged so existing
-- callers keep working.

CREATE OR REPLACE FUNCTION public.has_premium_access(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = check_user_id
      AND is_active = true
      AND (
        entitlement = 'premium_lifetime'
        OR (entitlement = 'premium' AND expiration_date > NOW())
      )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.has_premium_access(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_premium_access(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_premium_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_premium_access(UUID) TO service_role;

COMMENT ON FUNCTION public.has_premium_access IS
  'STABLE, SECURITY DEFINER check: user has an active, unexpired premium or lifetime entitlement.';

-- PREMIUM-GATING DECISION (documented, NOT applied):
-- The client defines premium features (src/config/revenuecat.ts
-- PREMIUM_FEATURES: cloud_sync, crew_management, gear weight, etc.), but the
-- FeatureGate component is not yet wired to SubscriptionContext (TODO in
-- src/components/premium/FeatureGate.tsx) and "cloud_sync" being premium
-- implies ALL table writes are premium — gating core tables would break the
-- free/local-first experience and is explicitly out of scope. Crew is the
-- closest to a clear premium-only surface, but free-tier limits (e.g.
-- UNLIMITED_SHARING implies limited free sharing) make server enforcement
-- ambiguous. Therefore no write policies are gated in this migration.
-- If/when crew is confirmed premium-only, apply e.g.:
--
--   DROP POLICY IF EXISTS "Users can insert own crew members" ON crew_members;
--   CREATE POLICY "Users can insert own crew members"
--     ON crew_members FOR INSERT
--     WITH CHECK (auth.uid() = user_id AND has_premium_access(auth.uid()));
--
--   DROP POLICY IF EXISTS "Inviters can insert invites" ON crew_invites;
--   CREATE POLICY "Inviters can insert invites"
--     ON crew_invites FOR INSERT
--     WITH CHECK (auth.uid() = inviter_user_id AND has_premium_access(auth.uid()));
--
-- (Leave invitee accept/decline and crew reads ungated: crew members
-- themselves are not required to be premium.)

-- ============================================================================
-- 5. HARDEN handle_new_user() AND SHARE-TOKEN FUNCTIONS
-- ============================================================================

-- Sanitize display_name sourced from client-controlled raw_user_meta_data:
-- strip control characters, collapse whitespace, cap length at 80 chars.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw_name TEXT;
  clean_name TEXT;
BEGIN
  raw_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Strip ASCII control chars (incl. newlines) and C1 controls, trim,
  -- then cap at 80 characters.
  clean_name := left(
    btrim(regexp_replace(COALESCE(raw_name, ''), '[\x00-\x1F\x7F-\x9F]', '', 'g')),
    80
  );

  IF clean_name = '' THEN
    clean_name := 'Runner';
  END IF;

  INSERT INTO user_profiles (user_id, display_name)
  VALUES (NEW.id, clean_name);

  -- Also create a free subscription record
  INSERT INTO user_subscriptions (user_id, rc_customer_id, entitlement)
  VALUES (
    NEW.id,
    'rc_' || NEW.id::TEXT, -- Temporary ID until RevenueCat syncs
    'free'
  );

  RETURN NEW;
END;
$$;

-- Bound p_share_token (tokens are 32 hex chars; allow up to 64) and pin
-- search_path on the public share-token functions from 008.
CREATE OR REPLACE FUNCTION public.get_shared_event(p_share_token TEXT)
RETURNS SETOF events
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_share_token IS NULL OR length(p_share_token) > 64 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT * FROM events
  WHERE share_token = p_share_token
    AND is_shared = true
    AND is_deleted = false;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_shared_event_checkpoints(p_share_token TEXT)
RETURNS SETOF checkpoints
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_share_token IS NULL OR length(p_share_token) > 64 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT c.* FROM checkpoints c
  JOIN events e ON c.event_id = e.id
  WHERE e.share_token = p_share_token
    AND e.is_shared = true
    AND c.is_deleted = false
  ORDER BY c.sort_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_shared_event_drop_bags(p_share_token TEXT)
RETURNS SETOF drop_bags
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_share_token IS NULL OR length(p_share_token) > 64 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT d.* FROM drop_bags d
  JOIN events e ON d.event_id = e.id
  WHERE e.share_token = p_share_token
    AND e.is_shared = true
    AND d.is_deleted = false
  ORDER BY d.sort_order;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user IS
  'Creates profile + free subscription on signup. display_name is sanitized (control chars stripped, 80-char cap).';

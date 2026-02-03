-- Migration: 008_rls_policies
-- Description: Row Level Security policies for all tables
-- Created: 2026-02-02

-- Enable RLS on all tables
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE gear_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_gear ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE drop_bags ENABLE ROW LEVEL SECURITY;
ALTER TABLE drop_bag_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_crew ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_event_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER SUBSCRIPTIONS POLICIES
-- ============================================================================

-- Users can read their own subscription
CREATE POLICY "Users can read own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert/update subscriptions (via webhooks)
CREATE POLICY "Service role can manage subscriptions"
  ON user_subscriptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Subscription events - read only for user, write for service role
CREATE POLICY "Users can read own subscription events"
  ON subscription_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscription events"
  ON subscription_events FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- USER PROFILES POLICIES
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Insert is handled by trigger, but allow for edge cases
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- EVENTS POLICIES
-- ============================================================================

-- Users can read their own events
CREATE POLICY "Users can read own events"
  ON events FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own events
CREATE POLICY "Users can insert own events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own events
CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own events
CREATE POLICY "Users can delete own events"
  ON events FOR DELETE
  USING (auth.uid() = user_id);

-- Crew members can read events they have access to
CREATE POLICY "Crew can read shared events"
  ON events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crew_event_access
      WHERE crew_event_access.event_id = events.id
        AND crew_event_access.crew_user_id = auth.uid()
        AND crew_event_access.is_active = true
    )
  );

-- Public can read events with share token (handled via function, not RLS)

-- ============================================================================
-- GEAR ITEMS POLICIES
-- ============================================================================

-- Users can CRUD their own gear
CREATE POLICY "Users can read own gear"
  ON gear_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gear"
  ON gear_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gear"
  ON gear_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gear"
  ON gear_items FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- EVENT GEAR POLICIES
-- ============================================================================

-- Users can CRUD their own event gear assignments
CREATE POLICY "Users can read own event gear"
  ON event_gear FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own event gear"
  ON event_gear FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own event gear"
  ON event_gear FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own event gear"
  ON event_gear FOR DELETE
  USING (auth.uid() = user_id);

-- Crew can read event gear for events they have access to
CREATE POLICY "Crew can read event gear"
  ON event_gear FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crew_event_access
      WHERE crew_event_access.event_id = event_gear.event_id
        AND crew_event_access.crew_user_id = auth.uid()
        AND crew_event_access.is_active = true
    )
  );

-- ============================================================================
-- CHECKPOINTS POLICIES
-- ============================================================================

-- Users can CRUD their own checkpoints
CREATE POLICY "Users can read own checkpoints"
  ON checkpoints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkpoints"
  ON checkpoints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkpoints"
  ON checkpoints FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checkpoints"
  ON checkpoints FOR DELETE
  USING (auth.uid() = user_id);

-- Crew can read checkpoints for events they have access to
CREATE POLICY "Crew can read checkpoints"
  ON checkpoints FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crew_event_access
      WHERE crew_event_access.event_id = checkpoints.event_id
        AND crew_event_access.crew_user_id = auth.uid()
        AND crew_event_access.is_active = true
    )
  );

-- ============================================================================
-- DROP BAGS POLICIES
-- ============================================================================

-- Users can CRUD their own drop bags
CREATE POLICY "Users can read own drop bags"
  ON drop_bags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own drop bags"
  ON drop_bags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own drop bags"
  ON drop_bags FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own drop bags"
  ON drop_bags FOR DELETE
  USING (auth.uid() = user_id);

-- Crew can read drop bags for events they have access to
CREATE POLICY "Crew can read drop bags"
  ON drop_bags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crew_event_access
      WHERE crew_event_access.event_id = drop_bags.event_id
        AND crew_event_access.crew_user_id = auth.uid()
        AND crew_event_access.is_active = true
    )
  );

-- ============================================================================
-- DROP BAG ITEMS POLICIES
-- ============================================================================

-- Users can CRUD their own drop bag items
CREATE POLICY "Users can read own drop bag items"
  ON drop_bag_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own drop bag items"
  ON drop_bag_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own drop bag items"
  ON drop_bag_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own drop bag items"
  ON drop_bag_items FOR DELETE
  USING (auth.uid() = user_id);

-- Crew can read drop bag items via drop bag access
CREATE POLICY "Crew can read drop bag items"
  ON drop_bag_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM drop_bags
      JOIN crew_event_access ON crew_event_access.event_id = drop_bags.event_id
      WHERE drop_bags.id = drop_bag_items.drop_bag_id
        AND crew_event_access.crew_user_id = auth.uid()
        AND crew_event_access.is_active = true
    )
  );

-- ============================================================================
-- CREW MEMBERS POLICIES
-- ============================================================================

-- Users can CRUD their own crew roster
CREATE POLICY "Users can read own crew members"
  ON crew_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own crew members"
  ON crew_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own crew members"
  ON crew_members FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own crew members"
  ON crew_members FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- EVENT CREW POLICIES
-- ============================================================================

-- Users can CRUD their own event crew assignments
CREATE POLICY "Users can read own event crew"
  ON event_crew FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own event crew"
  ON event_crew FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own event crew"
  ON event_crew FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own event crew"
  ON event_crew FOR DELETE
  USING (auth.uid() = user_id);

-- Crew can see their own assignment
CREATE POLICY "Crew can see own assignment"
  ON event_crew FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crew_members
      WHERE crew_members.id = event_crew.crew_member_id
        AND crew_members.crew_user_id = auth.uid()
    )
  );

-- ============================================================================
-- CREW INVITES POLICIES
-- ============================================================================

-- Inviters can read their sent invites
CREATE POLICY "Inviters can read own invites"
  ON crew_invites FOR SELECT
  USING (auth.uid() = inviter_user_id);

-- Inviters can insert invites
CREATE POLICY "Inviters can insert invites"
  ON crew_invites FOR INSERT
  WITH CHECK (auth.uid() = inviter_user_id);

-- Inviters can update their invites (revoke, etc.)
CREATE POLICY "Inviters can update own invites"
  ON crew_invites FOR UPDATE
  USING (auth.uid() = inviter_user_id);

-- Invitees can read invites sent to them (by email or user_id)
CREATE POLICY "Invitees can read invites to them"
  ON crew_invites FOR SELECT
  USING (
    auth.uid() = invitee_user_id
    OR (
      invitee_email IS NOT NULL 
      AND invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Invitees can update invite status (accept/decline)
CREATE POLICY "Invitees can respond to invites"
  ON crew_invites FOR UPDATE
  USING (
    auth.uid() = invitee_user_id
    OR (
      invitee_email IS NOT NULL 
      AND invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- ============================================================================
-- CREW EVENT ACCESS POLICIES
-- ============================================================================

-- Event owners can see who has access
CREATE POLICY "Owners can read event access"
  ON crew_event_access FOR SELECT
  USING (auth.uid() = owner_user_id);

-- Event owners can grant/revoke access
CREATE POLICY "Owners can manage event access"
  ON crew_event_access FOR ALL
  USING (auth.uid() = owner_user_id);

-- Crew can see their own access grants
CREATE POLICY "Crew can see own access"
  ON crew_event_access FOR SELECT
  USING (auth.uid() = crew_user_id);

-- ============================================================================
-- CREW NOTIFICATIONS POLICIES
-- ============================================================================

-- Recipients can read their notifications
CREATE POLICY "Recipients can read own notifications"
  ON crew_notifications FOR SELECT
  USING (auth.uid() = recipient_user_id);

-- Recipients can update their notifications (mark as read)
CREATE POLICY "Recipients can update own notifications"
  ON crew_notifications FOR UPDATE
  USING (auth.uid() = recipient_user_id);

-- Event owners can insert notifications for their events
CREATE POLICY "Event owners can send notifications"
  ON crew_notifications FOR INSERT
  WITH CHECK (
    auth.uid() = sender_user_id
    AND EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_id
        AND events.user_id = auth.uid()
    )
  );

-- ============================================================================
-- PUBLIC ACCESS FOR SHARED EVENTS (via share token)
-- ============================================================================

-- Function to get event by share token (bypasses RLS)
CREATE OR REPLACE FUNCTION get_shared_event(p_share_token TEXT)
RETURNS SETOF events AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM events
  WHERE share_token = p_share_token
    AND is_shared = true
    AND is_deleted = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get checkpoints for shared event
CREATE OR REPLACE FUNCTION get_shared_event_checkpoints(p_share_token TEXT)
RETURNS SETOF checkpoints AS $$
BEGIN
  RETURN QUERY
  SELECT c.* FROM checkpoints c
  JOIN events e ON c.event_id = e.id
  WHERE e.share_token = p_share_token
    AND e.is_shared = true
    AND c.is_deleted = false
  ORDER BY c.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get drop bags for shared event
CREATE OR REPLACE FUNCTION get_shared_event_drop_bags(p_share_token TEXT)
RETURNS SETOF drop_bags AS $$
BEGIN
  RETURN QUERY
  SELECT d.* FROM drop_bags d
  JOIN events e ON d.event_id = e.id
  WHERE e.share_token = p_share_token
    AND e.is_shared = true
    AND d.is_deleted = false
  ORDER BY d.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Check if user has access to an event (owner or crew)
CREATE OR REPLACE FUNCTION has_event_access(p_event_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM events WHERE id = p_event_id AND user_id = p_user_id
    UNION
    SELECT 1 FROM crew_event_access 
    WHERE event_id = p_event_id AND crew_user_id = p_user_id AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user owns an event
CREATE OR REPLACE FUNCTION is_event_owner(p_event_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM events WHERE id = p_event_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON POLICY "Crew can read shared events" ON events IS 'Crew members can view events they have been granted access to';
COMMENT ON FUNCTION get_shared_event IS 'Get event by share token (public read-only access)';
COMMENT ON FUNCTION has_event_access IS 'Check if user can access an event (owner or crew)';

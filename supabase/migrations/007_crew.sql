-- Migration: 007_crew
-- Description: Crew members and invites for event support
-- Created: 2026-02-02

-- Crew invite status
CREATE TYPE crew_invite_status AS ENUM ('pending', 'accepted', 'declined', 'expired', 'revoked');

-- Crew role enum
CREATE TYPE crew_role AS ENUM (
  'captain',    -- Lead crew member, can coordinate others
  'pacer',      -- Will pace the runner
  'driver',     -- Transportation support
  'crew',       -- General crew support
  'spectator'   -- Just following along
);

-- Crew members table (the mover's crew roster)
CREATE TABLE crew_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- The mover
  
  -- Local ID for sync mapping
  local_id TEXT,
  
  -- Crew member details
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  
  -- Role
  role crew_role DEFAULT 'crew',
  
  -- Responsibilities (free-form)
  responsibilities TEXT,
  
  -- Notes
  notes TEXT,
  
  -- Photo
  avatar_url TEXT,
  
  -- If crew member has an account, link it
  crew_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Contact preferences
  preferred_contact TEXT DEFAULT 'phone', -- 'phone', 'email', 'both'
  
  -- Sync tracking
  synced_at TIMESTAMPTZ,
  sync_version INTEGER DEFAULT 1,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event crew assignments (which crew members are assigned to which events)
CREATE TABLE event_crew (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  crew_member_id UUID REFERENCES crew_members(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- The mover
  
  -- Local IDs for sync mapping
  local_id TEXT,
  local_event_id TEXT,
  local_crew_member_id TEXT,
  
  -- Role for this specific event (can override crew_members.role)
  role crew_role,
  
  -- Event-specific responsibilities
  responsibilities TEXT,
  
  -- Checkpoint assignments
  assigned_checkpoints UUID[], -- Array of checkpoint IDs
  
  -- Notes for this event
  notes TEXT,
  
  -- Sync tracking
  synced_at TIMESTAMPTZ,
  sync_version INTEGER DEFAULT 1,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint
  CONSTRAINT unique_event_crew UNIQUE (event_id, crew_member_id)
);

-- Crew invites (for sharing events with crew and granting access)
CREATE TABLE crew_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  crew_member_id UUID REFERENCES crew_members(id) ON DELETE SET NULL,
  inviter_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- The mover
  
  -- Invite token for the link
  invite_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  
  -- Invitee info (may not have account yet)
  invitee_email TEXT,
  invitee_phone TEXT,
  invitee_name TEXT,
  
  -- If invitee creates/has account
  invitee_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Invite status
  status crew_invite_status DEFAULT 'pending',
  
  -- Role they'll have
  role crew_role DEFAULT 'crew',
  
  -- Expiration
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- When actions happened
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  
  -- Notification tracking
  email_sent BOOLEAN DEFAULT false,
  sms_sent BOOLEAN DEFAULT false,
  push_sent BOOLEAN DEFAULT false,
  
  -- Personal message from mover
  message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crew event access (granted after accepting invite)
CREATE TABLE crew_event_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  crew_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- The crew member's user account
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- The mover who owns the event
  
  -- Link to invite
  invite_id UUID REFERENCES crew_invites(id) ON DELETE SET NULL,
  
  -- Access level
  can_read BOOLEAN DEFAULT true,
  can_acknowledge BOOLEAN DEFAULT true, -- Can mark they've seen updates
  can_track BOOLEAN DEFAULT true, -- Can see live tracking
  
  -- Role
  role crew_role DEFAULT 'crew',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  revoked_at TIMESTAMPTZ,
  
  -- Timestamps
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,
  
  -- Unique constraint
  CONSTRAINT unique_crew_event_access UNIQUE (event_id, crew_user_id)
);

-- Crew notifications table
CREATE TABLE crew_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Notification type
  notification_type TEXT NOT NULL, -- 'checkpoint_arrival', 'plan_update', 'message', 'emergency'
  
  -- Content
  title TEXT NOT NULL,
  body TEXT,
  data JSONB, -- Additional structured data
  
  -- Delivery status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Push notification status
  push_sent BOOLEAN DEFAULT false,
  push_sent_at TIMESTAMPTZ,
  push_token TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for crew_members
CREATE INDEX idx_crew_members_user_id ON crew_members(user_id);
CREATE INDEX idx_crew_members_local_id ON crew_members(user_id, local_id);
CREATE INDEX idx_crew_members_crew_user_id ON crew_members(crew_user_id);
CREATE INDEX idx_crew_members_not_deleted ON crew_members(user_id) WHERE is_deleted = false;

-- Indexes for event_crew
CREATE INDEX idx_event_crew_event_id ON event_crew(event_id);
CREATE INDEX idx_event_crew_crew_member_id ON event_crew(crew_member_id);
CREATE INDEX idx_event_crew_user_id ON event_crew(user_id);

-- Indexes for crew_invites
CREATE INDEX idx_crew_invites_event_id ON crew_invites(event_id);
CREATE INDEX idx_crew_invites_invite_token ON crew_invites(invite_token);
CREATE INDEX idx_crew_invites_invitee_email ON crew_invites(invitee_email) WHERE invitee_email IS NOT NULL;
CREATE INDEX idx_crew_invites_status ON crew_invites(status);
CREATE INDEX idx_crew_invites_pending ON crew_invites(status, expires_at) WHERE status = 'pending';

-- Indexes for crew_event_access
CREATE INDEX idx_crew_event_access_event_id ON crew_event_access(event_id);
CREATE INDEX idx_crew_event_access_crew_user_id ON crew_event_access(crew_user_id);
CREATE INDEX idx_crew_event_access_owner_user_id ON crew_event_access(owner_user_id);
CREATE INDEX idx_crew_event_access_active ON crew_event_access(crew_user_id) WHERE is_active = true;

-- Indexes for crew_notifications
CREATE INDEX idx_crew_notifications_recipient ON crew_notifications(recipient_user_id, is_read);
CREATE INDEX idx_crew_notifications_event ON crew_notifications(event_id);
CREATE INDEX idx_crew_notifications_created ON crew_notifications(created_at DESC);

-- Triggers
CREATE TRIGGER update_crew_members_updated_at
  BEFORE UPDATE ON crew_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_crew_updated_at
  BEFORE UPDATE ON event_crew
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crew_invites_updated_at
  BEFORE UPDATE ON crew_invites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to accept a crew invite
CREATE OR REPLACE FUNCTION accept_crew_invite(
  p_invite_token TEXT,
  p_accepting_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_invite crew_invites;
  v_access_id UUID;
BEGIN
  -- Find and validate invite
  SELECT * INTO v_invite
  FROM crew_invites
  WHERE invite_token = p_invite_token
    AND status = 'pending'
    AND expires_at > NOW();
    
  IF v_invite IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invite');
  END IF;
  
  -- Update invite status
  UPDATE crew_invites
  SET 
    status = 'accepted',
    invitee_user_id = p_accepting_user_id,
    responded_at = NOW(),
    updated_at = NOW()
  WHERE id = v_invite.id;
  
  -- Grant event access
  INSERT INTO crew_event_access (
    event_id, crew_user_id, owner_user_id, invite_id, role
  )
  VALUES (
    v_invite.event_id, p_accepting_user_id, v_invite.inviter_user_id, v_invite.id, v_invite.role
  )
  ON CONFLICT (event_id, crew_user_id) 
  DO UPDATE SET is_active = true, revoked_at = NULL
  RETURNING id INTO v_access_id;
  
  -- Link crew member to user account if exists
  IF v_invite.crew_member_id IS NOT NULL THEN
    UPDATE crew_members
    SET crew_user_id = p_accepting_user_id, updated_at = NOW()
    WHERE id = v_invite.crew_member_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'event_id', v_invite.event_id,
    'access_id', v_access_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE crew_members IS 'Crew roster for a mover (not tied to specific events)';
COMMENT ON TABLE event_crew IS 'Crew assignments to specific events';
COMMENT ON TABLE crew_invites IS 'Invites for crew members to access events';
COMMENT ON TABLE crew_event_access IS 'Granted access for crew to view events';
COMMENT ON TABLE crew_notifications IS 'Notifications sent to crew members';

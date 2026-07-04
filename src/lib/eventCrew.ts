/**
 * Per-event crew assignments — shared type, storage access, and the one-time
 * migration that moved roles off crew member profiles onto event assignments.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CrewRole } from '../context/CrewContext';

export const EVENT_CREW_KEY = '@ultraedge/event-crew';

export interface EventCrewAssignment {
  eventId: string;
  crewMemberId: string;
  /** A member can hold multiple roles for a single event. */
  roles: CrewRole[];
  /** Custom label used when `roles` includes 'other'. */
  customRole?: string | null;
  notes?: string;
}

export async function loadEventCrewAssignments(): Promise<EventCrewAssignment[]> {
  try {
    const raw = await AsyncStorage.getItem(EVENT_CREW_KEY);
    return raw ? (JSON.parse(raw) as EventCrewAssignment[]) : [];
  } catch (err) {
    console.error('Failed to load event crew assignments:', err);
    return [];
  }
}

export async function saveEventCrewAssignments(
  assignments: EventCrewAssignment[]
): Promise<void> {
  await AsyncStorage.setItem(EVENT_CREW_KEY, JSON.stringify(assignments));
}

// ============================================================================
// LEGACY ROLE MIGRATION
// ============================================================================

/**
 * Crew member records as they may exist on disk from older app versions,
 * where `role`/`customRole` lived on the member profile.
 */
export interface StoredCrewMemberRecord {
  id: string;
  role?: CrewRole;
  customRole?: string | null;
  [key: string]: unknown;
}

interface MigrationResult {
  members: StoredCrewMemberRecord[];
  assignments: EventCrewAssignment[];
  changed: boolean;
}

/**
 * Copies each member's legacy profile role onto all of that member's event
 * assignments (as a single-element `roles` array), then strips `role` and
 * `customRole` from the member records. Idempotent: once members carry no
 * legacy fields and assignments have `roles` arrays, this is a no-op.
 */
export function migrateLegacyCrewRoles(
  members: StoredCrewMemberRecord[],
  assignments: EventCrewAssignment[]
): MigrationResult {
  let changed = false;

  const membersById = new Map(members.map(m => [m.id, m]));

  const migratedAssignments = assignments.map(assignment => {
    if (Array.isArray(assignment.roles)) {
      return assignment;
    }

    changed = true;
    const member = membersById.get(assignment.crewMemberId);
    const legacyRole = member?.role;

    if (!legacyRole) {
      return { ...assignment, roles: [] as CrewRole[] };
    }

    return {
      ...assignment,
      roles: [legacyRole],
      customRole:
        legacyRole === 'other' && member?.customRole ? member.customRole : null,
    };
  });

  const migratedMembers = members.map(member => {
    if (!('role' in member) && !('customRole' in member)) {
      return member;
    }
    changed = true;
    const { role: _role, customRole: _customRole, ...rest } = member;
    return rest as StoredCrewMemberRecord;
  });

  return { members: migratedMembers, assignments: migratedAssignments, changed };
}

/**
 * Tests for the legacy crew role migration — profile roles move onto
 * per-event assignments, then get stripped from member records.
 */

import {
  migrateLegacyCrewRoles,
  StoredCrewMemberRecord,
  EventCrewAssignment,
} from '../lib/eventCrew';

const baseMember = (
  overrides: Partial<StoredCrewMemberRecord> & { id: string }
): StoredCrewMemberRecord => ({
  name: 'Test Member',
  phone: null,
  email: null,
  notes: null,
  avatar_url: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('migrateLegacyCrewRoles', () => {
  it('copies a legacy profile role onto all of that member\'s assignments', () => {
    const members = [baseMember({ id: 'm1', role: 'pacer', customRole: null })];
    const assignments = [
      { eventId: 'e1', crewMemberId: 'm1' },
      { eventId: 'e2', crewMemberId: 'm1', notes: 'meet at CP3' },
    ] as unknown as EventCrewAssignment[];

    const result = migrateLegacyCrewRoles(members, assignments);

    expect(result.changed).toBe(true);
    expect(result.assignments[0].roles).toEqual(['pacer']);
    expect(result.assignments[1].roles).toEqual(['pacer']);
    expect(result.assignments[1].notes).toBe('meet at CP3');
  });

  it('strips role and customRole from stored member records', () => {
    const members = [
      baseMember({ id: 'm1', role: 'driver', customRole: null }),
      baseMember({ id: 'm2', role: 'other', customRole: 'Chef' }),
    ];

    const result = migrateLegacyCrewRoles(members, []);

    expect(result.changed).toBe(true);
    for (const member of result.members) {
      expect(member).not.toHaveProperty('role');
      expect(member).not.toHaveProperty('customRole');
    }
    // Other fields survive
    expect(result.members[0].id).toBe('m1');
    expect(result.members[0].name).toBe('Test Member');
  });

  it('carries a custom label onto assignments when the legacy role is "other"', () => {
    const members = [baseMember({ id: 'm1', role: 'other', customRole: 'Support Runner' })];
    const assignments = [
      { eventId: 'e1', crewMemberId: 'm1' },
    ] as unknown as EventCrewAssignment[];

    const result = migrateLegacyCrewRoles(members, assignments);

    expect(result.assignments[0].roles).toEqual(['other']);
    expect(result.assignments[0].customRole).toBe('Support Runner');
  });

  it('gives assignments an empty roles array when the member has no legacy role', () => {
    const members = [baseMember({ id: 'm1' })];
    const assignments = [
      { eventId: 'e1', crewMemberId: 'm1' },
      { eventId: 'e1', crewMemberId: 'missing-member' },
    ] as unknown as EventCrewAssignment[];

    const result = migrateLegacyCrewRoles(members, assignments);

    expect(result.assignments[0].roles).toEqual([]);
    expect(result.assignments[1].roles).toEqual([]);
  });

  it('is idempotent — a second run reports no changes and alters nothing', () => {
    const members = [
      baseMember({ id: 'm1', role: 'medical', customRole: null }),
      baseMember({ id: 'm2', role: 'other', customRole: 'Navigator' }),
    ];
    const assignments = [
      { eventId: 'e1', crewMemberId: 'm1' },
      { eventId: 'e1', crewMemberId: 'm2' },
    ] as unknown as EventCrewAssignment[];

    const first = migrateLegacyCrewRoles(members, assignments);
    expect(first.changed).toBe(true);

    const second = migrateLegacyCrewRoles(first.members, first.assignments);
    expect(second.changed).toBe(false);
    expect(second.members).toEqual(first.members);
    expect(second.assignments).toEqual(first.assignments);
  });

  it('does not overwrite assignments that already have roles', () => {
    const members = [baseMember({ id: 'm1', role: 'pacer', customRole: null })];
    const assignments: EventCrewAssignment[] = [
      { eventId: 'e1', crewMemberId: 'm1', roles: ['driver', 'medical'] },
    ];

    const result = migrateLegacyCrewRoles(members, assignments);

    // Member still needs stripping, but the modern assignment is untouched
    expect(result.changed).toBe(true);
    expect(result.assignments[0].roles).toEqual(['driver', 'medical']);
  });
});

import React from 'react';
const { act, create } = require('react-test-renderer');
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventProvider, useEvents } from '../EventContext';
import { CrewProvider, useCrewMembers } from '../CrewContext';
import { GearProvider, useGear } from '../GearContext';
import { addEventGear, updateEventGear, removeEventGear, EVENT_GEAR_KEY, EventGearAllocation } from '../../lib/eventGear';
import { upsertEventCrewAssignments, loadEventCrewAssignments, removeEventCrewAssignment } from '../../lib/eventCrew';
import { readArray } from '../../lib/localPlanStorage';

let events: ReturnType<typeof useEvents>;
let crew: ReturnType<typeof useCrewMembers>;
let gear: ReturnType<typeof useGear>;
let tree: any;
function Probe() { events = useEvents(); crew = useCrewMembers(); gear = useGear(); return null; }
const mount = async () => { await act(async () => { tree = create(<EventProvider><CrewProvider><GearProvider><Probe /></GearProvider></CrewProvider></EventProvider>); }); };
const remount = async () => { await act(async () => { tree.unmount(); }); await mount(); };
const race = (name: string) => ({ name, event_date: '2027-08-01', total_distance: 120, distance_unit: 'miles' as const } as Parameters<typeof events.createEvent>[0]);
const lamp = { name: 'Headlamp', category: 'lighting' as const, weightUnit: 'g' as const, weight: 100, quantity: 1, isActive: true, retired: false };
beforeEach(async () => { (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true; await AsyncStorage.clear(); await mount(); });
afterEach(async () => { await act(async () => { tree.unmount(); }); });

it('creates two races and reuses one crew profile with separate roles through edits, restart and deletion', async () => {
  let first: any, second: any, member: any;
  await act(async () => { first = await events.createEvent(race('Fat Dog rehearsal')); });
  await act(async () => { second = await events.createEvent(race('Training ultra')); });
  await act(async () => { member = await crew.createCrewMember({ name: 'Alex', phone: '555-0100' }); });
  await upsertEventCrewAssignments([
    { eventId: first.id, crewMemberId: member.id, roles: ['pacer'], notes: 'Meet at halfway' },
    { eventId: second.id, crewMemberId: member.id, roles: ['driver'] },
  ]);
  await act(async () => { await crew.updateCrewMember(member.id, { phone: '555-0101' }); });
  await act(async () => { await events.updateEvent(first.id, { name: 'Fat Dog 120' }); });
  await upsertEventCrewAssignments([{ eventId: first.id, crewMemberId: member.id, roles: ['crew_chief', 'pacer'] }]);
  await remount();
  expect(events.getEvent(first.id)?.name).toBe('Fat Dog 120');
  expect(crew.crewMembers).toHaveLength(1);
  expect(crew.getCrewMember(member.id)?.phone).toBe('555-0101');
  expect((await loadEventCrewAssignments()).map(row => row.roles)).toEqual([['crew_chief', 'pacer'], ['driver']]);
  await removeEventCrewAssignment(first.id, member.id);
  expect(await loadEventCrewAssignments()).toEqual([expect.objectContaining({ eventId: second.id, roles: ['driver'] })]);
  await act(async () => { await events.deleteEvent(first.id); });
  await remount();
  expect(events.events).toHaveLength(1);
  expect(crew.crewMembers).toHaveLength(1);
  await act(async () => { await crew.deleteCrewMember(member.id); });
  await remount();
  expect(crew.crewMembers).toEqual([]);
  expect(await loadEventCrewAssignments()).toEqual([]);
});

it('packs a shared item independently for two races and preserves inventory when a race is deleted', async () => {
  let first: any, second: any, item: any;
  await act(async () => { first = await events.createEvent(race('Race A')); });
  await act(async () => { second = await events.createEvent(race('Race B')); });
  await act(async () => { item = await gear.addGearItem(lamp); });
  await addEventGear(first.id, [item.id]); await addEventGear(second.id, [item.id]);
  await updateEventGear(first.id, item.id, { quantity: 2, isWorn: true, isCarried: false, isPacked: true });
  await act(async () => { await gear.updateGearItem(item.id, { name: 'Night headlamp' }); });
  await remount();
  const rows = await readArray<EventGearAllocation>(EVENT_GEAR_KEY);
  expect(rows).toEqual([
    expect.objectContaining({ eventId: first.id, quantity: 2, isWorn: true, isCarried: false, isPacked: true }),
    expect.objectContaining({ eventId: second.id, quantity: 1, isCarried: true, isWorn: false }),
  ]);
  expect(rows[1].isPacked).toBeFalsy();
  expect(gear.getGearItem(item.id)).toMatchObject({ name: 'Night headlamp', quantity: 1 });
  await act(async () => { await events.deleteEvent(first.id); });
  await remount();
  expect(gear.gearItems).toHaveLength(1);
  expect(await readArray(EVENT_GEAR_KEY)).toEqual([expect.objectContaining({ eventId: second.id })]);
  await removeEventGear(second.id, item.id);
  await expect(updateEventGear(second.id, item.id, { isPacked: true })).rejects.toThrow('removed');
  await addEventGear(second.id, [item.id]);
  await act(async () => { await gear.deleteGearItem(item.id); });
  await remount();
  expect(gear.gearItems).toEqual([]);
  expect(await readArray(EVENT_GEAR_KEY)).toEqual([]);
});

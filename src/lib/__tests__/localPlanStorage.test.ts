import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteLocalEvent, runLocalPlanOperation, readArray, saveArrayChanges, deleteLocalCrewMember, deleteLocalCheckpoints, deleteLocalGear } from '../localPlanStorage';
import { loadAndMigrateCrew, upsertEventCrewAssignments, loadEventCrewAssignments } from '../eventCrew';

const put = (key: string, value: unknown) => AsyncStorage.setItem(key, JSON.stringify(value));
const get = async (key: string) => JSON.parse((await AsyncStorage.getItem(key))!);
const originalSet = (AsyncStorage.setItem as jest.Mock).getMockImplementation()!;
const originalGet = (AsyncStorage.getItem as jest.Mock).getMockImplementation()!;

beforeEach(async () => {
  jest.restoreAllMocks();
  (AsyncStorage.setItem as jest.Mock).mockImplementation(originalSet);
  (AsyncStorage.getItem as jest.Mock).mockImplementation(originalGet);
  await AsyncStorage.clear();
});

it.each(['@ultraedge/event-crew', '@ultraedge/crew'])('retains legacy custom roles when migration write fails at %s and retries', async failedKey => {
  await put('@ultraedge/crew', [{ id: 'runner', name: 'Runner', role: 'other', customRole: 'Night pacer' }]);
  await put('@ultraedge/event-crew', [{ eventId: 'race', crewMemberId: 'runner' }]);
  jest.spyOn(AsyncStorage, 'setItem').mockImplementation(async (key, value) => {
    if (key === failedKey) throw new Error('Disk full');
    return originalSet(key, value);
  });
  await expect(loadAndMigrateCrew()).rejects.toThrow('Disk full');
  expect((await get('@ultraedge/crew'))[0].role).toBe('other');
  jest.restoreAllMocks();
  (AsyncStorage.setItem as jest.Mock).mockImplementation(originalSet);
  (AsyncStorage.getItem as jest.Mock).mockImplementation(originalGet);
  await loadAndMigrateCrew();
  expect((await get('@ultraedge/crew'))[0].role).toBeUndefined();
  expect((await get('@ultraedge/event-crew'))[0]).toMatchObject({ roles: ['other'], customRole: 'Night pacer' });
});

it('concurrent assignment saves are unique and keep unrelated events', async () => {
  await put('@ultraedge/events', [{ id: 'race' }, { id: 'other' }]);
  await put('@ultraedge/crew', [{ id: 'a' }]);
  await Promise.all([
    upsertEventCrewAssignments([{ eventId: 'race', crewMemberId: 'a', roles: ['pacer'] }]),
    upsertEventCrewAssignments([{ eventId: 'race', crewMemberId: 'a', roles: ['driver'] }]),
    upsertEventCrewAssignments([{ eventId: 'other', crewMemberId: 'a', roles: ['medical'] }]),
  ]);
  expect(await loadEventCrewAssignments()).toEqual([
    { eventId: 'race', crewMemberId: 'a', roles: ['driver'] },
    { eventId: 'other', crewMemberId: 'a', roles: ['medical'] },
  ]);
});

it('propagates assignment read failure instead of silently overwriting saved data', async () => {
  jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('Read unavailable'));
  await expect(loadEventCrewAssignments()).rejects.toThrow('Read unavailable');
});

it('recovers interrupted event cascade before the next read and preserves unrelated data', async () => {
  await put('@ultraedge/events', [{ id: 'race' }, { id: 'other' }]);
  for (const key of ['@ultraedge/event-crew', '@ultraedge/event-gear', '@ultraedge/dropbags']) {
    await put(key, [{ eventId: 'race', id: 'a' }, { eventId: 'other', id: 'b' }]);
  }
  await put('ultraedge_checkpoints', { race: [{ id: 'cp' }], other: [{ id: 'keep' }] });
  jest.spyOn(AsyncStorage, 'setItem').mockImplementation(async (key, value) => {
    if (key === 'ultraedge_checkpoints') throw new Error('Disk full');
    return originalSet(key, value);
  });
  await expect(deleteLocalEvent('race')).rejects.toThrow();
  expect(await get('@ultraedge/events')).toHaveLength(2);
  expect(await AsyncStorage.getItem('@ultraedge/pending-plan-write')).not.toBeNull();
  jest.restoreAllMocks();
  (AsyncStorage.setItem as jest.Mock).mockImplementation(originalSet);
  (AsyncStorage.getItem as jest.Mock).mockImplementation(originalGet);
  expect(await runLocalPlanOperation(() => readArray('@ultraedge/events'))).toEqual([{ id: 'other' }]);
  expect(await get('ultraedge_checkpoints')).toEqual({ other: [{ id: 'keep' }] });
  for (const key of ['@ultraedge/event-crew', '@ultraedge/event-gear', '@ultraedge/dropbags']) {
    expect(await get(key)).toEqual([{ eventId: 'other', id: 'b' }]);
  }
  expect(await AsyncStorage.getItem('@ultraedge/pending-plan-write')).toBeNull();
});

it('does not start deletion when existing child data cannot be decoded', async () => {
  await put('@ultraedge/events', [{ id: 'race' }]);
  await AsyncStorage.setItem('ultraedge_checkpoints', 'bad json');
  await expect(deleteLocalEvent('race')).rejects.toThrow();
  expect(await get('@ultraedge/events')).toEqual([{ id: 'race' }]);
  expect(await AsyncStorage.getItem('@ultraedge/pending-plan-write')).toBeNull();
});

it('merges concurrent edits without losing newly added rows or resurrecting deletions', async () => {
  const initial = [{ id: 'a', name: 'A' }];
  await put('items', initial);
  await Promise.all([
    saveArrayChanges('items', initial, [...initial, { id: 'b', name: 'B' }]),
    saveArrayChanges('items', initial, [{ id: 'a', name: 'Edited' }]),
  ]);
  expect(await get('items')).toEqual([{ id: 'a', name: 'Edited' }, { id: 'b', name: 'B' }]);
  const refreshed = await get('items');
  await saveArrayChanges('items', refreshed, refreshed.filter((row: { id: string }) => row.id !== 'a'));
  await expect(saveArrayChanges('items', initial, [{ id: 'a', name: 'Old screen' }])).rejects.toThrow('deleted');
});


it('rejects conflicting writes to the same record instead of silently losing changes', async () => {
  const initial = [{ id: 'bag', items: [] }];
  await put('items', initial);
  await saveArrayChanges('items', initial, [{ id: 'bag', items: ['water'] }]);
  await expect(saveArrayChanges('items', initial, [{ id: 'bag', items: ['food'] }])).rejects.toThrow('changed');
  expect(await get('items')).toEqual([{ id: 'bag', items: ['water'] }]);
});

it('removes crew assignments and prevents stale screens from reassigning a deleted member', async () => {
  await put('@ultraedge/events', [{ id: 'race' }]);
  await put('@ultraedge/crew', [{ id: 'a' }, { id: 'b' }]);
  await put('@ultraedge/event-crew', [{ eventId: 'race', crewMemberId: 'a', roles: ['pacer'] }, { eventId: 'race', crewMemberId: 'b', roles: [] }]);
  await deleteLocalCrewMember('a');
  expect(await get('@ultraedge/event-crew')).toEqual([{ eventId: 'race', crewMemberId: 'b', roles: [] }]);
  await expect(upsertEventCrewAssignments([{ eventId: 'race', crewMemberId: 'a', roles: [] }])).rejects.toThrow('deleted');
});

it('unassigns bags from a deleted checkpoint while retaining their packed items and other locations', async () => {
  await put('ultraedge_checkpoints', { race: [{ id: 'first', order_index: 0 }, { id: 'second', order_index: 1 }] });
  const bags = [{ id: 'bag', eventId: 'race', checkpointId: 'first', items: ['water'] }, { id: 'keep', eventId: 'race', checkpointId: 'second', items: [] }];
  await put('@ultraedge/dropbags', bags);
  await deleteLocalCheckpoints('race', 'first');
  expect(await get('@ultraedge/dropbags')).toEqual([{ ...bags[0], checkpointId: null }, bags[1]]);
  expect(await get('ultraedge_checkpoints')).toEqual({ race: [{ id: 'second', order_index: 0 }] });
});

it('rejects child creation after its event has been deleted', async () => {
  await expect(saveArrayChanges('@ultraedge/dropbags', [], [{ id: 'bag', eventId: 'gone' }])).rejects.toThrow('deleted');
  expect(await AsyncStorage.getItem('@ultraedge/dropbags')).toBeNull();
});

it('cascades gear removal through event allocations and packed bag items', async () => {
  await put('@ultraedge/gear-items', [{ id: 'water' }, { id: 'food' }]);
  await put('@ultraedge/event-gear', [{ eventId: 'race', gearItemId: 'water' }]);
  await put('@ultraedge/dropbags', [{ id: 'bag', items: [{ refId: 'water' }, { refId: 'food' }] }]);
  await deleteLocalGear('water');
  expect(await get('@ultraedge/gear-items')).toEqual([{ id: 'food' }]);
  expect(await get('@ultraedge/event-gear')).toEqual([]);
  expect(await get('@ultraedge/dropbags')).toEqual([{ id: 'bag', items: [{ refId: 'food' }] }]);
});

it('recovers a checkpoint deletion interrupted after unassigning bags', async () => {
  await put('ultraedge_checkpoints', { race: [{ id: 'cp', order_index: 0 }] });
  await put('@ultraedge/dropbags', [{ id: 'bag', eventId: 'race', checkpointId: 'cp', items: [] }]);
  jest.spyOn(AsyncStorage, 'setItem').mockImplementation(async (key, value) => {
    if (key === 'ultraedge_checkpoints') throw new Error('Disk full');
    return originalSet(key, value);
  });
  await expect(deleteLocalCheckpoints('race', 'cp')).rejects.toThrow('Disk full');
  (AsyncStorage.setItem as jest.Mock).mockImplementation(originalSet);
  await runLocalPlanOperation(async () => undefined);
  expect(await get('ultraedge_checkpoints')).toEqual({ race: [] });
  expect((await get('@ultraedge/dropbags'))[0].checkpointId).toBeNull();
  expect(await AsyncStorage.getItem('@ultraedge/pending-plan-write')).toBeNull();
});

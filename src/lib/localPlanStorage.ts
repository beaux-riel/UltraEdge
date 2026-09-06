import AsyncStorage from '@react-native-async-storage/async-storage';

const JOURNAL_KEY = '@ultraedge/pending-plan-write';
type Entry = [string, string];
let queue: Promise<unknown> = Promise.resolve();
const listeners = new Set<(keys: string[]) => void>();

/** Serialize read/modify/write operations, including recovery after partial writes. */
export function runLocalPlanOperation<T>(operation: () => Promise<T>): Promise<T> {
  const result = queue.then(async () => {
    await recoverPendingPlanWrite();
    return operation();
  });
  queue = result.catch(() => undefined);
  return result;
}

export function subscribePlanChanges(listener: (keys: string[]) => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export async function recoverPendingPlanWrite(): Promise<void> {
  const raw = await AsyncStorage.getItem(JOURNAL_KEY);
  if (!raw) return;
  const entries: Entry[] = JSON.parse(raw);
  if (!Array.isArray(entries) || !entries.every(entry => Array.isArray(entry) && entry.length === 2 && entry.every(value => typeof value === 'string'))) {
    throw new Error('Saved plan recovery data is invalid. Existing data has been preserved.');
  }
  for (const [key, value] of entries) await AsyncStorage.setItem(key, value);
  await AsyncStorage.removeItem(JOURNAL_KEY);
  listeners.forEach(listener => listener(entries.map(([key]) => key)));
}

/** Call inside runLocalPlanOperation. Journal remains until every write is durable. */
export async function commitPlanWrites(entries: Entry[]): Promise<void> {
  await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
  await recoverPendingPlanWrite();
}

export async function readArray<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) return [];
  const value = JSON.parse(raw);
  if (!Array.isArray(value)) throw new Error(`Invalid saved data: ${key}`);
  return value;
}

export async function readCheckpointMap<T>(): Promise<Record<string, T[]>> {
  const raw = await AsyncStorage.getItem('ultraedge_checkpoints');
  if (raw === null) return {};
  const value = JSON.parse(raw);
  if (!value || Array.isArray(value) || typeof value !== 'object' || !Object.values(value).every(Array.isArray)) {
    throw new Error('Invalid saved checkpoints. Existing data has been preserved.');
  }
  return value;
}

export async function deleteLocalEvent(eventId: string): Promise<void> {
  await runLocalPlanOperation(async () => {
    const entries: Entry[] = [];
    for (const key of ['@ultraedge/event-crew', '@ultraedge/event-gear', '@ultraedge/dropbags']) {
      const rows = await readArray<{ eventId: string }>(key);
      entries.push([key, JSON.stringify(rows.filter(row => row.eventId !== eventId))]);
    }
    const checkpoints = await readCheckpointMap();
    delete checkpoints[eventId];
    entries.push(['ultraedge_checkpoints', JSON.stringify(checkpoints)]);
    const events = await readArray<{ id: string }>('@ultraedge/events');
    // The event disappears only after all child writes have succeeded.
    entries.push(['@ultraedge/events', JSON.stringify(events.filter(event => event.id !== eventId))]);
    await commitPlanWrites(entries);
  });
}

/** Merge this screen's changes into the latest disk state without erasing concurrent additions. */
export async function saveArrayChanges<T extends { id: string }>(key: string, previous: T[], next: T[]): Promise<T[]> {
  return runLocalPlanOperation(async () => {
    const current = await readArray<T>(key);
    const before = new Map(previous.map(row => [row.id, row]));
    const after = new Map(next.map(row => [row.id, row]));
    const merged = new Map(current.map(row => [row.id, row]));
    for (const id of before.keys()) {
      if (!after.has(id)) {
        if (merged.has(id) && JSON.stringify(merged.get(id)) !== JSON.stringify(before.get(id))) throw new Error('This record changed. Refresh before deleting.');
        merged.delete(id);
      }
    }
    for (const row of next) {
      if (JSON.stringify(before.get(row.id)) === JSON.stringify(row)) continue;
      if (before.has(row.id) && !merged.has(row.id)) throw new Error('This record was deleted. Refresh before editing.');
      if (before.has(row.id) && JSON.stringify(merged.get(row.id)) !== JSON.stringify(before.get(row.id))) throw new Error('This record changed. Refresh before editing.');
      if (key === '@ultraedge/dropbags') {
        const bag = row as T & { eventId: string; checkpointId?: string | null };
        await requireLocalEvent(bag.eventId);
        if (bag.checkpointId && !(await readCheckpointMap<{ id: string }>())[bag.eventId]?.some(cp => cp.id === bag.checkpointId)) throw new Error('This checkpoint was deleted. Choose another location.');
      }
      merged.set(row.id, row);
    }
    const result = [...merged.values()];
    await AsyncStorage.setItem(key, JSON.stringify(result));
    return result;
  });
}

/** Call within the operation lock before creating or changing a child record. */
export async function requireLocalEvent(eventId: string): Promise<void> {
  const events = await readArray<{ id: string }>('@ultraedge/events');
  if (!events.some(event => event.id === eventId)) throw new Error('This event was deleted. Refresh before editing.');
}

export async function deleteLocalCrewMember(memberId: string): Promise<void> {
  await runLocalPlanOperation(async () => {
    const members = await readArray<{ id: string }>('@ultraedge/crew');
    const assignments = await readArray<{ crewMemberId: string }>('@ultraedge/event-crew');
    await commitPlanWrites([
      ['@ultraedge/event-crew', JSON.stringify(assignments.filter(row => row.crewMemberId !== memberId))],
      ['@ultraedge/crew', JSON.stringify(members.filter(row => row.id !== memberId))],
    ]);
  });
}

/** Keep packed bags, but remove their location when a checkpoint is deleted. */
export async function deleteLocalCheckpoints(eventId: string, checkpointId?: string): Promise<void> {
  await runLocalPlanOperation(async () => {
    const checkpoints = await readCheckpointMap<{ id: string; order_index: number }>();
    const bags = await readArray<{ eventId: string; checkpointId: string | null }>('@ultraedge/dropbags');
    if (checkpointId === undefined) delete checkpoints[eventId];
    else checkpoints[eventId] = (checkpoints[eventId] || []).filter(cp => cp.id !== checkpointId)
      .sort((a, b) => a.order_index - b.order_index).map((cp, index) => ({ ...cp, order_index: index }));
    await commitPlanWrites([
      ['@ultraedge/dropbags', JSON.stringify(bags.map(bag => bag.eventId === eventId && (checkpointId === undefined || bag.checkpointId === checkpointId) ? { ...bag, checkpointId: null } : bag))],
      ['ultraedge_checkpoints', JSON.stringify(checkpoints)],
    ]);
  });
}

export async function deleteLocalGear(gearItemId: string): Promise<void> {
  await runLocalPlanOperation(async () => {
    const gear = await readArray<{ id: string }>('@ultraedge/gear-items');
    const allocations = await readArray<{ gearItemId: string }>('@ultraedge/event-gear');
    const bags = await readArray<{ items: { refId: string }[] }>('@ultraedge/dropbags');
    await commitPlanWrites([
      ['@ultraedge/event-gear', JSON.stringify(allocations.filter(row => row.gearItemId !== gearItemId))],
      ['@ultraedge/dropbags', JSON.stringify(bags.map(bag => ({ ...bag, items: bag.items.filter(item => item.refId !== gearItemId) })))],
      ['@ultraedge/gear-items', JSON.stringify(gear.filter(row => row.id !== gearItemId))],
    ]);
  });
}

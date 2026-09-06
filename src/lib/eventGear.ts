import AsyncStorage from '@react-native-async-storage/async-storage';
import { readArray, runLocalPlanOperation } from './localPlanStorage';

export const EVENT_GEAR_KEY = '@ultraedge/event-gear';
export interface EventGearAllocation {
  eventId: string;
  gearItemId: string;
  isWorn: boolean;
  isCarried: boolean;
  quantity: number;
  notes?: string;
}

export async function addEventGear(eventId: string, gearIds: string[]): Promise<void> {
  await runLocalPlanOperation(async () => {
    const events = await readArray<{ id: string }>('@ultraedge/events');
    if (!events.some(event => event.id === eventId)) throw new Error('This event was deleted.');
    const inventory = await readArray<{ id: string; retired: boolean; isActive: boolean }>('@ultraedge/gear-items');
    const all = await readArray<EventGearAllocation>(EVENT_GEAR_KEY);
    for (const gearItemId of new Set(gearIds)) {
      if (!inventory.some(item => item.id === gearItemId && !item.retired && item.isActive)) {
        throw new Error('Selected gear is no longer available. Refresh and try again.');
      }
      if (!all.some(row => row.eventId === eventId && row.gearItemId === gearItemId)) {
        all.push({ eventId, gearItemId, isWorn: false, isCarried: true, quantity: 1 });
      }
    }
    await AsyncStorage.setItem(EVENT_GEAR_KEY, JSON.stringify(all));
  });
}

export async function removeEventGear(eventId: string, gearItemId: string): Promise<EventGearAllocation[]> {
  return runLocalPlanOperation(async () => {
    const all = await readArray<EventGearAllocation>(EVENT_GEAR_KEY);
    const updated = all.filter(row => !(row.eventId === eventId && row.gearItemId === gearItemId));
    await AsyncStorage.setItem(EVENT_GEAR_KEY, JSON.stringify(updated));
    return updated;
  });
}

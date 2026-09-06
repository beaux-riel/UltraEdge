import AsyncStorage from '@react-native-async-storage/async-storage';
import { addEventGear, removeEventGear, EVENT_GEAR_KEY } from '../eventGear';
import { deleteLocalEvent } from '../localPlanStorage';

beforeEach(async () => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem('@ultraedge/events', JSON.stringify([{ id: 'race' }, { id: 'other' }]));
  await AsyncStorage.setItem('@ultraedge/gear-items', JSON.stringify([
    { id: 'lamp', isActive: true, retired: false },
    { id: 'shoes', isActive: true, retired: false },
  ]));
});

it('deduplicates simultaneous selection saves and preserves other events', async () => {
  await Promise.all([addEventGear('race', ['lamp', 'lamp']), addEventGear('race', ['lamp', 'shoes']), addEventGear('other', ['lamp'])]);
  expect(JSON.parse((await AsyncStorage.getItem(EVENT_GEAR_KEY))!)).toHaveLength(3);
  const remaining = await removeEventGear('race', 'lamp');
  expect(remaining.map(row => [row.eventId, row.gearItemId])).toEqual([['race', 'shoes'], ['other', 'lamp']]);
});

it('does not recreate relationships after an event is deleted', async () => {
  await addEventGear('race', ['lamp']);
  await deleteLocalEvent('race');
  await expect(addEventGear('race', ['shoes'])).rejects.toThrow('deleted');
  expect(JSON.parse((await AsyncStorage.getItem(EVENT_GEAR_KEY))!)).toEqual([]);
});

it('preserves malformed data rather than overwriting it and rejects deleted gear', async () => {
  await expect(addEventGear('race', ['missing'])).rejects.toThrow('no longer available');
  await AsyncStorage.setItem(EVENT_GEAR_KEY, '{');
  await expect(addEventGear('race', ['lamp'])).rejects.toThrow();
  expect(await AsyncStorage.getItem(EVENT_GEAR_KEY)).toBe('{');
});

it('validates race packing quantities and preserves the last saved state on write failure', async () => {
  const { updateEventGear } = require('../eventGear');
  await addEventGear('race', ['lamp']);
  for (const quantity of [0, -1, 1.5, NaN]) await expect(updateEventGear('race', 'lamp', { quantity })).rejects.toThrow('whole number');
  (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Disk full'));
  await expect(updateEventGear('race', 'lamp', { isPacked: true })).rejects.toThrow('Disk full');
  expect(JSON.parse((await AsyncStorage.getItem(EVENT_GEAR_KEY))!)[0].isPacked).toBeUndefined();
  await updateEventGear('race', 'lamp', { isPacked: true });
  expect(JSON.parse((await AsyncStorage.getItem(EVENT_GEAR_KEY))!)[0].isPacked).toBe(true);
});

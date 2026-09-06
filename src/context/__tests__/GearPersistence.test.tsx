import React from 'react';
const { act, create } = require('react-test-renderer');
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GearProvider, useGear, GearItem } from '../GearContext';

let context: ReturnType<typeof useGear>;
function Probe() { context = useGear(); return null; }
let tree: ReturnType<typeof create>;
const originalSet = (AsyncStorage.setItem as jest.Mock).getMockImplementation()!;
const originalGet = (AsyncStorage.getItem as jest.Mock).getMockImplementation()!;
const item: Omit<GearItem, 'id' | 'createdAt' | 'updatedAt'> = { name: 'Headlamp', category: 'lighting', weightUnit: 'g', weight: 80, quantity: 1, isActive: true, retired: false };
beforeEach(async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  (AsyncStorage.setItem as jest.Mock).mockImplementation(originalSet).mockClear();
  (AsyncStorage.getItem as jest.Mock).mockImplementation(originalGet);
  await AsyncStorage.clear();
});
afterEach(async () => { if (tree) await act(async () => { tree.unmount(); }); });
const mount = async () => { await act(async () => { tree = create(<GearProvider><Probe /></GearProvider>); }); };

it('preserves inventory after a read failure and permits edits only after successful refresh', async () => {
  await AsyncStorage.setItem('@ultraedge/gear-items', JSON.stringify([{ ...item, id: 'lamp' }]));
  (AsyncStorage.setItem as jest.Mock).mockClear();
  (AsyncStorage.getItem as jest.Mock).mockImplementation(async key => {
    if (key === '@ultraedge/gear-items') throw new Error('Unavailable');
    return originalGet(key);
  });
  await mount();
  await expect(context.addGearItem(item)).rejects.toThrow('Reload');
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  (AsyncStorage.getItem as jest.Mock).mockImplementation(originalGet);
  await act(async () => { await context.refreshGear(); });
  expect(context.getGearItem('lamp')?.name).toBe('Headlamp');
});

it('does not report a failed save as success and can retry after refreshing', async () => {
  await mount();
  (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Disk full'));
  await act(async () => { await expect(context.addGearItem(item)).rejects.toThrow('Disk full'); });
  expect(context.gearItems).toEqual([]);
  expect(await AsyncStorage.getItem('@ultraedge/gear-items')).toBeNull();
  await act(async () => { await context.refreshGear(); });
  await act(async () => { await context.addGearItem(item); });
  expect(context.gearItems).toHaveLength(1);
});

it('preserves both rapid additions and rejects competing edits to the same item', async () => {
  await mount();
  await act(async () => { await Promise.all([context.addGearItem(item), context.addGearItem({ ...item, name: 'Spare lamp' })]); });
  expect(context.gearItems).toHaveLength(2);
  const id = context.gearItems[0].id;
  await act(async () => {
    const results = await Promise.allSettled([context.updateGearItem(id, { name: 'Night lamp' }), context.updateGearItem(id, { name: 'Lost update' })]);
    expect(results.map(result => result.status)).toEqual(['fulfilled', 'rejected']);
  });
  const saved = JSON.parse((await AsyncStorage.getItem('@ultraedge/gear-items'))!);
  expect(saved).toHaveLength(2);
  expect(saved[0].name).toBe('Night lamp');
});

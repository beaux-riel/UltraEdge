import React from 'react';
const { act, create } = require('react-test-renderer');
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CheckpointProvider, useCheckpoints } from '../CheckpointContext';

const defaults = { distance_from_start: null, elevation: null, location_description: null, latitude: null, longitude: null, cutoff_time: null, cutoff_duration: null, estimated_arrival: null, estimated_duration: null, has_crew_access: false, has_drop_bag: false, has_pacer_pickup: false, has_pacer_dropoff: false, aid_supplies: [], notes: null };
let context: ReturnType<typeof useCheckpoints>;
function Probe() { context = useCheckpoints(); return null; }
let tree: ReturnType<typeof create>;
const originalSet = (AsyncStorage.setItem as jest.Mock).getMockImplementation()!;
const originalGet = (AsyncStorage.getItem as jest.Mock).getMockImplementation()!;

beforeEach(async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  (AsyncStorage.setItem as jest.Mock).mockImplementation(originalSet).mockClear();
  (AsyncStorage.getItem as jest.Mock).mockImplementation(originalGet);
  await AsyncStorage.clear();
  await AsyncStorage.setItem('@ultraedge/events', JSON.stringify([{ id: 'race' }]));
});
afterEach(async () => { if (tree) await act(async () => { tree.unmount(); }); });
const mount = async () => { await act(async () => { tree = create(<CheckpointProvider><Probe /></CheckpointProvider>); }); };

it('does not write an empty map after read failure and blocks edits until retry succeeds', async () => {
  await AsyncStorage.setItem('ultraedge_checkpoints', JSON.stringify({ race: [{ id: 'existing', order_index: 0 }] }));
  (AsyncStorage.setItem as jest.Mock).mockClear();
  (AsyncStorage.getItem as jest.Mock).mockImplementation(async key => {
    if (key === 'ultraedge_checkpoints') throw new Error('Unavailable');
    return originalGet(key);
  });
  await mount();
  expect(context.error).toMatch(/could not be loaded/);
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  await expect(context.addCheckpoint('race', { ...defaults, name: 'New', checkpoint_type: 'aid_station' })).rejects.toThrow('Load checkpoints');
  (AsyncStorage.getItem as jest.Mock).mockImplementation(originalGet);
  await act(async () => { await context.refreshCheckpoints(); });
  expect(context.getCheckpointsByEventId('race')[0].id).toBe('existing');
});

it('keeps visible and durable state unchanged after failed save, then supports retry', async () => {
  await mount();
  (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Disk full'));
  await act(async () => {
    await expect(context.addCheckpoint('race', { ...defaults, name: 'Summit', checkpoint_type: 'aid_station' })).rejects.toThrow('Disk full');
  });
  expect(context.getCheckpointsByEventId('race')).toEqual([]);
  expect(context.error).toMatch(/not saved/);
  await act(async () => { await context.addCheckpoint('race', { ...defaults, name: 'Summit', checkpoint_type: 'aid_station' }); });
  expect(context.getCheckpointsByEventId('race')).toHaveLength(1);
  expect(context.error).toBeNull();
});

it('serializes rapid additions with distinct order and refuses lossy reorder', async () => {
  await mount();
  await act(async () => {
    await Promise.all([
      context.addCheckpoint('race', { ...defaults, name: 'First', checkpoint_type: 'start' }),
      context.addCheckpoint('race', { ...defaults, name: 'Second', checkpoint_type: 'finish' }),
    ]);
  });
  expect(context.getCheckpointsByEventId('race').map(cp => cp.order_index)).toEqual([0, 1]);
  await act(async () => { await expect(context.reorderCheckpoints('race', [])).rejects.toThrow('every checkpoint'); });
  expect(context.getCheckpointsByEventId('race')).toHaveLength(2);
});

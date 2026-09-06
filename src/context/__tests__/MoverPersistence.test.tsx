import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MoverProvider, useMover } from '../MoverContext';
const { act, create } = require('react-test-renderer');
const PROFILE = '@ultraedge:mover_profile';
const HISTORY = '@ultraedge:weight_history';
const savedProfile = { display_name: 'Runner', current_weight: null, weight_unit: 'lbs', distance_unit: 'kilometers', elevation_unit: 'meters', weight_updated_at: null };
const originalSet = (AsyncStorage.setItem as jest.Mock).getMockImplementation()!;
const originalGet = (AsyncStorage.getItem as jest.Mock).getMockImplementation()!;
let context: ReturnType<typeof useMover>;
let tree: any;
function Probe() { context = useMover(); return null; }
async function mount() { await act(async () => { tree = create(<MoverProvider><Probe /></MoverProvider>); }); }
beforeEach(async () => {
  (AsyncStorage.setItem as jest.Mock).mockImplementation(originalSet).mockClear();
  (AsyncStorage.getItem as jest.Mock).mockImplementation(originalGet);
  await AsyncStorage.clear();
  await AsyncStorage.setItem(PROFILE, JSON.stringify(savedProfile));
});
afterEach(async () => { if (tree) await act(async () => { tree.unmount(); tree = null; }); });

it('preserves saved state on load failure and blocks edits until recovery', async () => {
  (AsyncStorage.getItem as jest.Mock).mockImplementation(async key => {
    if (key === HISTORY) throw new Error('Read failure');
    return originalGet(key);
  });
  await mount();
  expect(context.error).toMatch('could not be loaded');
  await expect(context.updateProfile({ display_name: 'Overwrite' })).rejects.toThrow('Load your profile');
  expect(JSON.parse((await AsyncStorage.getItem(PROFILE))!).display_name).toBe('Runner');
  (AsyncStorage.getItem as jest.Mock).mockImplementation(originalGet);
  await act(async () => { await context.refreshData(); });
  expect(context.profile.display_name).toBe('Runner');
  expect(context.error).toBeNull();
});

it('does not publish an optimistic profile after a failed write', async () => {
  await mount();
  (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Disk full'));
  await act(async () => { await expect(context.updateProfile({ display_name: 'Changed' })).rejects.toThrow('Disk full'); });
  expect(context.profile.display_name).toBe('Runner');
  expect(JSON.parse((await AsyncStorage.getItem(PROFILE))!).display_name).toBe('Runner');
});

it('recovers a partially written weight/profile pair once, before accepting another log', async () => {
  await mount();
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key, value) => {
    if (key === PROFILE) throw new Error('Interrupted');
    return originalSet(key, value);
  });
  await act(async () => { await expect(context.logWeight(160)).rejects.toThrow('Interrupted'); });
  expect(context.weightHistory).toEqual([]);
  expect(context.profile.current_weight).toBeNull();
  await expect(context.logWeight(160)).rejects.toThrow('Load your profile');
  (AsyncStorage.setItem as jest.Mock).mockImplementation(originalSet);
  await act(async () => { await context.refreshData(); });
  expect(context.weightHistory).toHaveLength(1);
  expect(context.profile.current_weight).toBe(160);
  await act(async () => { tree.unmount(); tree = null; });
  await mount();
  expect(context.weightHistory).toHaveLength(1);
});

it('serializes rapid logs and preserves real weights when switching display units and deleting', async () => {
  await mount();
  await act(async () => { await Promise.all([context.logWeight(160), context.logWeight(162)]); });
  expect(context.weightHistory).toHaveLength(2);
  await act(async () => { await context.updateProfile({ weight_unit: 'kg' }); });
  expect(context.profile.current_weight).toBeCloseTo(73.48196, 4);
  expect(context.getWeightHistory30Days().every(entry => entry.weight_unit === 'kg')).toBe(true);
  expect(context.getWeightTrend()?.change).toBeCloseTo(0.90718474);
  await act(async () => { await context.deleteWeightEntry(context.weightHistory[0].id); });
  expect(context.profile.current_weight).toBeCloseTo(72.5747792);
});

it('refuses malformed stored history without replacing it', async () => {
  await AsyncStorage.setItem(HISTORY, '[null]');
  await mount();
  expect(context.error).toMatch('could not be loaded');
  await expect(context.logWeight(160)).rejects.toThrow('Load your profile');
  expect(await AsyncStorage.getItem(HISTORY)).toBe('[null]');
});

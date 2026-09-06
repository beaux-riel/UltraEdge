import React from 'react';
const { act, create } = require('react-test-renderer');
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DropBagProvider, useDropBags, DROP_BAG_TEMPLATE_KEY } from '../DropBagContext';
import { deleteLocalEvent } from '../../lib/localPlanStorage';

let context: ReturnType<typeof useDropBags>;
function Probe() { context = useDropBags(); return null; }
let tree: ReturnType<typeof create>;
const originalSet = (AsyncStorage.setItem as jest.Mock).getMockImplementation()!;
const originalGet = (AsyncStorage.getItem as jest.Mock).getMockImplementation()!;
const mount = async () => { await act(async () => { tree = create(<DropBagProvider><Probe /></DropBagProvider>); }); };
beforeEach(async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  (AsyncStorage.setItem as jest.Mock).mockImplementation(originalSet).mockClear();
  (AsyncStorage.getItem as jest.Mock).mockImplementation(originalGet);
  await AsyncStorage.clear();
  await AsyncStorage.setItem('@ultraedge/events', JSON.stringify([{ id: 'race-a' }, { id: 'race-b' }]));
  await AsyncStorage.setItem('ultraedge_checkpoints', JSON.stringify({ 'race-a': [{ id: 'aid-a' }] }));
});
afterEach(async () => { if (tree) await act(async () => { tree.unmount(); }); });

it('saves a durable template, reuses it in another race and keeps every copy independent after deletion', async () => {
  await mount();
  let bagId = '';
  await act(async () => {
    const bag = await context.createDropBag({ name: 'Night gear', eventId: 'race-a', checkpointId: 'aid-a', notes: 'Keep dry', items: [{ id: 'lamp', type: 'gear', refId: 'gear-lamp', name: 'Headlamp', quantity: 2 }] });
    bagId = bag.id;
  });
  await act(async () => { await context.saveDropBagTemplate(bagId); });
  const template = context.templates[0];
  expect(template).not.toHaveProperty('eventId');
  expect(template).not.toHaveProperty('checkpointId');
  expect(template.items[0].id).not.toBe(context.getDropBag(bagId)!.items[0].id);
  await act(async () => { tree.unmount(); });
  await mount();
  expect(context.templates[0]).toEqual(template);
  let secondId = '';
  await act(async () => {
    const bag = await context.createDropBag({ ...context.templates[0], eventId: 'race-b' });
    secondId = bag.id;
  });
  const second = context.getDropBag(secondId)!;
  expect(second.checkpointId).toBeNull();
  expect(second.items[0].id).not.toBe(template.items[0].id);
  await act(async () => { await context.updateItemInDropBag(secondId, second.items[0].id, { quantity: 5 }); });
  expect(context.templates[0].items[0].quantity).toBe(2);
  expect(context.getDropBag(bagId)!.items[0].quantity).toBe(2);
  await act(async () => { await deleteLocalEvent('race-a'); });
  expect(context.templates).toHaveLength(1);
  expect(context.getDropBag(secondId)!.items[0].quantity).toBe(5);
  await act(async () => { await context.deleteDropBagTemplate(template.id); });
  expect(context.getDropBag(secondId)).toBeDefined();
  await act(async () => { tree.unmount(); });
  await mount();
  expect(context.templates).toEqual([]);
  expect(context.getDropBag(secondId)!.items[0].quantity).toBe(5);
});

it('rejects a failed template write without claiming success or losing the original bag', async () => {
  await mount();
  await act(async () => { await context.createDropBag({ name: 'Night bag', eventId: 'race-a' }); });
  const id = context.dropBags[0].id;
  (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Disk full'));
  await act(async () => { await expect(context.saveDropBagTemplate(id)).rejects.toThrow('Disk full'); });
  expect(context.templates).toEqual([]);
  expect(context.getDropBag(id)).toBeDefined();
  expect(await AsyncStorage.getItem(DROP_BAG_TEMPLATE_KEY)).toBeNull();
});

it('preserves corrupt template storage and blocks writes until a successful reload', async () => {
  await AsyncStorage.setItem(DROP_BAG_TEMPLATE_KEY, 'broken');
  await mount();
  expect(context.error).toBeTruthy();
  await expect(context.createDropBag({ name: 'Bag', eventId: 'race-a' })).rejects.toThrow('load successfully');
  await expect(context.deleteDropBagTemplate('anything')).rejects.toThrow('load successfully');
  expect(await AsyncStorage.getItem(DROP_BAG_TEMPLATE_KEY)).toBe('broken');
});

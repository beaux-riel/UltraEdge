jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('../lib/attachments', () => ({ attachmentUri: (v: string) => v, saveAttachment: jest.fn() }));
import React from 'react';
import { Keyboard, ScrollView, Text, TextInput, TouchableOpacity } from 'react-native';
const { act, create } = require('react-test-renderer');
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
jest.mock('../theme', () => ({ useTheme: () => ({ theme: { colors: {}, spacing: {}, radius: {} } }) }));
jest.mock('../components/ui', () => {
  const { Text, View, TouchableOpacity } = require('react-native');
  const React = require('react');
  return { Text, H2: Text, H3: Text, Body: Text, BodySmall: Text, Caption: Text, Card: View, CardContent: View,
    Button: ({ children, ...props }: any) => React.createElement(TouchableOpacity, props, React.createElement(Text, null, children)),
  };
});
const mockCreateBag = jest.fn();
const mockUpdateBag = jest.fn();
const mockBag = { id: 'bag', name: 'Existing bag', eventId: 'race', checkpointId: null, notes: null, items: [] };
jest.mock('../context/DropBagContext', () => ({ useDropBags: () => ({
  createDropBag: mockCreateBag, updateDropBag: mockUpdateBag, getDropBag: () => mockBag,
  templates: [], loading: false, error: null,
}) }));
jest.mock('../context/EventContext', () => ({ useEvents: () => ({ events: [{ id: 'race', name: 'Test race' }], getEvent: () => ({ id: 'race', name: 'Test race' }) }) }));
jest.mock('../context/CheckpointContext', () => ({ useCheckpoints: () => ({ getCheckpointsByEventId: () => [] }), CHECKPOINT_TYPE_INFO: {} }));
jest.mock('../context/GearContext', () => ({ useGear: () => ({ gearItems: [{ id: 'lamp', name: 'Headlamp', retired: false }] }) }));
const CreateScreen = require('../screens/dropbags/CreateDropBagScreen').default;
const EditScreen = require('../screens/dropbags/EditDropBagScreen').default;
const buttonWithText = (tree: any, label: string) => tree.root.findAllByType(TouchableOpacity).find((node: any) => node.findAllByType(Text).some((text: any) => text.props.children === label));

beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  mockCreateBag.mockReset().mockResolvedValue({ id: 'new-bag' });
  mockUpdateBag.mockReset().mockResolvedValue(mockBag);
});

it.each([
  ['create', CreateScreen, 'Create Drop Bag'],
  ['edit', EditScreen, 'Save Changes'],
])('%s: typed name → one gear tap → save retains contents and blocks save behind picker', async (_kind, Screen, saveLabel) => {
  let tree: any;
  const navigation = { goBack: jest.fn() };
  const dismiss = jest.spyOn(Keyboard, 'dismiss');
  await act(async () => { tree = create(<Screen navigation={navigation} route={{ params: { eventId: 'race', dropBagId: 'bag' } }} />); });
  const name = tree.root.findAllByType(TextInput)[0];
  await act(async () => { name.props.onChangeText('Night gear'); });
  await act(async () => { buttonWithText(tree, 'Add Gear').props.onPress(); });
  expect(dismiss).toHaveBeenCalled();
  expect(buttonWithText(tree, saveLabel).props.disabled).toBe(true);
  await act(async () => { await buttonWithText(tree, saveLabel).props.onPress(); });
  expect(mockCreateBag).not.toHaveBeenCalled();
  expect(mockUpdateBag).not.toHaveBeenCalled();
  const picker = tree.root.findAllByType(ScrollView).find((node: any) => node.findAllByProps({ accessibilityLabel: 'Add Headlamp to drop bag' }).length > 0);
  expect(picker.props.keyboardShouldPersistTaps).toBe('handled');
  const addGear = tree.root.findAllByType(TouchableOpacity).find((node: any) => node.props.accessibilityLabel === 'Add Headlamp to drop bag');
  await act(async () => { addGear.props.onPress(); });
  expect(buttonWithText(tree, saveLabel).props.disabled).toBe(false);
  await act(async () => { await buttonWithText(tree, saveLabel).props.onPress(); });
  const payload = _kind === 'create' ? mockCreateBag.mock.calls[0][0] : mockUpdateBag.mock.calls[0][1];
  expect(payload).toEqual(expect.objectContaining({ name: 'Night gear', items: [expect.objectContaining({ name: 'Headlamp', refId: 'lamp', quantity: 1 })] }));
  expect(navigation.goBack).toHaveBeenCalledTimes(1);
  await act(async () => { tree.unmount(); });
  dismiss.mockRestore();
});

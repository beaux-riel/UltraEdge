import React from 'react';
import { Text, TextInput, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
const { act, create } = require('react-test-renderer');
import { loadEventCrewAssignments } from '../lib/eventCrew';
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' } }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
jest.mock('../theme', () => ({ useTheme: () => ({ theme: { colors: {}, spacing: {}, radius: {} } }) }));
jest.mock('../components/ui', () => {
  const { Text, View, TouchableOpacity } = require('react-native');
  const React = require('react');
  return { Text, H1: Text, H2: Text, H3: Text, Body: Text, BodySmall: Text, Label: Text, Card: View, CardContent: View,
    Button: ({ children, ...props }: any) => React.createElement(TouchableOpacity, props, React.createElement(Text, null, children)),
  };
});
let mockMembers: any[] = [];
const mockCreateCrewMember = jest.fn();
jest.mock('../context/CrewContext', () => ({
  ...jest.requireActual('../context/CrewContext'),
  useCrewMembers: () => ({ crewMembers: mockMembers, loading: false, error: null, createCrewMember: mockCreateCrewMember }),
}));
const Screen = require('../screens/events/SelectCrewScreen').default;
const buttonWithText = (tree: any, label: string) => tree.root.findAllByType(TouchableOpacity).find((node: any) => node.findAllByType(Text).some((text: any) => text.props.children === label));

beforeEach(async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  await AsyncStorage.clear();
  mockMembers = [{ id: 'existing', name: 'Existing crew' }, { id: 'new', name: 'New crew' }];
  await AsyncStorage.setItem('@ultraedge/events', JSON.stringify([{ id: 'race' }]));
  await AsyncStorage.setItem('@ultraedge/crew', JSON.stringify(mockMembers));
  await AsyncStorage.setItem('@ultraedge/event-crew', JSON.stringify([{ eventId: 'race', crewMemberId: 'existing', roles: ['driver'] }]));
});

it('keeps newly created crew selected after assignments load and saves alongside existing roles', async () => {
  let tree: any;
  const navigation = { goBack: jest.fn(), replace: jest.fn() };
  await act(async () => { tree = create(<Screen navigation={navigation} route={{ params: { eventId: 'race', selectedCrewId: 'new' } }} />); });
  await act(async () => { await buttonWithText(tree, 'Save').props.onPress(); });
  expect(await loadEventCrewAssignments()).toEqual([
    expect.objectContaining({ crewMemberId: 'existing', roles: ['driver'] }),
    expect.objectContaining({ crewMemberId: 'new', roles: [] }),
  ]);
  expect(navigation.goBack).toHaveBeenCalledTimes(1);
  await act(async () => { tree.unmount(); });
});

it('replaces an empty selector with creation so there is no stale selector underneath', async () => {
  mockMembers = [];
  await AsyncStorage.setItem('@ultraedge/event-crew', '[]');
  let tree: any;
  const navigation = { goBack: jest.fn(), replace: jest.fn() };
  await act(async () => { tree = create(<Screen navigation={navigation} route={{ params: { eventId: 'race' } }} />); });
  const button = tree.root.findAllByType(TouchableOpacity).find((node: any) => node.findAllByType(Text).some((text: any) => typeof text.props.children === 'string' && text.props.children.includes('Create')));
  await act(async () => { button.props.onPress(); });
  expect(navigation.replace).toHaveBeenCalledWith('CreateCrew', { eventId: 'race' });
  await act(async () => { tree.unmount(); });
});

const roleChip = (tree: any, label: string) => tree.root.findAllByType(TouchableOpacity).find((node: any) => node.props.accessibilityLabel === label);

it('lets a newly created member choose multiple roles before saving', async () => {
  let tree: any;
  await act(async () => { tree = create(<Screen navigation={{ goBack: jest.fn() }} route={{ params: { eventId: 'race', selectedCrewId: 'new' } }} />); });
  expect(tree.root.findAllByType(TouchableOpacity).filter((node: any) => node.props.accessibilityRole === 'checkbox')[0].props.accessibilityLabel).toBe('New crew');
  await act(async () => { roleChip(tree, 'Pacer for New crew').props.onPress(); });
  await act(async () => { roleChip(tree, 'Driver for New crew').props.onPress(); });
  expect(roleChip(tree, 'Pacer for New crew').props.accessibilityState.checked).toBe(true);
  await act(async () => { await buttonWithText(tree, 'Save').props.onPress(); });
  expect((await loadEventCrewAssignments()).find(a => a.crewMemberId === 'new')?.roles).toEqual(['pacer', 'driver']);
  await act(async () => { tree.unmount(); });
});

it('edits an existing assignment without changing the same member’s roles at another race', async () => {
  await AsyncStorage.setItem('@ultraedge/events', JSON.stringify([{ id: 'race' }, { id: 'other-race' }]));
  await AsyncStorage.setItem('@ultraedge/event-crew', JSON.stringify([
    { eventId: 'race', crewMemberId: 'existing', roles: ['driver'] },
    { eventId: 'other-race', crewMemberId: 'existing', roles: ['crew_chief'] },
  ]));
  let tree: any;
  await act(async () => { tree = create(<Screen navigation={{ goBack: jest.fn() }} route={{ params: { eventId: 'race', selectedCrewId: 'existing' } }} />); });
  await act(async () => { roleChip(tree, 'Driver for Existing crew').props.onPress(); });
  await act(async () => { roleChip(tree, 'Pacer for Existing crew').props.onPress(); });
  await act(async () => { await buttonWithText(tree, 'Save').props.onPress(); });
  const saved = await loadEventCrewAssignments();
  expect(saved.find(a => a.eventId === 'race')?.roles).toEqual(['pacer']);
  expect(saved.find(a => a.eventId === 'other-race')?.roles).toEqual(['crew_chief']);
  await act(async () => { tree.unmount(); });
});


it('continues straight from creating a race crew member to choosing their roles', async () => {
  const CreateScreen = require('../screens/crew/CreateCrewScreen').default;
  mockCreateCrewMember.mockResolvedValue({ id: 'created' });
  const navigation = { goBack: jest.fn(), replace: jest.fn() };
  let tree: any;
  await act(async () => { tree = create(<CreateScreen navigation={navigation} route={{ params: { eventId: 'race' } }} />); });
  await act(async () => { tree.root.findAllByType(TextInput)[0].props.onChangeText('Taylor'); });
  await act(async () => { await buttonWithText(tree, 'Next: Roles').props.onPress(); });
  expect(mockCreateCrewMember).toHaveBeenCalledWith(expect.objectContaining({ name: 'Taylor' }));
  expect(navigation.replace).toHaveBeenCalledWith('SelectCrew', { eventId: 'race', selectedCrewId: 'created' });
  expect(navigation.goBack).not.toHaveBeenCalled();
  await act(async () => { tree.unmount(); });
});

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => any) => require('react').useEffect(callback, [callback]),
}));
jest.mock('../context/EventContext', () => ({
  useEvents: () => ({ getEvent: (id: string) => ({ id, name: 'Mountain race' }) }),
}));

it('opens race-specific role editing from the crew member’s assigned event', async () => {
  const DetailScreen = require('../screens/crew/CrewDetailScreen').default;
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  let tree: any;
  await act(async () => { tree = create(<DetailScreen navigation={navigation} route={{ params: { crewId: 'existing' } }} />); });
  await act(async () => { buttonWithText(tree, 'Edit roles').props.onPress(); });
  expect(navigation.navigate).toHaveBeenCalledWith('SelectCrew', { eventId: 'race', selectedCrewId: 'existing' });
  await act(async () => { tree.unmount(); });
});

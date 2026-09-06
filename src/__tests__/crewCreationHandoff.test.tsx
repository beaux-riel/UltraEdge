import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
const { act, create } = require('react-test-renderer');
import { loadEventCrewAssignments } from '../lib/eventCrew';
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
jest.mock('../theme', () => ({ useTheme: () => ({ theme: { colors: {}, spacing: {}, radius: {} } }) }));
jest.mock('../components/ui', () => {
  const { Text, View, TouchableOpacity } = require('react-native');
  const React = require('react');
  return { Text, H1: Text, H3: Text, Body: Text, BodySmall: Text,
    Button: ({ children, ...props }: any) => React.createElement(TouchableOpacity, props, React.createElement(Text, null, children)),
  };
});
let mockMembers: any[] = [];
jest.mock('../context/CrewContext', () => ({
  ...jest.requireActual('../context/CrewContext'),
  useCrewMembers: () => ({ crewMembers: mockMembers, loading: false, error: null }),
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

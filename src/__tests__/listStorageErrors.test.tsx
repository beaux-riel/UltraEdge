jest.mock('../components/LiveRacePanel', () => () => null);
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
const { act, create } = require('react-test-renderer');
const mockRefresh = jest.fn(async () => {});
let mockError: string | null = 'Saved data could not be loaded';
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@react-navigation/native', () => ({ useFocusEffect: () => {} }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }: any) => children,
  Swipeable: ({ children }: any) => children,
}));
jest.mock('../theme', () => ({ useTheme: () => ({ theme: { colors: {}, spacing: {}, radius: {} } }) }));
jest.mock('../components/ui', () => {
  const { Text, View, TouchableOpacity } = require('react-native');
  const React = require('react');
  return {
    Text, H1: Text, H2: Text, H3: Text, Body: Text, BodySmall: Text, Caption: Text,
    Card: View, CardContent: View, WeightBadge: () => null,
    Button: ({ children, onPress, disabled }: any) => React.createElement(TouchableOpacity, { onPress, disabled }, React.createElement(Text, null, children)),
  };
});
jest.mock('../context/EventContext', () => ({ useEvents: () => ({ events: [], loading: false, error: mockError, refreshEvents: mockRefresh }) }));
jest.mock('../context/CrewContext', () => ({ useCrewMembers: () => ({ crewMembers: [], loading: false, error: mockError, refreshCrewMembers: mockRefresh }) }));
jest.mock('../context/GearContext', () => ({ useGear: () => ({ gearItems: [], loading: false, error: mockError, refreshGear: mockRefresh }) }));
jest.mock('../context/DropBagContext', () => ({ useDropBags: () => ({ dropBags: [], loading: false, error: mockError, refreshDropBags: mockRefresh }) }));
jest.mock('../context/CheckpointContext', () => ({ useCheckpoints: () => ({ loading: false, error: null, refreshCheckpoints: mockRefresh }) }));

it.each([
  ['events', '../screens/events/EventsListScreen', 'Create Event'],
  ['crew', '../screens/crew/CrewListScreen', 'Add Your First Crew Member'],
  ['gear', '../screens/gear/GearListScreen', 'Add Your First Item'],
  ['drop bags', '../screens/dropbags/DropBagsListScreen', 'Create Your First Drop Bag'],
])('%s reports read failure instead of a false first-use state and offers real retry', async (_, modulePath, emptyCTA) => {
  mockError = 'Saved data could not be loaded';
  mockRefresh.mockClear();
  const Screen = require(modulePath).default;
  let tree: any;
  await act(async () => { tree = create(<Screen navigation={{ navigate: jest.fn() }} route={{ params: {} }} />); });
  const labels = tree.root.findAllByType(Text).map((node: any) => node.props.children).flat().join(' ');
  expect(labels).toContain(mockError);
  expect(labels).not.toContain(emptyCTA);
  const retry = tree.root.findAllByType(TouchableOpacity).find((node: any) =>
    node.findAllByType(Text).some((text: any) => text.props.children === 'Retry loading saved data'));
  expect(retry).toBeDefined();
  await act(async () => { retry.props.onPress(); });
  expect(mockRefresh).toHaveBeenCalled();
  mockError = null;
  await act(async () => { tree.update(<Screen navigation={{ navigate: jest.fn() }} route={{ params: {} }} />); });
  const recoveredLabels = tree.root.findAllByType(Text).map((node: any) => node.props.children).flat().join(' ');
  expect(recoveredLabels).toContain(emptyCTA);
  await act(async () => { tree.unmount(); });
});

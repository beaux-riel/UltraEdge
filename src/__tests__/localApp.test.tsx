import React from 'react';
import { Text } from 'react-native';
const { act, create } = require('react-test-renderer');

// These modules must stay outside the local release's startup graph.
jest.mock('../context/AuthContext', () => { throw new Error('Local app imported account services'); });
jest.mock('../context/SubscriptionContext', () => { throw new Error('Local app imported billing'); });
jest.mock('@sentry/react-native', () => { throw new Error('Local app imported diagnostics'); });
jest.mock('react-native-get-random-values', () => ({}));
jest.mock('react-native-url-polyfill/auto', () => ({}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaProvider: ({ children }: any) => children }));
jest.mock('react-native-gesture-handler', () => ({ GestureHandlerRootView: ({ children }: any) => children }));
jest.mock('../theme', () => ({
  ThemeProvider: ({ children }: any) => children,
  useTheme: () => ({ isDarkMode: false }),
}));
jest.mock('../hooks/useFonts', () => ({ useFonts: () => ({ fontsLoaded: true }) }));
jest.mock('../context/MoverContext', () => ({ MoverProvider: ({ children }: any) => children }));
jest.mock('../context/EventContext', () => ({ EventProvider: ({ children }: any) => children }));
jest.mock('../context/CheckpointContext', () => ({ CheckpointProvider: ({ children }: any) => children }));
jest.mock('../context/GearContext', () => ({ GearProvider: ({ children }: any) => children }));
jest.mock('../context/CrewContext', () => ({ CrewProvider: ({ children }: any) => children }));
jest.mock('../context/DropBagContext', () => ({ DropBagProvider: ({ children }: any) => children }));
jest.mock('../components/ErrorBoundary', () => ({ children }: any) => children);
jest.mock('../navigation/AppNavigator', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, null, 'Local planner');
});

it('reaches the local planner without importing account, billing or diagnostic providers', async () => {
  const App = require('../../App').default;
  let tree: any;
  await act(async () => { tree = create(<App />); });
  expect(tree.root.findByType(Text).props.children).toBe('Local planner');
  await act(async () => { tree.unmount(); });
});

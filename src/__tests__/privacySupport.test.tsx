import React from 'react';
import { Alert, Linking, Text, TouchableOpacity } from 'react-native';
import PrivacySupportScreen from '../screens/settings/PrivacySupportScreen';
const { act, create } = require('react-test-renderer');
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ bottom: 0 }) }));
jest.mock('../theme', () => ({ useTheme: () => ({ theme: { colors: {} } }) }));
jest.mock('../components/ui', () => {
  const { Text } = require('react-native');
  return { H2: Text, Body: Text, BodySmall: Text };
});
afterEach(() => { jest.restoreAllMocks(); });

it('renders privacy and support offline and opens the public tracker only when explicitly pressed', async () => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  let tree: any;
  await act(async () => { tree = create(<PrivacySupportScreen />); });
  expect(open).not.toHaveBeenCalled();
  const copy = tree.root.findAllByType(Text).map((node: any) => node.props.children).flat().join(' ');
  expect(copy).toContain('Offload App keeps');
  expect(copy).toContain('Issues are public');
  expect(copy).toContain('cannot restore an editable plan');
  await act(async () => { tree.root.findByType(TouchableOpacity).props.onPress(); });
  expect(open).toHaveBeenCalledWith('https://github.com/beaux-riel/UltraEdge/issues');
  await act(async () => { tree.unmount(); });
});

it('keeps offline help available when the external support link cannot open', async () => {
  jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('Offline'));
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  let tree: any;
  await act(async () => { tree = create(<PrivacySupportScreen />); });
  await act(async () => { tree.root.findByType(TouchableOpacity).props.onPress(); });
  expect(alert).toHaveBeenCalledWith('Could not open support', expect.stringContaining('github.com/beaux-riel/UltraEdge/issues'));
  await act(async () => { tree.unmount(); });
});

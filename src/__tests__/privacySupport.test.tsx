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
beforeEach(() => { jest.clearAllMocks(); });
afterEach(() => { jest.restoreAllMocks(); });

it('renders offline and opens policy/support only when explicitly pressed', async () => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  let tree: any;
  await act(async () => { tree = create(<PrivacySupportScreen />); });
  expect(open).not.toHaveBeenCalled();
  const copy = tree.root.findAllByType(Text).map((node: any) => node.props.children).flat().join(' ');
  expect(copy).toContain('Offload App keeps');
  expect(copy).not.toContain('Live team races');
  expect(copy).toContain('cannot restore an editable plan');
  expect(copy).toContain('UltraEdge is operated by Beaux Walton');
  expect(copy).toContain('contact hello@heybeaux.dev');
  await act(async () => { tree.root.findAllByType(TouchableOpacity)[0].props.onPress(); });
  expect(open).toHaveBeenLastCalledWith('https://ultraedge.heybeaux.dev/privacy');
  await act(async () => { tree.root.findAllByType(TouchableOpacity)[1].props.onPress(); });
  expect(open).toHaveBeenLastCalledWith('https://ultraedge.heybeaux.dev/support');
  await act(async () => { tree.root.findAllByType(TouchableOpacity)[2].props.onPress(); });
  expect(open).toHaveBeenLastCalledWith('mailto:hello@heybeaux.dev');
  expect(open).toHaveBeenCalledTimes(3);
  await act(async () => { tree.unmount(); });
});

it('offers the approved private address if no mail handler opens, without a public fallback', async () => {
  const open = jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('No email app'));
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  let tree: any;
  await act(async () => { tree = create(<PrivacySupportScreen />); });
  expect(open).not.toHaveBeenCalled();
  const emailLink = tree.root.findAllByType(TouchableOpacity).find((node: any) => node.props.accessibilityLabel?.startsWith('Email Beaux Walton'));
  await act(async () => { emailLink.props.onPress(); });
  expect(open).toHaveBeenCalledTimes(1);
  expect(open).toHaveBeenCalledWith('mailto:hello@heybeaux.dev');
  expect(alert).toHaveBeenCalledWith('Could not open email', expect.stringContaining('hello@heybeaux.dev'));
  expect(alert).toHaveBeenCalledWith('Could not open email', expect.stringContaining('UltraEdge has not sent an email'));
  await act(async () => { tree.unmount(); });
});

it('keeps offline help available when the external support link cannot open', async () => {
  jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('Offline'));
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  let tree: any;
  await act(async () => { tree = create(<PrivacySupportScreen />); });
  await act(async () => { tree.root.findAllByType(TouchableOpacity)[1].props.onPress(); });
  expect(alert).toHaveBeenCalledWith('Could not open support', expect.stringContaining('https://ultraedge.heybeaux.dev/support'));
  await act(async () => { tree.root.findAllByType(TouchableOpacity)[0].props.onPress(); });
  expect(alert).toHaveBeenCalledWith('Could not open privacy policy', expect.stringContaining('https://ultraedge.heybeaux.dev/privacy'));
  await act(async () => { tree.unmount(); });
});

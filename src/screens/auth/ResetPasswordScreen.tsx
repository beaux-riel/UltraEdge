import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, H1, Button } from '../../components/ui';
import { useTheme } from '../../theme';
import { useAuth } from '../../context/AuthContext';

/** Shown only after the server accepts a recovery link, including cold launches. */
export default function ResetPasswordScreen() {
  const { theme: { colors } } = useTheme();
  const insets = useSafeAreaInsets();
  const { updatePassword, cancelPasswordRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (password.length < 8 || password !== confirmation) {
      Alert.alert('Check Password', password.length < 8 ? 'Use at least 8 characters.' : 'The passwords do not match.');
      return;
    }
    setBusy(true);
    const result = await updatePassword(password);
    setBusy(false);
    Alert.alert(result.success ? 'Password Updated' : 'Could Not Update Password',
      result.success ? 'Your new password is saved.' : result.error);
  };
  const cancel = async () => {
    setBusy(true);
    try { await cancelPasswordRecovery(); }
    catch { Alert.alert('Could Not Sign Out', 'Please try again to close the recovery session.'); }
    finally { setBusy(false); }
  };
  const inputStyle = { minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    padding: 14, color: colors.bark, marginTop: 16, fontSize: 16 };
  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.parchment }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }}>
      <H1>Choose a new password</H1>
      <Body style={{ marginTop: 12 }}>Use at least 8 characters. Your race plans stay on this device.</Body>
      <TextInput style={inputStyle} accessibilityLabel="New password" placeholder="New password" placeholderTextColor={colors.stone}
        secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword"
        value={password} onChangeText={setPassword} editable={!busy} />
      <TextInput style={inputStyle} accessibilityLabel="Confirm new password" placeholder="Confirm new password" placeholderTextColor={colors.stone}
        secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword"
        value={confirmation} onChangeText={setConfirmation} editable={!busy} />
      <Button onPress={save} loading={busy} disabled={busy} style={{ marginTop: 24 }}>Save Password</Button>
      <Button onPress={cancel} disabled={busy} variant="secondary" style={{ marginTop: 12 }}>Cancel and Sign Out</Button>
    </ScrollView>
  </KeyboardAvoidingView>;
}

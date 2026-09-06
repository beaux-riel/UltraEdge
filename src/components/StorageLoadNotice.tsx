import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Body, Button } from './ui';

export default function StorageLoadNotice({ error, loading, onRetry }: {
  error: string | null;
  loading: boolean;
  onRetry: () => Promise<void>;
}) {
  return (
    <View style={{ padding: 24 }} accessibilityLiveRegion="polite">
      {loading ? <>
        <ActivityIndicator accessibilityLabel="Loading saved data" />
        <Body>Loading saved data…</Body>
      </> : <>
        <Body>{error}. Your saved data has not been replaced. Retry loading before editing.</Body>
        <Button onPress={() => { void onRetry(); }}>Retry loading saved data</Button>
      </>}
    </View>
  );
}

import React from 'react';
import { View } from 'react-native';
import { useMover } from '../context/MoverContext';
import { BodySmall, Button } from './ui';

export default function MoverStorageNotice() {
  const { error, isLoading, refreshData } = useMover();
  if (!error && !isLoading) return null;
  return (
    <View style={{ padding: 20 }} accessibilityLiveRegion="polite">
      <BodySmall>{isLoading ? 'Loading your profile and weight history…' : error}</BodySmall>
      {error && <Button onPress={() => { void refreshData(); }} disabled={isLoading}>
        Retry loading saved profile
      </Button>}
    </View>
  );
}

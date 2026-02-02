/**
 * Placeholder Screen
 * Used for tabs that aren't built yet
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { Text, H2, Body, Button } from '../components/ui';

interface PlaceholderScreenProps {
  route?: {
    params?: {
      title?: string;
    };
  };
}

export default function PlaceholderScreen({ route }: PlaceholderScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const title = route?.params?.title || 'Coming Soon';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.parchment,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.content}>
        <Text variant="display" color="secondary" style={styles.emoji}>
          🚧
        </Text>
        <H2 align="center" style={styles.title}>
          {title}
        </H2>
        <Body color="secondary" align="center" style={styles.description}>
          This screen is under construction.{'\n'}
          Check back soon!
        </Body>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    maxWidth: 280,
  },
});

/**
 * Placeholder Screen Factory
 * Generates placeholder screens while agents build the real ones
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { Text, H2, Body, Button } from '../components/ui';

interface PlaceholderProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  description?: string;
}

export function createPlaceholderScreen({ title, icon, description }: PlaceholderProps) {
  return function PlaceholderScreen({ navigation }: any) {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();

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
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.forest + '15' }]}>
            <Ionicons name={icon} size={48} color={theme.colors.forest} />
          </View>
          <H2 align="center" style={styles.title}>
            {title}
          </H2>
          <Body color="secondary" align="center" style={styles.description}>
            {description || 'This screen is being built by an agent.\nCheck back in a moment!'}
          </Body>
          <Button 
            variant="secondary" 
            onPress={() => navigation.goBack()}
            style={styles.button}
          >
            Go Back
          </Button>
        </View>
      </View>
    );
  };
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
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    maxWidth: 280,
    marginBottom: 24,
  },
  button: {
    minWidth: 120,
  },
});

export default createPlaceholderScreen;

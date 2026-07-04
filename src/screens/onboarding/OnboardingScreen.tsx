/**
 * UltraEdge Onboarding Screen
 * Four-slide first-launch walkthrough ending in a premium CTA.
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useTheme } from '../../theme';
import { H1, Body, BodySmall, Button } from '../../components/ui';
import { setOnboardingComplete } from '../../lib/onboarding';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

interface Slide {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: 'forest' | 'trail' | 'sky' | 'sunrise';
  title: string;
  body: string;
  premium?: boolean;
}

const SLIDES: Slide[] = [
  {
    key: 'plan',
    icon: 'trail-sign-outline',
    iconColor: 'forest',
    title: 'Plan your race',
    body: 'Build your events, drop in checkpoints, and dial your pacing before the gun goes off.',
  },
  {
    key: 'gear',
    icon: 'bag-handle-outline',
    iconColor: 'trail',
    title: 'Dial in your gear',
    body: 'Kit lists for every race. Track what you wear and what you carry — down to the gram.',
  },
  {
    key: 'crew',
    icon: 'people-outline',
    iconColor: 'sky',
    title: 'Rally your crew',
    body: 'Add your people once, then assign roles per event. Pacer at mile 60, driver at dawn.',
  },
  {
    key: 'premium',
    icon: 'sparkles',
    iconColor: 'sunrise',
    title: 'Race with an edge',
    body: 'Sync every plan across your devices, unlock full crew features, and get race-day intelligence when it counts.',
    premium: true,
  },
];

export default function OnboardingScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const listRef = useRef<FlatList<Slide>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const finish = useCallback(
    async (destination: 'app' | 'subscription') => {
      // Persist before navigating so onboarding can never reappear
      await setOnboardingComplete();
      if (destination === 'subscription') {
        navigation.reset({
          index: 1,
          routes: [{ name: 'Main' }, { name: 'Subscription' }],
        });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      }
    },
    [navigation]
  );

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const renderSlide = ({ item }: { item: Slide }) => {
    const tint = colors[item.iconColor];

    return (
      <View style={[styles.slide, { width }]}>
        <View style={[styles.iconBadge, { backgroundColor: tint + '18' }]}>
          <Ionicons name={item.icon} size={72} color={tint} />
        </View>
        <H1 align="center" style={{ marginTop: spacing.xl }}>
          {item.title}
        </H1>
        <Body
          color="secondary"
          align="center"
          style={{ marginTop: spacing.md, paddingHorizontal: spacing.xl }}
        >
          {item.body}
        </Body>

        {item.premium && (
          <View style={styles.premiumList}>
            {[
              { icon: 'cloud-done-outline' as const, label: 'Cloud sync across devices' },
              { icon: 'people-circle-outline' as const, label: 'Full crew management & notifications' },
              { icon: 'pulse-outline' as const, label: 'Live predictions & pace analysis' },
            ].map(feature => (
              <View key={feature.label} style={styles.premiumRow}>
                <Ionicons name={feature.icon} size={20} color={colors.sunrise} />
                <BodySmall style={{ marginLeft: spacing.sm, flex: 1 }}>
                  {feature.label}
                </BodySmall>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.parchment }]}>
      {/* Skip */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        {!isLastSlide ? (
          <TouchableOpacity
            onPress={() => finish('app')}
            style={styles.skipButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Body color="secondary">Skip</Body>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipButton} />
        )}
      </View>

      {/* Slides */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={item => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((slide, index) => (
          <View
            key={slide.key}
            style={[
              styles.dot,
              {
                backgroundColor: index === currentIndex ? colors.forest : colors.border,
                width: index === currentIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        {isLastSlide ? (
          <>
            <Button fullWidth size="lg" onPress={() => finish('subscription')}>
              Start Premium
            </Button>
            <Button
              fullWidth
              variant="tertiary"
              onPress={() => finish('app')}
              style={{ marginTop: spacing.sm }}
            >
              Maybe later
            </Button>
          </>
        ) : (
          <Button fullWidth size="lg" onPress={handleNext}>
            Next
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
  },
  skipButton: {
    minWidth: 44,
    minHeight: 32,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconBadge: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumList: {
    marginTop: 28,
    alignSelf: 'stretch',
    paddingHorizontal: 32,
  },
  premiumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  footer: {
    paddingHorizontal: 24,
  },
});

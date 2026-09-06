/**
 * UltraEdge Onboarding Screen
 * First-launch introduction to the free local race planner.
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  ViewToken,
  ScrollView,
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

}

const SLIDES: Slide[] = [
  {
    key: 'plan',
    icon: 'trail-sign-outline',
    iconColor: 'forest',
    title: 'Plan your race',
    body: 'Create an event, add checkpoints and cutoffs, and keep your race preparation in one place.',
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
    body: 'Keep crew contacts and assign roles for each event. Add checkpoint instructions so everyone knows the plan.',
  },
  {
    key: 'share',
    icon: 'document-text-outline',
    iconColor: 'sunrise',
    title: 'Share the plan',
    body: 'Export a PDF for your crew before race day. Your editable plans stay on this device; save a copy of the PDF somewhere safe. A PDF cannot restore an editable plan. No account or payment is needed.',
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
    },
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const finish = useCallback(
    async () => {
      await setOnboardingComplete();
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    },
    [navigation],
  );

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const renderSlide = ({ item }: { item: Slide }) => {
    const tint = colors[item.iconColor];

    return (
      <ScrollView style={{ width }} contentContainerStyle={styles.slide}>
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

      </ScrollView>
    );
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.parchment }]}>
      {/* Skip */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        {!isLastSlide ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Skip introduction"
            onPress={() => finish()}
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
        key={width}
        initialScrollIndex={currentIndex}
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

      <BodySmall align="center" style={{ marginVertical: spacing.sm }}>
        {currentIndex + 1} of {SLIDES.length}
      </BodySmall>
      {/* Dots */}
      <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
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
          <Button fullWidth size="lg" onPress={() => finish()} style={styles.action}>
            Start planning
          </Button>
        ) : (
          <Button fullWidth size="lg" onPress={handleNext} style={styles.action}>
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
    minHeight: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  slide: {
    flexGrow: 1,
    paddingVertical: 24,
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
  action: {
    height: undefined,
    minHeight: 56,
    paddingVertical: 14,
  },
  footer: {
    paddingHorizontal: 24,
  },
});

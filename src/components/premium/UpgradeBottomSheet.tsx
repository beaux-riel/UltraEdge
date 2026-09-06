/** Compatibility surface for deferred premium entry points; V1 never sells a plan. */
import React, { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { H1, Body, Button } from '../ui';
import type { PricingTier } from './PricingCard';

export interface UpgradeBottomSheetRef {
  open: () => void;
  close: () => void;
}

interface UpgradeBottomSheetProps {
  // Retain the interface for future billing integration, but never invoke purchases in V1.
  onPurchase?: (tier: PricingTier) => Promise<boolean>;
  onRestore?: () => Promise<boolean>;
  onDismiss?: () => void;
  featureName?: string;
}

export const UpgradeBottomSheet = forwardRef<UpgradeBottomSheetRef, UpgradeBottomSheetProps>(
  ({ onDismiss }, ref) => {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const sheetRef = useRef<BottomSheet>(null);
    useImperativeHandle(ref, () => ({
      open: () => sheetRef.current?.expand(),
      close: () => sheetRef.current?.close(),
    }));
    const backdrop = useCallback((props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ), []);

    return (
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={['70%']}
        enablePanDownToClose
        backdropComponent={backdrop}
        onClose={onDismiss}
        backgroundStyle={{ backgroundColor: theme.colors.parchment }}
      >
        <BottomSheetScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
          <H1>Plan for free</H1>
          <Body style={styles.paragraph}>
            Local race planning and PDF sharing are included. No subscription or purchase
            is available in this version.
          </Body>
          <Body color="secondary" style={styles.paragraph}>
            Plans stay on this device. Cloud sync, crew notifications and live predictions
            are not available. Export your event PDF to share a readable copy with your crew.
          </Body>
          <Button fullWidth onPress={() => sheetRef.current?.close()} style={styles.button}>
            Continue planning
          </Button>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  },
);
UpgradeBottomSheet.displayName = 'UpgradeBottomSheet';

const styles = StyleSheet.create({
  content: { padding: 24 },
  paragraph: { marginTop: 20 },
  button: { marginTop: 24, height: undefined, minHeight: 48, paddingVertical: 14 },
});

export default UpgradeBottomSheet;

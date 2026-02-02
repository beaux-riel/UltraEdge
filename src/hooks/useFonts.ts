/**
 * Font Loading Hook
 * Loads all custom fonts for the Organic design system
 */

import { useFonts as useExpoFonts } from 'expo-font';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';

export function useFonts() {
  const [fontsLoaded, fontError] = useExpoFonts({
    // Nunito - Primary font
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    // Playfair Display - Display numbers
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    // JetBrains Mono - Data/weight values
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  return { fontsLoaded, fontError };
}

export default useFonts;

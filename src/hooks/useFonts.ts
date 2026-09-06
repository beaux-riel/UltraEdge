/** Native type with bundled monospaced figures. */
import { useFonts as useExpoFonts } from 'expo-font';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
export function useFonts() {
  const [fontsLoaded, fontError] = useExpoFonts({ JetBrainsMono_400Regular, JetBrainsMono_500Medium });
  return { fontsLoaded, fontError };
}
export default useFonts;

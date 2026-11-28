import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Baloo2_600SemiBold, Baloo2_700Bold, Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2';
import { Nunito_600SemiBold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { GameProvider, useTheme } from '@/state/GameProvider';
import { audio } from '@/services/audio';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Nav() {
  const { c, isDark, reducedMotion } = useTheme();
  return (
    <>
      {/* Full-screen game: hide the phone's status and navigation bars (swipe from the edge to show them). */}
      <StatusBar hidden style={isDark ? 'light' : 'dark'} />
      <NavigationBar hidden />
      <Stack screenOptions={{ headerShown: false, animation: reducedMotion ? 'none' : 'fade', contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Screen name="pause" options={{ presentation: 'transparentModal', animation: reducedMotion ? 'none' : 'fade' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({ Baloo2_600SemiBold, Baloo2_700Bold, Baloo2_800ExtraBold, Nunito_600SemiBold, Nunito_800ExtraBold });
  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => {});
      audio.init();
    }
  }, [loaded, error]);
  if (!loaded && !error) return null;
  return (
    <SafeAreaProvider>
      <GameProvider>
        <Nav />
      </GameProvider>
    </SafeAreaProvider>
  );
}

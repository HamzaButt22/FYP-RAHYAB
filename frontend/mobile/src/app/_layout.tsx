// Root of the app: loads the brand fonts and saved settings behind the splash screen, then sends the
// student to the right place: language choice (S-01), onboarding (S-02, S-03) or the main tabs.

import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import { AtkinsonHyperlegible_400Regular } from '@expo-google-fonts/atkinson-hyperlegible';
import { Gulzar_400Regular } from '@expo-google-fonts/gulzar';
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import '@/i18n';
import { AppStateProvider, useAppState } from '@/state/AppState';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync();

function Navigation() {
  const { ready, language, onboardingDone } = useAppState();
  const { colors, scheme } = useTheme();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={!language}>
          <Stack.Screen name="language" />
        </Stack.Protected>
        <Stack.Protected guard={!!language && !onboardingDone}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
        <Stack.Protected guard={!!language && onboardingDone}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
      </Stack>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_800ExtraBold,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    Gulzar_400Regular,
    AtkinsonHyperlegible_400Regular,
  });
  // If a font fails to load, carry on with the system font rather than a blank screen.
  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider>
      <AppStateProvider>
        <Navigation />
      </AppStateProvider>
    </ThemeProvider>
  );
}

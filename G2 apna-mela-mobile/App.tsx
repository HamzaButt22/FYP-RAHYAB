import React, { useEffect } from 'react';
import { Animated, AppState, Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as ScreenOrientation from 'expo-screen-orientation';
import { NavigationBar } from 'expo-navigation-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/app/AppContext';
import { LayoutProvider, useL } from './src/ui/layout';
import { Img, T, useAppear } from './src/ui/kit';
import { FxLayer, ToastLayer } from './src/ui/overlayLayers';
import { CREAM, INK2 } from './src/ui/theme';
import { Avatar, BeforeStart, MainMenu } from './src/screens/Menu';
import { DayIntro, Dialogue, Story } from './src/screens/Story';
import { Diary, HowCard, LovedIt, MapScreen, StallScreen, Summary, WhatCard } from './src/screens/Gameplay';
import { Ending, Results, Reveal } from './src/screens/Results';
import { OverlayView } from './src/screens/Overlays';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const FONT_FILES = {
  'Baloo2-Bold': require('./assets/game/fonts/Baloo2-Bold.ttf'),
  'Baloo2-ExtraBold': require('./assets/game/fonts/Baloo2-ExtraBold.ttf'),
  'Nunito-Regular': require('./assets/game/fonts/Nunito-Regular.ttf'),
  'Nunito-SemiBold': require('./assets/game/fonts/Nunito-SemiBold.ttf'),
  'Nunito-Bold': require('./assets/game/fonts/Nunito-Bold.ttf'),
  'Nunito-ExtraBold': require('./assets/game/fonts/Nunito-ExtraBold.ttf'),
};

export default function App() {
  const [fontsLoaded, fontError] = useFonts(FONT_FILES);
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => undefined);
    if (Platform.OS === 'android') {
      try {
        NavigationBar.setHidden(true);
      } catch {
        /* older runtime */
      }
    }
  }, []);
  if (!fontsLoaded && !fontError) return null;
  return (
    <SafeAreaProvider>
      <LayoutProvider>
        <AppProvider>
          <StatusBar hidden />
          {Platform.OS === 'android' ? <NavigationBar hidden /> : null}
          <Root />
        </AppProvider>
      </LayoutProvider>
    </SafeAreaProvider>
  );
}

function Root() {
  const app = useApp();
  const L = useL();
  useKeepAwake();
  useEffect(() => {
    app.init().finally(() => SplashScreen.hide());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      app.audio.suspend(st !== 'active');
      if (st === 'active' && Platform.OS === 'android') {
        try {
          NavigationBar.setHidden(true);
        } catch {
          /* ignore */
        }
      }
    });
    return () => sub.remove();
  }, [app.audio]);
  if (!app.ready) return <View style={{ flex: 1, backgroundColor: CREAM }} />;
  return (
    <View style={styles.root}>
      <ScreenHost key={app.screen.key} />
      {app.overlays.map((o) => (
        <View key={o.key} style={StyleSheet.absoluteFill}>
          <OverlayView o={o} />
        </View>
      ))}
      <FxLayer />
      <ToastLayer />
      {L.portrait ? <RotateHint /> : null}
    </View>
  );
}

function ScreenHost() {
  const a = useAppear(0, 0);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: a }]}>
      <CurrentScreen />
    </Animated.View>
  );
}

function CurrentScreen() {
  const { screen: s } = useApp();
  switch (s.name) {
    case 'menu': return <MainMenu />;
    case 'beforeStart': return <BeforeStart />;
    case 'avatar': return <Avatar consent={s.consent} />;
    case 'story': return <Story />;
    case 'dayIntro': return <DayIntro />;
    case 'dialogue': return <Dialogue lines={s.lines} bg={s.bg} onDone={s.onDone} music={s.music} crowd={s.crowd} gameplay={s.gameplay} />;
    case 'map': return <MapScreen />;
    case 'stall': return <StallScreen />;
    case 'what': return <WhatCard id={s.id} />;
    case 'loved': return <LovedIt id={s.id} />;
    case 'how': return <HowCard id={s.id} />;
    case 'diary': return <Diary />;
    case 'summary': return <Summary />;
    case 'reveal': return <Reveal />;
    case 'results': return <Results first={s.first} />;
    case 'ending': return <Ending />;
    default: return null;
  }
}

function RotateHint() {
  const L = useL();
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: CREAM, alignItems: 'center', justifyContent: 'center', padding: 40 * L.s }]}>
      <Img src="characters/portrait_hudhud_happy" style={{ width: 300 * L.s, height: 300 * L.s }} />
      <T size={60} font="baloo" align="center" fixed>Turn your phone sideways</T>
      <T size={40} font="nunito_x" color={INK2} align="center" fixed>Apna Mela is played in landscape.</T>
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: '#2C2260' } });

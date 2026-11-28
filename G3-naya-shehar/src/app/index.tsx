import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { Emblem } from '@/art/Logo';
import { GText } from '@/ui/Text';
import { useGame, useTheme } from '@/state/GameProvider';
import { palette } from '@/ui/tokens';

/** Splash: emblem springs in, title rises, then we go to the right place. */
export default function Splash() {
  const { s } = useGame();
  const { reducedMotion } = useTheme();
  const router = useRouter();
  const a = useSharedValue(reducedMotion ? 1 : 0);
  const b = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    if (!reducedMotion) {
      a.value = withSpring(1, { damping: 10, stiffness: 120 });
      b.value = withDelay(350, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    }
    const t = setTimeout(() => router.replace(s.introSeen ? '/menu' : '/welcome'), reducedMotion ? 600 : 1700);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const em = useAnimatedStyle(() => ({ transform: [{ scale: 0.5 + a.value * 0.5 }, { rotate: `${(1 - a.value) * -20}deg` }], opacity: a.value }));
  const tx = useAnimatedStyle(() => ({ opacity: b.value, transform: [{ translateY: (1 - b.value) * 20 }] }));
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.saffron, gap: 18 }} accessible accessibilityLabel="Naya Shehar. Build your town. Shape your future.">
      <Animated.View style={em}><Emblem size={180} /></Animated.View>
      <Animated.View style={[{ alignItems: 'center' }, tx]}>
        <GText variant="hero" color="#FFFFFF" style={{ fontSize: 48, lineHeight: 56, textShadowColor: '#7A4E2D88', textShadowRadius: 0, textShadowOffset: { width: 0, height: 3 } }}>Naya Shehar</GText>
        <GText variant="sub" color="#3A2207">Build your town. Shape your future.</GText>
      </Animated.View>
    </View>
  );
}

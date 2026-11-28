import React, { useEffect } from 'react';
import { ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop, Path } from 'react-native-svg';
import { useTheme } from '@/state/GameProvider';
import { elevation, motion, radius, space } from './tokens';
import { GText } from './Text';
import { SpeakButton } from './Speak';
import { Icon, IconName } from './Icon';

/** Screen shell: safe-area padding + warm background with soft hills. */
export function Screen({ children, scroll = true, sky, padded = true, footer }: { children: React.ReactNode; scroll?: boolean; sky?: [string, string]; padded?: boolean; footer?: React.ReactNode }) {
  const { c, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const top = sky ?? (isDark ? ['#2A2442', c.bg] : ['#FFE3B8', c.bg]);
  const pad = { paddingTop: insets.top + space.sm, paddingBottom: (footer ? space.md : insets.bottom + space.lg), paddingHorizontal: padded ? space.lg : 0 };
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={top[0]} />
            <Stop offset="0.6" stopColor={top[1]} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#sky)" />
        <Path d="M0 88 Q25 80 50 86 T100 83 V100 H0z" fill={isDark ? '#28223A' : '#F7E0BE'} opacity={0.8} />
      </Svg>
      {scroll ? (
        <ScrollView contentContainerStyle={[pad, { flexGrow: 1, gap: space.lg }]} showsVerticalScrollIndicator={false}>{children}</ScrollView>
      ) : (
        <View style={[pad, { flex: 1, gap: space.lg }]}>{children}</View>
      )}
      {footer ? <View style={{ paddingHorizontal: space.lg, paddingBottom: insets.bottom + space.md, paddingTop: space.sm }}>{footer}</View> : null}
    </View>
  );
}

/** Paper card. If `speak` is set, a read-aloud button sits in the top-right corner. */
export function Panel({ children, style, speak, title, icon, tone = 'paper' }: { children?: React.ReactNode; style?: StyleProp<ViewStyle>; speak?: string; title?: string; icon?: IconName; tone?: 'paper' | 'raised' | 'tinted' }) {
  const { c } = useTheme();
  const bg = tone === 'raised' ? c.surfaceRaised : tone === 'tinted' ? c.bgAlt : c.surface;
  return (
    <View style={[{ backgroundColor: bg, borderRadius: radius.lg, padding: space.lg, borderWidth: 2, borderColor: c.border, gap: space.sm }, elevation(1), style]}>
      {(title || speak) ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          {icon ? <Icon name={icon} size={24} color={c.primaryDeep} /> : null}
          {title ? <GText variant="heading" style={{ flex: 1 }} accessibilityRole="header">{title}</GText> : <View style={{ flex: 1 }} />}
          {speak ? <SpeakButton text={speak} size={44} /> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** Fade + rise on mount; instant when reduced motion is on. */
export function Appear({ children, delay = 0, style, from = 14 }: { children: React.ReactNode; delay?: number; style?: StyleProp<ViewStyle>; from?: number }) {
  const { reducedMotion } = useTheme();
  const v = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    if (reducedMotion) { v.value = 1; return; }
    v.value = withDelay(delay, withTiming(1, { duration: motion.slow, easing: Easing.out(Easing.cubic) }));
  }, [delay, reducedMotion, v]);
  const st = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ translateY: (1 - v.value) * from }] }));
  return <Animated.View style={[st, style]}>{children}</Animated.View>;
}

export function Pill({ label, icon, color, textColor }: { label: string; icon?: IconName; color?: string; textColor?: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: color ?? c.bgAlt, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 }}>
      {icon ? <Icon name={icon} size={16} color={textColor ?? c.text} /> : null}
      <GText variant="label" color={textColor ?? c.text}>{label}</GText>
    </View>
  );
}

/** Progress through the week's session. Shape + count, not colour alone. */
export function StepDots({ index, total }: { index: number; total: number }) {
  const { c } = useTheme();
  const pct = total ? Math.round((index / Math.max(1, total - 1)) * 100) : 0;
  return (
    <View accessible accessibilityLabel={`Week progress ${pct} percent`} style={{ height: 12, borderRadius: 6, backgroundColor: c.border, overflow: 'hidden', flex: 1 }}>
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: c.success, borderRadius: 6 }} />
    </View>
  );
}

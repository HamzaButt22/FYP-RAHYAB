/** Small shared UI building blocks (buttons, cards, text, bars) in the game's visual style. */
import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, TextProps, TextStyle, View, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors, HIT, radius, space } from './theme';

export function Backdrop({ tint = 'rgb(22,30,60)' }: { tint?: string }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="bd" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={tint} />
            <Stop offset="1" stopColor="rgb(10,12,22)" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#bd)" />
        {STARS.map(([x, y, r], i) => (
          <Circle key={i} cx={x} cy={y} r={r} fill="rgb(60,80,140)" />
        ))}
      </Svg>
    </View>
  );
}
// Static version of the desktop's drifting dots (no animation: cheap and reduced-motion friendly).
const STARS: [number, number, number][] = Array.from({ length: 26 }, (_, i) => [((i * 173) % 1100) / 11, ((i * 97) % 700) / 7, 0.25 + (i % 3) * 0.12]);

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface BtnProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityHint?: string;
  left?: React.ReactNode;
  testID?: string;
  numberOfLines?: number;
  busy?: boolean;
}

export function Btn({ label, onPress, variant = 'secondary', disabled, selected, style, textStyle, accessibilityHint, left, testID, numberOfLines, busy }: BtnProps) {
  const bg =
    variant === 'primary' ? colors.accent2 : variant === 'danger' ? 'rgb(120,50,60)' : variant === 'ghost' ? 'transparent' : selected ? colors.panelLight : colors.panel;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, selected: !!selected, busy: !!busy }}
      hitSlop={6}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: disabled ? colors.disabledBg : bg, borderColor: selected ? colors.accent : 'transparent' },
        variant === 'ghost' && { borderColor: colors.panelLight },
        pressed && !disabled && { opacity: 0.75 },
        style,
      ]}
    >
      {left}
      {busy ? <ActivityIndicator color={colors.text} style={{ marginRight: space(2) }} /> : null}
      <Text
        numberOfLines={numberOfLines}
        style={[styles.btnText, variant === 'primary' && { color: 'rgb(10,30,24)' }, disabled && { color: colors.disabledText }, textStyle]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Card({ children, style, accent }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; accent?: string }) {
  return <View style={[styles.card, accent ? { borderColor: accent, borderWidth: 2 } : null, style]}>{children}</View>;
}

export function H1(p: TextProps) {
  return <Text accessibilityRole="header" {...p} style={[styles.h1, p.style]} />;
}
export function H2(p: TextProps) {
  return <Text accessibilityRole="header" {...p} style={[styles.h2, p.style]} />;
}
export function Body(p: TextProps) {
  return <Text {...p} style={[styles.body, p.style]} />;
}
export function Muted(p: TextProps) {
  return <Text {...p} style={[styles.muted, p.style]} />;
}

export function Bar({ frac, color, height = 10, track = 'rgb(36,42,62)' }: { frac: number; color: string; height?: number; track?: string }) {
  const f = Math.max(0, Math.min(1, Number.isFinite(frac) ? frac : 0));
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(f * 100) }}>
      <View style={{ width: `${f * 100}%`, height: '100%', backgroundColor: color, borderRadius: height / 2 }} />
    </View>
  );
}

export function Bullet({ children, color = colors.accent2 }: { children: React.ReactNode; color?: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={[styles.bulletDot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>{typeof children === 'string' ? <Body>{children}</Body> : children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: HIT,
    paddingHorizontal: space(4),
    paddingVertical: space(2.5),
    borderRadius: radius.md,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: colors.text, fontSize: 16, fontWeight: '600', textAlign: 'center', flexShrink: 1 },
  card: { backgroundColor: colors.panel, borderRadius: radius.lg, padding: space(4) },
  h1: { color: colors.text, fontSize: 30, fontWeight: '800' },
  h2: { color: colors.text, fontSize: 20, fontWeight: '700' },
  body: { color: colors.text, fontSize: 15, lineHeight: 21 },
  muted: { color: colors.textDim, fontSize: 13, lineHeight: 18 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: space(1) },
  bulletDot: { width: 7, height: 7, borderRadius: 4, marginTop: 7, marginRight: space(2.5) },
});

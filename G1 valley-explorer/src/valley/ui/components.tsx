import React, { useEffect, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackIcon, UstadMehr } from './icons';
import { colors, MAX_WIDTH, radius, shadow, space, TOUCH, type, useContentWidth, useLandscape } from './theme';

// ---------------------------------------------------------------- pressable with a subtle press animation
export function Tap({ onPress, disabled, dim = disabled, style, children, accessibilityLabel, accessibilityHint, accessibilityState, testID }: {
  onPress?: () => void; disabled?: boolean; /** fade the control; defaults to `disabled` (completed items set this to false) */ dim?: boolean; style?: StyleProp<ViewStyle>; children?: React.ReactNode;
  accessibilityLabel?: string; accessibilityHint?: string; accessibilityState?: { selected?: boolean; checked?: boolean; disabled?: boolean }; testID?: string;
}) {
  const [scale] = useState(() => new Animated.Value(1));
  const to = (v: number) => Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  // The pressable itself carries the layout style (incl. absolute positioning). An earlier version put the
  // style on an inner view, leaving a zero-size touchable: absolutely positioned buttons were clipped and,
  // on Android, would not receive touches (found by the visual check on the Valley Gate map).
  return (
    <AnimatedPressable onPress={disabled ? undefined : onPress} onPressIn={() => !disabled && to(0.97)} onPressOut={() => to(1)}
      accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, ...accessibilityState }} aria-disabled={!!disabled} aria-selected={accessibilityState?.selected} testID={testID} hitSlop={6}
      style={[style, { transform: [{ scale }] }, dim && { opacity: 0.55 }]}>
      {children}
    </AnimatedPressable>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ---------------------------------------------------------------- buttons
export function Button({ label, onPress, variant = 'primary', disabled, icon, testID, style }: {
  label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'accent'; disabled?: boolean; icon?: React.ReactNode; testID?: string; style?: StyleProp<ViewStyle>;
}) {
  const v = btn[variant];
  return (
    <Tap onPress={onPress} disabled={disabled} accessibilityLabel={label} testID={testID} style={[s.button, v.box, style]}>
      {icon}
      <Text style={[s.buttonText, v.text]} numberOfLines={2}>{label}</Text>
    </Tap>
  );
}

const btn = {
  primary: StyleSheet.create({ box: { backgroundColor: colors.primary }, text: { color: '#FFFFFF' } }),
  accent: StyleSheet.create({ box: { backgroundColor: colors.accent }, text: { color: '#2B1A08' } }),
  secondary: StyleSheet.create({ box: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primary }, text: { color: colors.primaryDark } }),
  ghost: StyleSheet.create({ box: { backgroundColor: 'transparent' }, text: { color: colors.primaryDark } }),
};

// ---------------------------------------------------------------- layout
export function Screen({ children, scroll = true, footer }: { children: React.ReactNode; scroll?: boolean; footer?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const maxWidth = useContentWidth();
  const body = <View style={[s.inner, { maxWidth }]}>{children}</View>;
  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      {scroll ? <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">{body}</ScrollView> : <View style={[s.scroll, { flex: 1 }]}>{body}</View>}
      {footer ? <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, space.md) }]}><View style={[s.footerInner, { maxWidth }]}>{footer}</View></View> : null}
    </View>
  );
}

export function Card({ children, style, tone = 'plain', testID }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; tone?: 'plain' | 'soft' | 'accent'; testID?: string }) {
  return <View testID={testID} style={[s.card, tone === 'soft' && { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }, tone === 'accent' && { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft }, style]}>{children}</View>;
}

export function Pill({ text, tone = 'neutral' }: { text: string; tone?: 'neutral' | 'primary' | 'accent' | 'success' }) {
  const bg = { neutral: colors.surfaceAlt, primary: colors.primarySoft, accent: colors.accentSoft, success: colors.successSoft }[tone];
  const fg = { neutral: colors.inkMuted, primary: colors.primaryDark, accent: colors.caution, success: colors.success }[tone];
  return <View style={[s.pill, { backgroundColor: bg }]}><Text style={[type.label, { color: fg }]}>{text}</Text></View>;
}

// ---------------------------------------------------------------- level header with progress
export function LevelHeader({ title, progressText, progress, onBack, right }: { title: string; progressText?: string; progress?: number; onBack?: () => void; right?: React.ReactNode }) {
  const [w] = useState(() => new Animated.Value(progress ?? 0));
  useEffect(() => { Animated.timing(w, { toValue: progress ?? 0, duration: 350, useNativeDriver: false }).start(); }, [progress, w]);
  return (
    <View style={s.header}>
      <View style={s.headerRow}>
        {onBack ? (
          <Tap onPress={onBack} style={s.backBtn} accessibilityLabel="Back to the journey map" accessibilityHint="Your progress is saved">
            <BackIcon />
          </Tap>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={type.title} numberOfLines={1} accessibilityRole="header">{title}</Text>
          {progressText ? <Text style={type.small}>{progressText}</Text> : null}
        </View>
        {right}
      </View>
      {progress !== undefined ? (
        <View style={s.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round((progress ?? 0) * 100) }}>
          <Animated.View style={[s.fill, { width: w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------- guide speech bubble
export function Guide({ children }: { children: React.ReactNode }) {
  const [fade] = useState(() => new Animated.Value(0));
  useEffect(() => { Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }).start(); }, [fade]);
  return (
    <Animated.View style={[s.guide, { opacity: fade }]}>
      <UstadMehr size={52} />
      <View style={s.bubble}><Text style={type.body}>{children}</Text></View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------- bottom sheet dialog
export function Sheet({ visible, title, children, actions, onClose }: { visible: boolean; title: string; children: React.ReactNode; actions: React.ReactNode; onClose?: () => void }) {
  const insets = useSafeAreaInsets();
  const landscape = useLandscape();
  const maxWidth = useContentWidth();
  // the content scrolls; the buttons always stay visible (short landscape screens)
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent supportedOrientations={['portrait', 'landscape']}>
      <Pressable style={s.overlay} onPress={onClose} accessibilityLabel="Close" />
      <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, landscape ? space.sm : space.lg), maxHeight: '92%' }]}>
        <View style={[s.sheetInner, { maxWidth, flexShrink: 1 }]}>
          <View style={s.grabber} />
          <Text style={[type.title, { marginBottom: space.sm }]} accessibilityRole="header">{title}</Text>
          <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingBottom: space.xs }}>{children}</ScrollView>
          <View style={[{ gap: space.sm, marginTop: landscape ? space.sm : space.lg }]}>{actions}</View>
        </View>
      </View>
    </Modal>
  );
}

export function Banner({ text, tone = 'caution' }: { text: string; tone?: 'caution' | 'info' }) {
  return (
    <View style={[s.banner, { backgroundColor: tone === 'caution' ? colors.cautionSoft : colors.primarySoft }]} accessibilityRole="alert">
      <Text style={[type.small, { color: tone === 'caution' ? colors.caution : colors.primaryDark }]}>{text}</Text>
    </View>
  );
}

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.parchment },
  scroll: { paddingHorizontal: space.lg, paddingBottom: space.xl, alignItems: 'center' },
  inner: { width: '100%', maxWidth: MAX_WIDTH, gap: space.md },
  footer: { borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surfaceAlt, paddingTop: space.md, paddingHorizontal: space.lg, alignItems: 'center' },
  footerInner: { width: '100%', maxWidth: MAX_WIDTH, gap: space.sm },
  button: { minHeight: TOUCH + 4, borderRadius: radius.md, paddingHorizontal: space.lg, paddingVertical: space.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  buttonText: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: space.lg, borderWidth: 1, borderColor: colors.border, ...shadow },
  pill: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 5 },
  header: { width: '100%', maxWidth: MAX_WIDTH, paddingTop: space.md, paddingBottom: space.sm, gap: space.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  backBtn: { width: TOUCH, height: TOUCH, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 8, borderRadius: radius.pill, backgroundColor: colors.primary },
  guide: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  bubble: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, borderTopLeftRadius: 4, padding: space.md, borderWidth: 1, borderColor: colors.border },
  overlay: { flex: 1, backgroundColor: colors.overlay },
  sheet: { backgroundColor: colors.parchment, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, paddingHorizontal: space.lg, paddingTop: space.sm, alignItems: 'center' },
  sheetInner: { width: '100%', maxWidth: MAX_WIDTH },
  grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: space.md },
  banner: { borderRadius: radius.sm, padding: space.md },
});

/** The "Mela Pop" widget kit: text, panels, buttons, ribbons, bubbles, characters, portraits, HUD pieces. */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useApp } from '../app/AppContext';
import { charAspect, charKey, img, portraitKey } from './assets';
import { useL } from './layout';
import { c, CREAM, dark, DISABLED, DISABLED_TXT, FONTS, FontKey, INK, INK2, LILAC, WHITE, WHITE_TEXT_ON } from './theme';

type Box = [number, number, number, number];

// ------------------------------------------------------------------------------------------ helpers
export function useMotion() {
  return !useApp().settings.reduce_motion;
}

/** 0 -> 1 entry animation (spring), instant when Reduce motion is on. */
export function useAppear(delay = 0, from = 0) {
  const motion = useMotion();
  const v = useRef(new Animated.Value(motion ? from : 1)).current;
  useEffect(() => {
    if (!motion) {
      v.setValue(1);
      return;
    }
    const a = Animated.spring(v, { toValue: 1, delay, useNativeDriver: true, friction: 7, tension: 70 });
    a.start();
    return () => a.stop();
  }, [delay, motion, v]);
  return v;
}

/** Endless 0..1..0 loop, used for gentle bobbing / pulsing. */
export function useLoop(period = 1600, enabled = true, phase = 0) {
  const motion = useMotion() && enabled;
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!motion) return;
    const half = period / 2;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: half, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: half, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    const t = setTimeout(() => loop.start(), (phase * 397) % period);
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [motion, period, phase, v]);
  return v;
}

// ------------------------------------------------------------------------------------------ text
export interface TProps {
  size?: number;
  font?: FontKey;
  color?: string;
  align?: TextStyle['textAlign'];
  style?: StyleProp<TextStyle>;
  lines?: number;
  fixed?: boolean; // ignore the Text size setting
  lh?: number; // line height multiplier
  shadow?: boolean;
  children?: React.ReactNode;
}

export function T({ size = 24, font = 'nunito', color = INK, align, style, lines, fixed, lh, shadow, children }: TProps) {
  const { s } = useL();
  const { settings } = useApp();
  const k = fixed ? 1 : settings.text_scale;
  const fs = size * s * k;
  const col = settings.high_contrast && color === INK2 ? INK : color;
  return (
    <Text
      allowFontScaling={false}
      numberOfLines={lines}
      adjustsFontSizeToFit={!!lines}
      minimumFontScale={0.7}
      style={[
        {
          fontFamily: FONTS[font],
          fontSize: fs,
          lineHeight: fs * (lh ?? (font.startsWith('baloo') ? 1.18 : 1.3)),
          color: col,
          textAlign: align,
          includeFontPadding: false,
        },
        shadow ? { textShadowColor: 'rgba(38,33,74,0.55)', textShadowOffset: { width: 0, height: 2 * s }, textShadowRadius: 0.5 } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ------------------------------------------------------------------------------------------ surfaces
export interface PanelProps {
  at?: Box;
  style?: StyleProp<ViewStyle>;
  fill?: string;
  radius?: number;
  ow?: number;
  lip?: number;
  lipColor?: string;
  outline?: string | null;
  children?: React.ReactNode;
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
}

/** A rounded card with an ink outline and a darker "lip" underneath (the Mela Pop look). */
export function Panel({ at, style, fill = CREAM, radius = 24, ow = 3.4, lip = 0, lipColor = 'rgba(38,33,74,0.32)', outline = INK, children, pointerEvents }: PanelProps) {
  const L = useL();
  const pos = at ? L.box(at[0], at[1], at[2], at[3] + lip) : null;
  return (
    <View pointerEvents={pointerEvents} style={[pos, style, { borderRadius: radius * L.s, backgroundColor: lip ? lipColor : 'transparent', paddingBottom: lip * L.s }]}>
      <View
        style={{
          flex: 1,
          backgroundColor: fill,
          borderRadius: radius * L.s,
          borderWidth: outline ? ow * L.s : 0,
          borderColor: outline ?? undefined,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
}

export function Pill({ at, fill = CREAM, children, style }: { at?: Box; fill?: string; children?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const L = useL();
  const h = at ? at[3] : 48;
  return (
    <Panel at={at} fill={fill} radius={h / 2} ow={3} lip={4} style={style}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 * L.s }}>{children}</View>
    </Panel>
  );
}

export function Ribbon({ x, y, w, h = 70, text, color = 'pink', size = 34 }: { x: number; y: number; w: number; h?: number; text: string; color?: string; size?: number }) {
  const L = useL();
  const appear = useAppear(60, 0.4);
  const white = WHITE_TEXT_ON.has(color);
  return (
    <Animated.View style={[L.box(x, y, w, h + 8), { transform: [{ scale: appear }] }]} pointerEvents="none">
      <Panel fill={c(color)} radius={20} ow={3.6} lip={8} lipColor={dark(color)} style={{ flex: 1 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 * L.s }}>
          <T size={size} font="baloo" color={white ? WHITE : INK} shadow={white} lines={1} fixed>
            {text}
          </T>
        </View>
      </Panel>
    </Animated.View>
  );
}

export function Bubble({ at, name, nameColor = 'pink', children, tail = false, rel }: { at: Box; name?: string; nameColor?: string; children?: React.ReactNode; tail?: boolean; rel?: boolean }) {
  const L = useL();
  return (
    <View style={(rel ? L.rbox : L.box)(at[0], at[1], at[2], at[3] + 6)}>
      <Panel fill={WHITE} radius={26} ow={3.4} lip={6} style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 26 * L.s, paddingTop: (name ? 26 : 16) * L.s, paddingBottom: 14 * L.s, justifyContent: 'center' }}>
          {children}
        </View>
      </Panel>
      {name ? (
        <View style={[{ position: 'absolute', left: 24 * L.s, top: -22 * L.s }]}>
          <Panel fill={c(nameColor)} radius={16} ow={3} style={{ paddingHorizontal: 20 * L.s, paddingVertical: 5 * L.s }}>
            <T size={26} font="baloo" color={WHITE_TEXT_ON.has(nameColor) ? WHITE : INK} fixed lh={1.4}>
              {name}
            </T>
          </Panel>
        </View>
      ) : null}
      {tail ? <View style={{ position: 'absolute', left: -14 * L.s, top: at[3] * 0.45 * L.s, width: 28 * L.s, height: 28 * L.s, backgroundColor: WHITE, borderLeftWidth: 3.4 * L.s, borderBottomWidth: 3.4 * L.s, borderColor: INK, transform: [{ rotate: '45deg' }] }} /> : null}
    </View>
  );
}

export function Scrim({ alpha = 0.55 }: { alpha?: number }) {
  const { settings } = useApp();
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(27,23,51,${settings.high_contrast ? Math.min(0.8, alpha + 0.15) : alpha})` }]} />;
}

export function Bg({ src, blur = 0, tint }: { src: string; blur?: number; tint?: string }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image source={img(src)} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={blur} transition={0} cachePolicy="memory" />
      {tint ? <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} /> : null}
    </View>
  );
}

export function Img({ src, at, style, fit = 'contain', opacity, flip }: { src: string; at?: Box; style?: StyleProp<any>; fit?: 'contain' | 'cover'; opacity?: number; flip?: boolean }) {
  const L = useL();
  return (
    <Image
      source={img(src)}
      contentFit={fit}
      cachePolicy="memory"
      transition={0}
      style={[at ? L.box(at[0], at[1], at[2], at[3]) : null, style, opacity !== undefined ? { opacity } : null, flip ? { transform: [{ scaleX: -1 }] } : null]}
    />
  );
}

// ------------------------------------------------------------------------------------------ buttons
const BTN_TEXT: Record<string, string> = { yellow: INK, cream: INK, danger: '#B02525', disabled: DISABLED_TXT, green: INK, orange: INK };

export interface BtnProps {
  at?: Box;
  label: string;
  onPress: () => void;
  color?: string;
  icon?: string;
  size?: number;
  disabled?: boolean;
  pulse?: boolean;
  style?: StyleProp<ViewStyle>;
  silent?: boolean;
  testID?: string;
}

export function Btn({ at, label, onPress, color = 'pink', icon, size, disabled, pulse, style, silent, testID }: BtnProps) {
  const L = useL();
  const app = useApp();
  const h = at ? at[3] : 84;
  const lip = h >= 60 ? 7 : 5;
  const press = useRef(new Animated.Value(0)).current;
  const loop = useLoop(1400, !!pulse && !disabled);
  const style0 = disabled ? 'disabled' : color;
  const fill = style0 === 'danger' ? '#FFE3E3' : style0 === 'disabled' ? DISABLED : c(style0);
  const lipC = style0 === 'cream' ? 'rgba(38,33,74,0.45)' : style0 === 'danger' ? '#B02525' : style0 === 'disabled' ? '#A79FBC' : dark(style0);
  const txt = BTN_TEXT[style0] ?? WHITE;
  const fs = size ?? Math.max(20, Math.min(36, h * 0.38));
  const iconWhite = txt === WHITE;
  const scale = loop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });
  const onIn = () => Animated.timing(press, { toValue: 1, duration: 70, useNativeDriver: true }).start();
  const onOut = () => Animated.spring(press, { toValue: 0, useNativeDriver: true, friction: 5 }).start();
  const tap = () => {
    if (disabled) {
      if (!silent) app.sfx('sfx_ui_denied', 0.6);
      app.haptic('warn');
      return;
    }
    if (!silent) app.sfx('sfx_ui_tap');
    app.haptic('tap');
    onPress();
  };
  return (
    <Animated.View style={[at ? L.box(at[0], at[1], at[2], h + lip) : { height: (h + lip) * L.s }, style, { transform: [{ scale }] }]}>
      <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} onPressIn={onIn} onPressOut={onOut} onPress={tap} hitSlop={8 * L.s} style={{ flex: 1 }}>
        <View style={{ position: 'absolute', left: 0, right: 0, top: lip * L.s, height: h * L.s, borderRadius: (h / 2.4) * L.s, backgroundColor: lipC }} />
        <Animated.View
          style={{
            height: h * L.s,
            borderRadius: (h / 2.4) * L.s,
            backgroundColor: fill,
            borderWidth: 3.4 * L.s,
            borderColor: style0 === 'disabled' ? '#A79FBC' : INK,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 14 * L.s,
            overflow: 'hidden',
            transform: [{ translateY: press.interpolate({ inputRange: [0, 1], outputRange: [0, (lip - 1) * L.s] }) }],
          }}
        >
          {style0 !== 'cream' && style0 !== 'disabled' && style0 !== 'danger' ? (
            <View style={{ position: 'absolute', left: 8 * L.s, right: 8 * L.s, top: 5 * L.s, height: h * 0.34 * L.s, borderRadius: h * L.s, backgroundColor: 'rgba(255,255,255,0.22)' }} />
          ) : null}
          {icon ? <Img src={`ui/icon_${icon}${iconWhite ? '_white' : ''}`} style={{ width: fs * 1.05 * L.s, height: fs * 1.05 * L.s, marginRight: 10 * L.s }} /> : null}
          <T size={fs} font="baloo" color={txt} shadow={txt === WHITE} lines={1} fixed>
            {label}
          </T>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export function IconBtn({ x, y, d = 84, icon, onPress, bg = 'cream', label, badge }: { x: number; y: number; d?: number; icon: string; onPress: () => void; bg?: string; label: string; badge?: boolean }) {
  const L = useL();
  const app = useApp();
  const press = useRef(new Animated.Value(0)).current;
  const fill = bg === 'cream' ? CREAM : c(bg);
  return (
    <View style={L.box(x, y, d, d + 6)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={6 * L.s}
        onPressIn={() => Animated.timing(press, { toValue: 1, duration: 60, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(press, { toValue: 0, useNativeDriver: true, friction: 5 }).start()}
        onPress={() => {
          app.sfx('sfx_ui_tap');
          app.haptic('tap');
          onPress();
        }}
        style={{ flex: 1 }}
      >
        <View style={{ position: 'absolute', left: 0, right: 0, top: 6 * L.s, height: d * L.s, borderRadius: 22 * L.s, backgroundColor: bg === 'cream' ? 'rgba(38,33,74,0.45)' : dark(bg) }} />
        <Animated.View
          style={{
            height: d * L.s, borderRadius: 22 * L.s, backgroundColor: fill, borderWidth: 3.4 * L.s, borderColor: INK,
            alignItems: 'center', justifyContent: 'center',
            transform: [{ translateY: press.interpolate({ inputRange: [0, 1], outputRange: [0, 5 * L.s] }) }],
          }}
        >
          <Img src={`ui/icon_${icon}`} style={{ width: d * 0.5 * L.s, height: d * 0.5 * L.s }} />
        </Animated.View>
        {badge ? <View style={{ position: 'absolute', right: -4 * L.s, top: -4 * L.s, width: 20 * L.s, height: 20 * L.s, borderRadius: 10 * L.s, backgroundColor: c('red'), borderWidth: 2.5 * L.s, borderColor: INK }} /> : null}
      </Pressable>
    </View>
  );
}

/** A big tappable area (cards, tiles) with press feedback; selection visuals are drawn by the caller. */
export function Tap({ at, onPress, children, style, disabled, label, sound = 'sfx_card_select', lift = 0, testID }: {
  at?: Box; onPress: () => void; children?: React.ReactNode; style?: StyleProp<ViewStyle>; disabled?: boolean; label?: string; sound?: string | null; lift?: number; testID?: string;
}) {
  const L = useL();
  const app = useApp();
  const press = useRef(new Animated.Value(0)).current;
  const sc = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.96] });
  return (
    <Animated.View style={[at ? L.box(at[0], at[1], at[2], at[3]) : null, style, { transform: [{ scale: sc }, { translateY: lift * L.s }] }]}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !!disabled }}
        style={{ flex: 1 }}
        onPressIn={() => Animated.timing(press, { toValue: 1, duration: 80, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(press, { toValue: 0, useNativeDriver: true, friction: 5 }).start()}
        onPress={() => {
          if (disabled) {
            app.sfx('sfx_ui_denied', 0.6);
            app.haptic('warn');
            return;
          }
          if (sound) app.sfx(sound, 0.7);
          app.haptic('select');
          onPress();
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

// ------------------------------------------------------------------------------------------ characters
export function Char({ kind, x, y, h, pose = 'idle', expr = 'smile', flip, phase = 0, bob = true, opacity, rel }: {
  kind: string; x: number; y: number; h: number; pose?: string; expr?: string; flip?: boolean; phase?: number; bob?: boolean; opacity?: number; rel?: boolean;
}) {
  const L = useL();
  const loop = useLoop(2400, bob, phase);
  const hh = h * 1.07;
  const w = hh * charAspect(kind);
  const ty = loop.interpolate({ inputRange: [0, 1], outputRange: [0, -h * 0.012 * L.s] });
  return (
    <Animated.View pointerEvents="none" style={[(rel ? L.rbox : L.box)(x - w / 2, y + h * 0.035 - hh, w, hh), { opacity, transform: [{ translateY: ty }] }]}>
      <Image source={img(charKey(kind, pose, expr))} style={{ width: '100%', height: '100%', transform: flip ? [{ scaleX: -1 }] : undefined }} contentFit="contain" cachePolicy="memory" transition={0} />
    </Animated.View>
  );
}

export function Portrait({ kind, expr = 'happy', x, y, d, ring = 'yellow', border = true }: { kind: string; expr?: string; x: number; y: number; d: number; ring?: string; border?: boolean }) {
  const L = useL();
  return (
    <View pointerEvents="none" style={[L.box(x - d / 2, y - d / 2, d, d), { borderRadius: (d / 2) * L.s, backgroundColor: ring.startsWith('#') ? ring : c(ring), borderWidth: border ? 3.4 * L.s : 0, borderColor: INK, overflow: 'hidden' }]}>
      <Image source={img(portraitKey(kind, expr))} style={{ width: '100%', height: '100%' }} contentFit="cover" cachePolicy="memory" transition={0} />
    </View>
  );
}

// ------------------------------------------------------------------------------------------ HUD
export function Hud({ showDiary = true, showBoard = true }: { showDiary?: boolean; showBoard?: boolean }) {
  const L = useL();
  const app = useApp();
  const s = app.session;
  const day = s.active ? s.day : 1;
  const lights = s.active ? s.profile!.lights : 0;
  const x0 = L.left;
  let x = L.right - 84;
  const btns: React.ReactNode[] = [];
  btns.push(<IconBtn key="pause" x={x} y={14} icon="pause" bg="yellow" label="Pause" onPress={() => app.push({ name: 'pause' })} />);
  x -= 98;
  if (showBoard) {
    btns.push(<IconBtn key="board" x={x} y={14} icon="board" label="Mela Board" onPress={() => app.push({ name: 'board' })} />);
    x -= 98;
  }
  if (showDiary) {
    btns.push(<IconBtn key="diary" x={x} y={14} icon="book" label="Diary pages" onPress={() => app.push({ name: 'diaryPages' })} />);
    x -= 98;
  }
  btns.push(<IconBtn key="help" x={x} y={14} icon="help" label="How to play" onPress={() => app.push({ name: 'howto' })} />);
  return (
    <>
      <Pill at={[x0, 16, 300, 72]}>
        <T size={30} font="baloo" fixed style={{ marginRight: 10 * L.s }}>{`Day ${day}`}</T>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={{ width: 30 * L.s, height: 30 * L.s, borderRadius: 15 * L.s, marginHorizontal: 3 * L.s, borderWidth: 2.6 * L.s, borderColor: INK, backgroundColor: i < day ? c('yellow') : i === day ? WHITE : LILAC, alignItems: 'center', justifyContent: 'center' }}>
            <T size={16} font="baloo" fixed>{String(i)}</T>
          </View>
        ))}
      </Pill>
      <Pill at={[x0 + 316, 16, 190, 72]}>
        <Img src="ui/diya" style={{ width: 46 * L.s, height: 46 * L.s, marginRight: 6 * L.s }} />
        <T size={32} font="baloo" fixed>{String(lights)}</T>
        <T size={20} font="nunito_x" color={INK2} fixed style={{ marginLeft: 6 * L.s, marginTop: 6 * L.s }}>/ 100</T>
      </Pill>
      {btns}
    </>
  );
}

export function Stepper({ kinds, cur, cx, y }: { kinds: string[]; cur: number; cx: number; y: number }) {
  const L = useL();
  const labels = kinds.map((k) => (k === 'what' ? 'Task' : 'Twist'));
  const w = labels.length * 130 + 30;
  return (
    <Pill at={[cx - w / 2, y, w, 60]}>
      {labels.map((lab, i) => {
        const done = i < cur;
        const now = i === cur;
        return (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
            {i > 0 ? <View style={{ width: 16 * L.s, height: 4 * L.s, borderRadius: 2 * L.s, backgroundColor: 'rgba(38,33,74,0.45)', marginHorizontal: 7 * L.s }} /> : null}
            <View style={{ width: 34 * L.s, height: 34 * L.s, borderRadius: 17 * L.s, borderWidth: 2.6 * L.s, borderColor: INK, backgroundColor: done ? c('green') : now ? c('yellow') : WHITE, alignItems: 'center', justifyContent: 'center' }}>
              {done ? <Img src="ui/icon_check_white" style={{ width: 22 * L.s, height: 22 * L.s }} /> : null}
            </View>
            <T size={21} font="baloo" color={now ? INK : INK2} fixed style={{ marginLeft: 6 * L.s }}>{lab}</T>
          </View>
        );
      })}
    </Pill>
  );
}

// ------------------------------------------------------------------------------------------ polaroid + medallion
export function Polaroid({ x, y, w, entry, avatar, rotate = 0 }: { x: number; y: number; w: number; entry: { stall: string; buddy: string }; avatar: string; rotate?: number }) {
  const L = useL();
  const app = useApp();
  const st = app.session.content.stallById[entry.stall];
  const h = w * 1.18;
  const iw = w * 0.86;
  return (
    <View pointerEvents="none" style={[L.box(x, y, w, h), { transform: [{ rotate: `${rotate}deg` }] }]}>
      <Panel fill={WHITE} radius={6} ow={2.6} lip={5} style={{ flex: 1 }}>
        <View style={{ position: 'absolute', left: w * 0.07 * L.s, top: w * 0.07 * L.s, width: iw * L.s, height: iw * L.s, overflow: 'hidden', borderWidth: 2 * L.s, borderColor: INK }}>
          {st ? <Image source={img(st.bg)} style={{ position: 'absolute', left: -iw * 0.62 * L.s, top: -iw * 0.18 * L.s, width: iw * 2.22 * L.s, height: iw * 1.25 * L.s }} contentFit="cover" cachePolicy="memory" transition={0} /> : null}
          <Image source={img(charKey(entry.buddy, entry.buddy === 'hudhud' ? 'idle' : 'wave', 'happy'))} contentFit="contain" style={{ position: 'absolute', left: iw * 0.0 * L.s, bottom: -iw * 0.04 * L.s, width: iw * 0.6 * L.s, height: iw * 0.84 * L.s }} />
          <Image source={img(charKey(avatar, 'idle', 'happy'))} contentFit="contain" style={{ position: 'absolute', right: -iw * 0.02 * L.s, bottom: -iw * 0.04 * L.s, width: iw * 0.56 * L.s, height: iw * 0.78 * L.s }} />
        </View>
        <View style={{ position: 'absolute', left: 4 * L.s, right: 4 * L.s, top: w * 0.95 * L.s, bottom: 4 * L.s, alignItems: 'center', justifyContent: 'center' }}>
          {st ? <T size={Math.max(15, w * 0.1)} font="baloo" lines={1} fixed>{st.short}</T> : null}
        </View>
      </Panel>
      <View style={{ position: 'absolute', left: (w / 2 - 9) * L.s, top: -7 * L.s, width: 18 * L.s, height: 18 * L.s, borderRadius: 9 * L.s, backgroundColor: c('pink'), borderWidth: 2 * L.s, borderColor: INK }} />
    </View>
  );
}

export function Medallion({ x, y, d, group }: { x: number; y: number; d: number; group: string[] }) {
  const L = useL();
  const { session } = useApp();
  const types = session.content.careers as Record<string, { colour: string; icon: string }>;
  const single = group.length === 1;
  const info = types[group[0]];
  const fill = single ? c(info.colour) : c('teal');
  return (
    <View pointerEvents="none" style={[L.box(x - d / 2 - 8, y - d / 2 - 8, d + 16, d + 16), { borderRadius: (d / 2 + 8) * L.s, backgroundColor: c('yellow'), alignItems: 'center', justifyContent: 'center' }]}>
      <View style={{ width: d * L.s, height: d * L.s, borderRadius: (d / 2) * L.s, backgroundColor: fill, borderWidth: 4 * L.s, borderColor: INK, alignItems: 'center', justifyContent: 'center' }}>
        {single ? (
          <>
            <Img src={info.icon} style={{ width: d * 0.4 * L.s, height: d * 0.4 * L.s }} />
            <T size={d * 0.26} font="baloo" color={WHITE} shadow fixed>{group[0]}</T>
          </>
        ) : (
          <T size={d * 0.24} font="baloo" color={WHITE} shadow fixed>{group.join('/')}</T>
        )}
      </View>
    </View>
  );
}

// ------------------------------------------------------------------------------------------ typewriter
/** Reveals text at ~45 characters per second (instant with Reduce motion). `skip` shows it all. */
export function useTypewriter(text: string, skip: boolean) {
  const motion = useMotion();
  const [n, setN] = useState(motion ? 0 : text.length);
  useEffect(() => {
    if (!motion || skip) {
      setN(text.length);
      return;
    }
    setN(0);
    const t0 = Date.now();
    const id = setInterval(() => {
      const k = Math.floor(((Date.now() - t0) / 1000) * 45);
      setN(Math.min(text.length, k));
      if (k >= text.length) clearInterval(id);
    }, 33);
    return () => clearInterval(id);
  }, [text, motion, skip]);
  return { shown: text.slice(0, n), done: n >= text.length };
}

export function useStableRandom<T>(xs: T[]): T {
  return useMemo(() => xs[Math.floor(Math.random() * xs.length)], []); // eslint-disable-line react-hooks/exhaustive-deps
}

export function Check({ x, y, d = 44, rel }: { x: number; y: number; d?: number; rel?: boolean }) {
  const L = useL();
  return (
    <View pointerEvents="none" style={[(rel ? L.rbox : L.box)(x - d / 2, y - d / 2, d, d), { borderRadius: (d / 2) * L.s, backgroundColor: c('green'), borderWidth: 3 * L.s, borderColor: INK, alignItems: 'center', justifyContent: 'center' }]}>
      <Img src="ui/icon_check_white" style={{ width: d * 0.6 * L.s, height: d * 0.6 * L.s }} />
    </View>
  );
}


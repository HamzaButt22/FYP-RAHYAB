/** Effects (confetti, sparkles, fireworks) and toasts. One native-driven Animated value per burst keeps it smooth. */
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { FxBurst, Toast, useApp } from '../app/AppContext';
import { useL } from './layout';
import { Panel, T } from './kit';
import { c, INK, WHITE, WHITE_TEXT_ON } from './theme';

const COLORS = ['#FFC93C', '#E8336D', '#11998E', '#3B6FD8', '#6BB548', '#FF8A3D', '#6C3FB5'];

function Burst({ b }: { b: FxBurst }) {
  const L = useL();
  const app = useApp();
  const v = useRef(new Animated.Value(0)).current;
  const parts = useMemo(() => {
    const n = b.kind === 'firework' ? 26 : b.n;
    return Array.from({ length: n }, (_, i) => {
      const ang = b.kind === 'confetti' ? -Math.PI / 2 + (Math.random() - 0.5) * 2.4 : (i / n) * Math.PI * 2 + Math.random() * 0.3;
      const sp = b.kind === 'confetti' ? 260 + Math.random() * 260 : b.kind === 'firework' ? 150 + Math.random() * 40 : 70 + Math.random() * 70;
      const dx = Math.cos(ang) * sp;
      const dy = Math.sin(ang) * sp;
      const g = b.kind === 'confetti' ? 520 : b.kind === 'firework' ? 90 : 0;
      const size = b.kind === 'confetti' ? 12 + Math.random() * 8 : b.kind === 'firework' ? 9 : 10 + Math.random() * 8;
      return { dx, dy, g, size, col: b.kind === 'firework' ? COLORS[(b.id + (i % 2)) % COLORS.length] : COLORS[i % COLORS.length], rot: Math.random() * 720 - 360, round: b.kind !== 'confetti' };
    });
  }, [b]);
  useEffect(() => {
    const dur = b.kind === 'confetti' ? 1500 : b.kind === 'firework' ? 1100 : 750;
    Animated.timing(v, { toValue: 1, duration: dur, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => app.dropFx(b.id));
  }, [app, b, v]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {parts.map((p, i) => {
        const tx = v.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx * L.s] });
        const ty = v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, (p.dy * 0.75 + p.g * 0.25) * L.s, (p.dy + p.g) * L.s] });
        const op = v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });
        const rot = v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.rot}deg`] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute', left: (b.x - p.size / 2) * L.s, top: (b.y - p.size / 2) * L.s,
              width: p.size * L.s, height: (p.round ? p.size : p.size * 0.55) * L.s, borderRadius: p.round ? p.size * L.s : 2 * L.s,
              backgroundColor: p.col, borderWidth: p.round ? 0 : 1.2 * L.s, borderColor: INK, opacity: op,
              transform: [{ translateX: tx }, { translateY: ty }, { rotate: rot }],
            }}
          />
        );
      })}
    </View>
  );
}

export function FxLayer() {
  const { bursts } = useApp();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {bursts.map((b) => (
        <Burst key={b.id} b={b} />
      ))}
    </View>
  );
}

function ToastView({ t, index }: { t: Toast; index: number }) {
  const L = useL();
  const app = useApp();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.sequence([
      Animated.spring(v, { toValue: 1, useNativeDriver: true, friction: 7 }),
      Animated.delay(t.dur * 1000),
      Animated.timing(v, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]);
    a.start(() => app.dropToast(t.id));
    return () => a.stop();
  }, [app, t, v]);
  const white = WHITE_TEXT_ON.has(t.color);
  const w = Math.min(900, 120 + t.text.length * 15);
  return (
    <Animated.View
      pointerEvents="none"
      style={[L.box(L.cx - w / 2, 104 + index * 86, w, 76), { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-30 * L.s, 0] }) }] }]}
    >
      <Panel fill={c(t.color)} radius={30} ow={3.2} lip={5} style={{ flex: 1 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 * L.s }}>
          <T size={26} font="baloo" color={white ? WHITE : INK} lines={1} fixed shadow={white}>{t.text}</T>
        </View>
      </Panel>
    </Animated.View>
  );
}

export function ToastLayer() {
  const { toasts } = useApp();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {toasts.map((t, i) => (
        <ToastView key={t.id} t={t} index={i} />
      ))}
    </View>
  );
}

/**
 * Touch controls replacing the keyboard:
 *   WASD / arrows -> virtual joystick (or an accessible 4-way d-pad, selectable in Settings)
 *   E / Space     -> action button (label shows what it would interact with)
 *   P / Esc       -> pause button
 *   TAB (level 5) -> notebook button
 */
import React, { useMemo, useRef } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { InputController } from '../utils/inputController';
import { colors, HIT } from './theme';

export function Joystick({ input, size = 120 }: { input: InputController; size?: number }) {
  const knob = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const origin = useRef({ x: 0, y: 0 });
  const center = size / 2;
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        // locationX/Y are only reliable at touch-down; afterwards use the gesture delta from that point
        onPanResponderGrant: (e) => {
          origin.current = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY };
          move(origin.current.x, origin.current.y);
        },
        onPanResponderMove: (_e, g) => move(origin.current.x + g.dx, origin.current.y + g.dy),
        onPanResponderRelease: () => release(),
        onPanResponderTerminate: () => release(),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [input, size],
  );

  function move(lx: number, ly: number) {
    const max = size / 2;
    let x = (lx - center) / max;
    let y = (ly - center) / max;
    const m = Math.hypot(x, y);
    if (m > 1) {
      x /= m;
      y /= m;
    }
    input.setStick(x, y);
    knob.setValue({ x: x * max * 0.55, y: y * max * 0.55 });
  }

  function release() {
    input.setMove(0, 0);
    knob.setValue({ x: 0, y: 0 });
  }

  return (
    <View
      {...responder.panHandlers}
      style={[styles.stickBase, { width: size, height: size, borderRadius: size / 2 }]}
      accessibilityLabel="Movement joystick"
      accessibilityHint="Drag to move. Switch to arrow buttons in settings if you prefer."
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.knob, { width: size * 0.42, height: size * 0.42, borderRadius: size * 0.21, transform: knob.getTranslateTransform() }]}
      />
    </View>
  );
}

function Arrow({ label, glyph, onDown, onUp, style }: { label: string; glyph: string; onDown: () => void; onUp: () => void; style: object }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPressIn={onDown}
      onPressOut={onUp}
      style={({ pressed }) => [styles.arrow, style, pressed && { backgroundColor: colors.panelLight }]}
    >
      <Text style={styles.arrowText}>{glyph}</Text>
    </Pressable>
  );
}

/** Accessible alternative to the joystick: hold an arrow to walk (also works with switch access / screen readers). */
export function DPad({ input, size = 132 }: { input: InputController; size?: number }) {
  const held = useRef({ x: 0, y: 0 });
  const set = (x: number, y: number) => {
    held.current = { x, y };
    input.setMove(x, y);
  };
  const b = size / 3;
  return (
    <View style={{ width: size, height: size }}>
      <Arrow label="Move up" glyph="▲" onDown={() => set(held.current.x, -1)} onUp={() => set(held.current.x, 0)} style={{ left: b, top: 0, width: b, height: b }} />
      <Arrow label="Move left" glyph="◀" onDown={() => set(-1, held.current.y)} onUp={() => set(0, held.current.y)} style={{ left: 0, top: b, width: b, height: b }} />
      <Arrow label="Move right" glyph="▶" onDown={() => set(1, held.current.y)} onUp={() => set(0, held.current.y)} style={{ left: 2 * b, top: b, width: b, height: b }} />
      <Arrow label="Move down" glyph="▼" onDown={() => set(held.current.x, 1)} onUp={() => set(held.current.x, 0)} style={{ left: b, top: 2 * b, width: b, height: b }} />
    </View>
  );
}

export function ActionButton({ hint, onPress, size = 86 }: { hint: string | null; onPress: () => void; size?: number }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={hint ? `Action: ${hint}` : 'Action'}
      accessibilityHint="Interact with the object, person or station next to you"
      style={({ pressed }) => [
        styles.action,
        { width: size, height: size, borderRadius: size / 2, borderColor: hint ? colors.gold : colors.panelLight },
        pressed && { transform: [{ scale: 0.94 }], opacity: 0.85 },
      ]}
    >
      <Text style={styles.actionGlyph}>✋</Text>
      <Text style={styles.actionText} numberOfLines={2} maxFontSizeMultiplier={1.2}>
        {hint ?? 'Action'}
      </Text>
    </Pressable>
  );
}

export function SmallButton({ label, onPress, glyph, accent }: { label: string; onPress: () => void; glyph: string; accent?: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [styles.small, accent ? { borderColor: accent } : null, pressed && { opacity: 0.7 }]}
    >
      <Text style={styles.smallGlyph}>{glyph}</Text>
      <Text style={styles.smallText} maxFontSizeMultiplier={1.2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stickBase: {
    backgroundColor: 'rgba(44,52,78,0.85)',
    borderWidth: 2,
    borderColor: 'rgba(96,165,250,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  knob: { backgroundColor: 'rgba(234,238,248,0.9)', borderWidth: 3, borderColor: 'rgb(60,110,220)' },
  arrow: {
    position: 'absolute',
    backgroundColor: colors.panel,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.panelLight,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  arrowText: { color: colors.text, fontSize: 18 },
  action: {
    backgroundColor: 'rgba(44,52,78,0.95)',
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  actionGlyph: { fontSize: 22 },
  actionText: { color: colors.text, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  small: {
    minHeight: HIT - 8,
    minWidth: HIT,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: colors.panel,
    borderWidth: 2,
    borderColor: colors.panelLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  smallGlyph: { color: colors.text, fontSize: 15, marginRight: 4 },
  smallText: { color: colors.text, fontSize: 13, fontWeight: '700' },
});

/**
 * Walkable tile world, full screen in landscape or portrait.
 *
 * Ways to move (all lead to the same step-by-step logic, so triggers and evidence behave identically):
 *  - Joystick (bottom-left): touch and slide in any direction; hold to keep walking smoothly.
 *  - Tap the ground: the traveller walks there by the shortest route.
 *  - Tap a person, sign or building: the traveller walks next to it and uses it (same as pressing Action).
 *  - Tap the edge arrow: walks towards the next objective.
 * The orange Action button (bottom-right) shows what it will do ("Enter", "Talk", "Read sign").
 * Speech bubbles pause walking; Action, or tapping the bubble, closes them.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, space, type } from '../../ui/theme';
import { LockIcon, UstadMehr } from '../../ui/icons';
import { Avatar, type AvatarLook } from './Avatar';
import { Sprite } from './sprites';
import { TileLayer } from './TileLayer';
import { cameraPx, findPath, height, interactable, objectAt, step, width, type Dir, type Pos, type TileMap, type WorldObject } from './tilemap';

/** kept for compatibility (portrait shows about 9 columns) */
export const VIEW_COLS = 9;
const STEP_MS = 165;
const PORTRAIT_CONTROLS = 176;

export interface WorldMessage { speaker?: 'mehr' | 'mayor' | 'none'; text: string }

type Target = { pos: Pos; object?: WorldObject };

export function World({ map, start, startFacing = 'up', look, onAction, onTrigger, onMove, message, onDismiss, hud }: {
  map: TileMap; start: Pos; startFacing?: Dir; look: AvatarLook;
  onAction: (o: WorldObject) => void; onTrigger?: (o: WorldObject) => void; onMove?: (p: Pos, f: Dir) => void;
  message?: WorldMessage | null; onDismiss?: () => void; hud?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState({ w: 0, h: 0 });
  const landscape = view.w > view.h;
  const tile = !view.w ? 0 : landscape
    ? Math.max(34, Math.min(64, Math.floor(view.h / 7)))
    : Math.max(34, Math.min(64, Math.floor(view.w / VIEW_COLS)));
  const insetBottom = landscape ? 0 : PORTRAIT_CONTROLS;

  const [pos, setPos] = useState<Pos>(start);
  const [facing, setFacing] = useState<Dir>(startFacing);
  const [goal, setGoal] = useState<Pos | null>(null);
  const posRef = useRef(pos);
  const moving = useRef(false);
  const held = useRef<Dir | null>(null);
  const queue = useRef<Dir[]>([]);
  const arrive = useRef<{ face?: Dir; object?: WorldObject } | null>(null);
  const [xy] = useState(() => new Animated.ValueXY({ x: 0, y: 0 }));
  const [cam] = useState(() => new Animated.ValueXY({ x: 0, y: 0 }));
  const camNow = useRef({ x: 0, y: 0 });
  const [bob] = useState(() => new Animated.Value(0));
  const mapRef = useRef(map);
  const cb = useRef({ onTrigger, onMove, onAction, message });
  useEffect(() => { mapRef.current = map; cb.current = { onTrigger, onMove, onAction, message }; });

  const camFor = useCallback((p: Pos) => cameraPx(mapRef.current, p, tile, view.w, view.h, insetBottom), [tile, view.w, view.h, insetBottom]);

  // place the traveller and camera when the world gets (or changes) its size — e.g. after rotating the phone
  useEffect(() => {
    if (!tile) return;
    const p = posRef.current;
    xy.setValue({ x: p.x * tile, y: p.y * tile });
    const c = camFor(p);
    cam.setValue(c);
    camNow.current = c;
  }, [tile, camFor, xy, cam]);

  // the step loop calls itself through a ref (one smooth chain of steps)
  const stepRef = useRef<(d: Dir) => void>(() => {});
  const stopAll = useCallback(() => { held.current = null; queue.current = []; arrive.current = null; setGoal(null); }, []);

  // a speech bubble pauses all walking (refs only; the route marker is hidden while a bubble is open)
  useEffect(() => { if (message) { held.current = null; queue.current = []; arrive.current = null; } }, [message]);

  const finishRoute = useCallback(() => {
    const a = arrive.current;
    arrive.current = null;
    setGoal(null);
    if (!a) return;
    if (a.face) setFacing(a.face);
    if (a.object && a.object.action && !cb.current.message) cb.current.onAction(a.object);
  }, []);

  const stepOnce = useCallback((dir: Dir) => {
    if (moving.current || !tile) return;
    if (cb.current.message) { stopAll(); return; }
    const r = step(mapRef.current, posRef.current, dir);
    setFacing(dir);
    if (!r.moved) { queue.current = []; arrive.current = null; setGoal(null); return; }
    moving.current = true;
    posRef.current = r.pos;
    setPos(r.pos);
    const c = camFor(r.pos);
    Animated.parallel([
      Animated.timing(xy, { toValue: { x: r.pos.x * tile, y: r.pos.y * tile }, duration: STEP_MS, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(cam, { toValue: c, duration: STEP_MS, easing: Easing.linear, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(bob, { toValue: -3, duration: STEP_MS / 2, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: STEP_MS / 2, useNativeDriver: true }),
      ]),
    ]).start(() => {
      moving.current = false;
      camNow.current = c;
      cb.current.onMove?.(r.pos, dir);
      if (r.triggered) { stopAll(); cb.current.onTrigger?.(r.triggered); return; }
      // keep going without a pause: next planned step, else the held joystick direction
      const next = queue.current.shift();
      if (next) { stepRef.current(next); return; }
      if (arrive.current) { finishRoute(); return; }
      if (held.current) stepRef.current(held.current);
    });
  }, [tile, camFor, xy, cam, bob, stopAll, finishRoute]);

  useEffect(() => { stepRef.current = stepOnce; }, [stepOnce]);

  /** walk to a tile, or next to an object and use it */
  const goTo = useCallback((t: Target) => {
    if (cb.current.message || !tile) return;
    held.current = null;
    const m = mapRef.current;
    const o = t.object;
    const plan = o && !o.trigger ? findPath(m, posRef.current, { x: o.x, y: o.y }, { adjacent: true }) : findPath(m, posRef.current, t.pos);
    if (!plan) return;
    queue.current = plan.dirs.slice();
    arrive.current = { face: plan.face, object: o && !o.trigger ? o : undefined };
    setGoal(plan.end);
    if (moving.current) return; // the running step continues into the new route
    const first = queue.current.shift();
    if (first) stepOnce(first); else finishRoute();
  }, [tile, stepOnce, finishRoute]);

  const onJoy = useCallback((d: Dir | null) => {
    held.current = d;
    if (d) { queue.current = []; arrive.current = null; setGoal(null); if (!moving.current) stepOnce(d); }
  }, [stepOnce]);

  const tapWorld = (e: GestureResponderEvent) => {
    if (message) { onDismiss?.(); return; }
    if (!tile) return;
    const x = Math.floor((e.nativeEvent.locationX - camNow.current.x) / tile);
    const y = Math.floor((e.nativeEvent.locationY - camNow.current.y) / tile);
    if (x < 0 || y < 0 || x >= width(map) || y >= height(map)) return;
    const o = objectAt(map, { x, y });
    goTo({ pos: { x, y }, object: o?.action || o?.trigger ? o : undefined });
  };

  const near = message ? undefined : interactable(map, pos, facing);
  const act = () => {
    if (message) { onDismiss?.(); return; }
    if (near) { stopAll(); onAction(near); }
  };

  // the next objective (bouncing "!"), and an arrow at the screen edge when it is off screen
  const objective = map.objects.find((o) => o.highlight);
  const pointer = objective && tile ? edgePointer(objective, tile, cameraPx(map, pos, tile, view.w, view.h, insetBottom), view, insetBottom) : null;

  const controlsBottom = Math.max(insets.bottom, space.sm);
  return (
    <View style={[st.root, { paddingTop: insets.top, paddingLeft: landscape ? insets.left : 0, paddingRight: landscape ? insets.right : 0 }]}>
      {hud}
      <View style={st.viewport} testID="world-viewport" onLayout={(e) => setView({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {tile ? (
          <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: width(map) * tile, height: height(map) * tile, transform: cam.getTranslateTransform() }}>
            <View style={[st.mapEdge, { width: width(map) * tile + 12, height: height(map) * tile + 12 }]} />
            <View style={st.layer}><TileLayer rows={map.rows} size={tile} /></View>
            {goal && !message ? <View style={[st.goal, { left: goal.x * tile + tile * 0.2, top: goal.y * tile + tile * 0.55, width: tile * 0.6, height: tile * 0.3, borderRadius: tile * 0.3 }]} /> : null}
            {map.objects.map((o) => {
              const dist = Math.abs(o.x - pos.x) + Math.abs(o.y - pos.y);
              const showName = !!o.name && (dist <= 3 || o.highlight);
              return (
                <View key={o.id} style={[st.obj, { left: o.x * tile, top: o.y * tile, width: tile, height: tile }]}>
                  <View style={o.locked ? { opacity: 0.55 } : undefined}><Sprite sprite={o.sprite} size={tile} tint={o.tint} /></View>
                  {o.done ? <View style={st.stamp}><Text style={st.stampText}>★</Text></View> : null}
                  {o.locked && o.sprite.startsWith('stop:') ? <View style={st.lock}><LockIcon size={16} color={colors.ink} /></View> : null}
                  {o.highlight ? <Bounce tile={tile} /> : null}
                  {showName ? <View style={[st.label, { top: -24 }]}><Text style={st.labelText} numberOfLines={1}>{o.name}</Text></View> : null}
                </View>
              );
            })}
            <Animated.View style={[st.obj, { width: tile, height: tile, transform: [...xy.getTranslateTransform(), { translateY: bob }] }]}>
              <Avatar look={look} facing={facing} size={tile} />
            </Animated.View>
          </Animated.View>
        ) : null}

        {/* tap anywhere in the world to walk there */}
        <View style={StyleSheet.absoluteFill} testID="world-tap" onStartShouldSetResponder={() => true} onResponderRelease={tapWorld}
          accessible={false} />

        {pointer && !message ? (
          <Pressable testID="objective-arrow" onPress={() => objective && goTo({ pos: { x: objective.x, y: objective.y }, object: objective })}
            accessibilityRole="button" accessibilityLabel={`Go to ${objective?.name ?? 'the next place'}`}
            style={[st.pointer, { left: pointer.x - 26, top: pointer.y - 26 }]}>
            <View style={{ transform: [{ rotate: `${pointer.angle}rad` }] }}><Text style={st.pointerArrow}>➤</Text></View>
            <View style={st.pointerTag}><Text style={st.pointerText} numberOfLines={1}>{objective?.name ?? 'Next'}</Text></View>
          </Pressable>
        ) : null}

        {message ? (
          <Pressable style={[st.bubbleWrap, landscape ? { left: 190, right: 190, bottom: space.md } : { bottom: PORTRAIT_CONTROLS + space.sm }]}
            onPress={onDismiss} accessibilityRole="button" accessibilityLabel={`${message.text}. Tap to continue`}>
            <View style={st.bubble}>
              {message.speaker === 'mehr' ? <UstadMehr size={44} /> : message.speaker === 'mayor' ? <Sprite sprite="mayor" size={44} /> : null}
              <Text style={[type.body, { flex: 1 }]}>{message.text}</Text>
            </View>
            <Text style={st.bubbleHint}>TAP TO CONTINUE ▸</Text>
          </Pressable>
        ) : null}

        <Joystick onDir={onJoy} disabled={!!message} style={{ left: space.md, bottom: controlsBottom }} />
        <ActionButton label={message ? 'OK' : near?.action ?? 'Action'} enabled={!!message || !!near} onPress={act}
          nearText={near?.name ?? ''} style={{ right: space.md, bottom: controlsBottom }} />
      </View>
    </View>
  );
}

/** where to draw the edge arrow for an off-screen objective (null when it is visible) */
function edgePointer(o: WorldObject, tile: number, camP: Pos, view: { w: number; h: number }, insetBottom: number) {
  const cx = camP.x + o.x * tile + tile / 2;
  const cy = camP.y + o.y * tile + tile / 2;
  const visH = view.h - insetBottom;
  const m = 40;
  if (cx > m && cx < view.w - m && cy > m && cy < visH - m) return null;
  const midX = view.w / 2;
  const midY = visH / 2;
  const angle = Math.atan2(cy - midY, cx - midX);
  const sx = (view.w / 2 - m) / Math.max(1e-6, Math.abs(Math.cos(angle)));
  const sy = (visH / 2 - m) / Math.max(1e-6, Math.abs(Math.sin(angle)));
  const r = Math.min(sx, sy);
  return { x: midX + Math.cos(angle) * r, y: midY + Math.sin(angle) * r, angle };
}

function Bounce({ tile }: { tile: number }) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: -5, duration: 450, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [v]);
  return <Animated.View style={[st.bang, { left: tile - 16, transform: [{ translateY: v }] }]}><Text style={st.bangText}>!</Text></Animated.View>;
}

// ------------------------------------------------------------------ joystick
const PAD = 148;
const KNOB = 58;

/**
 * One round pad: touch it and slide your thumb in any direction; the traveller walks that way for as long
 * as you hold. Sliding to another direction turns without lifting the thumb. A quick tap = one step.
 */
export function Joystick({ onDir, disabled, style }: { onDir: (d: Dir | null) => void; disabled?: boolean; style?: object }) {
  const [knob] = useState(() => new Animated.ValueXY({ x: 0, y: 0 }));
  const [dir, setDir] = useState<Dir | null>(null);
  const cur = useRef<Dir | null>(null);
  const emit = (d: Dir | null) => { if (d !== cur.current) { cur.current = d; setDir(d); onDir(d); } };
  const track = (e: GestureResponderEvent) => {
    const r = PAD / 2;
    let dx = e.nativeEvent.locationX - r;
    let dy = e.nativeEvent.locationY - r;
    const len = Math.hypot(dx, dy);
    const max = r - KNOB / 2;
    if (len > max) { dx = (dx / len) * max; dy = (dy / len) * max; }
    knob.setValue({ x: dx, y: dy });
    if (len < 10) return emit(null);
    emit(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  };
  const end = () => { emit(null); Animated.spring(knob, { toValue: { x: 0, y: 0 }, useNativeDriver: true, friction: 6 }).start(); };
  return (
    <View testID="dpad" style={[st.pad, disabled && { opacity: 0.45 }, style]}
      onStartShouldSetResponder={() => !disabled} onMoveShouldSetResponder={() => !disabled}
      onResponderGrant={track} onResponderMove={track} onResponderRelease={end} onResponderTerminate={end}
      onResponderTerminationRequest={() => false}
      accessible accessibilityRole="adjustable" accessibilityLabel="Walking joystick. Slide to walk."
      accessibilityActions={[{ name: 'up', label: 'Walk up' }, { name: 'down', label: 'Walk down' }, { name: 'left', label: 'Walk left' }, { name: 'right', label: 'Walk right' }]}
      onAccessibilityAction={(e) => { const d = e.nativeEvent.actionName as Dir; onDir(d); onDir(null); }}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {(['up', 'down', 'left', 'right'] as Dir[]).map((d) => (
          <Text key={d} style={[st.padArrow, ARROW_POS[d], dir === d && { color: '#FFFFFF' }]}>{ARROWS[d]}</Text>
        ))}
        <Animated.View style={[st.knob, { transform: knob.getTranslateTransform() }]} />
      </View>
    </View>
  );
}

const ARROWS: Record<Dir, string> = { up: '▲', down: '▼', left: '◀', right: '▶' };
const ARROW_POS: Record<Dir, object> = {
  up: { top: 8, left: 0, right: 0, textAlign: 'center' },
  down: { bottom: 8, left: 0, right: 0, textAlign: 'center' },
  left: { left: 12, top: PAD / 2 - 13 },
  right: { right: 12, top: PAD / 2 - 13 },
};

function ActionButton({ label, enabled, onPress, nearText, style }: { label: string; enabled: boolean; onPress: () => void; nearText: string; style?: object }) {
  const [pulse] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (!enabled) { pulse.setValue(1); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.07, duration: 520, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 520, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [enabled, label, pulse]);
  return (
    <View style={[st.actionCol, style]} pointerEvents="box-none">
      {nearText ? <View style={st.nearTag}><Text style={st.nearText} numberOfLines={1}>{nearText}</Text></View> : null}
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Pressable onPress={enabled ? onPress : undefined} testID="action-btn" accessibilityRole="button" accessibilityLabel={label}
          accessibilityState={{ disabled: !enabled }} aria-disabled={!enabled}
          style={({ pressed }) => [st.action, !enabled && st.actionOff, pressed && enabled && { transform: [{ scale: 0.94 }] }]}>
          <Text style={[st.actionText, !enabled && { color: colors.inkMuted }]} numberOfLines={2}>{label}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#2E4A3A' },
  viewport: { flex: 1, overflow: 'hidden', backgroundColor: '#355E45' },
  layer: { position: 'absolute', left: 0, top: 0 },
  mapEdge: { position: 'absolute', left: -6, top: -6, borderRadius: 10, backgroundColor: '#24402F' },
  obj: { position: 'absolute', left: 0, top: 0, alignItems: 'center', justifyContent: 'center' },
  goal: { position: 'absolute', borderWidth: 3, borderColor: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.25)' },
  label: { position: 'absolute', alignSelf: 'center', backgroundColor: 'rgba(31,42,46,0.85)', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, maxWidth: 170 },
  labelText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  stamp: { position: 'absolute', right: -2, top: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: '#E3B23C', alignItems: 'center', justifyContent: 'center' },
  stampText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  lock: { position: 'absolute', right: -2, bottom: -2, backgroundColor: '#FFFFFFCC', borderRadius: 10, padding: 2 },
  bang: { position: 'absolute', top: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  bangText: { color: '#2B1A08', fontWeight: '900', fontSize: 15 },
  pointer: { position: 'absolute', width: 52, height: 52, borderRadius: 26, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFFFFF' },
  pointerArrow: { color: '#2B1A08', fontSize: 22, fontWeight: '900' },
  pointerTag: { position: 'absolute', top: 54, backgroundColor: 'rgba(31,42,46,0.85)', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, maxWidth: 140 },
  pointerText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  bubbleWrap: { position: 'absolute', left: space.md, right: space.md, gap: 4 },
  bubble: { flexDirection: 'row', gap: space.md, alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: space.md, borderWidth: 2, borderColor: colors.primary },
  bubbleHint: { ...type.label, alignSelf: 'flex-end', color: '#FFFFFF', backgroundColor: 'rgba(31,42,46,0.7)', paddingHorizontal: 8, borderRadius: radius.pill, overflow: 'hidden' },
  pad: { position: 'absolute', width: PAD, height: PAD, borderRadius: PAD / 2, backgroundColor: 'rgba(31,42,46,0.42)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.55)' },
  padArrow: { position: 'absolute', color: 'rgba(255,255,255,0.75)', fontSize: 18, fontWeight: '900' },
  knob: { position: 'absolute', left: PAD / 2 - KNOB / 2, top: PAD / 2 - KNOB / 2, width: KNOB, height: KNOB, borderRadius: KNOB / 2, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 3, borderColor: colors.primary },
  actionCol: { position: 'absolute', alignItems: 'center', gap: 6, width: 128 },
  nearTag: { backgroundColor: 'rgba(31,42,46,0.85)', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3, maxWidth: 140 },
  nearText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  action: { width: 108, height: 108, borderRadius: 54, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', padding: space.sm, borderWidth: 4, borderColor: '#F3C089' },
  actionOff: { backgroundColor: 'rgba(228,217,198,0.85)', borderColor: 'rgba(255,255,255,0.6)' },
  actionText: { color: '#2B1A08', fontSize: 16, fontWeight: '900', textAlign: 'center' },
});

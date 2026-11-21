/**
 * Hands-on activity screen used by all interest levels. The current step is shown as a goal; the
 * student completes it by dragging, tapping or holding. Extra (optional) steps appear as sparkly
 * chips. Finishing early or leaving is always possible and never penalised.
 *
 * Accessibility: every drag can also be done by tapping the item, then the target.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { canFinish, optionalSteps, requiredSteps, stepAvailable, type Job } from '../../core/levels/machine';
import type { Step, TaskDef } from '../../core/tasks';
import { Button } from '../../ui/components';
import { CheckIcon, StarIcon, TaskGlyph } from '../../ui/icons';
import { colors, radius, space, type } from '../../ui/theme';
import { Avatar } from '../engine/Avatar';
import { Hud } from '../Hud';
import { ItemIcon } from './items';
import { actionFor, KINDS, TASK_KIND, type Action } from './kinds';

const HOLD_MS = 900;
const PALETTE = ['#D2607F', '#E3B23C', '#5B8BC9', '#3E8E5A', '#6B5BA8'];

type Rect = { x: number; y: number; w: number; h: number };

export function MiniGameStage({ task, job, onStep, onFinish, onLeave, finishLabel = 'Finish', sub, coins }: {
  task: TaskDef; job: Job; onStep: (id: string) => void; onFinish: () => void; onLeave: () => void; finishLabel?: string; sub?: string; coins?: number;
}) {
  const kind = TASK_KIND[task.id];
  const def = KINDS[kind];
  const req = requiredSteps(task);
  const opt = optionalSteps(task);
  const actionOf = (s: Step): Action => (s.optional ? actionFor(kind, req.length, true, opt.indexOf(s)) : actionFor(kind, req.length, false, req.indexOf(s)));

  const [chosenExtra, setChosenExtra] = useState<string | null>(null);
  const nextReq = req.find((s) => !job.done.includes(s.id));
  const extra = chosenExtra ? opt.find((s) => s.id === chosenExtra && stepAvailable(task, job, s)) : undefined;
  const current: Step | undefined = extra ?? nextReq;
  const action = current ? actionOf(current) : undefined;

  // per-step progress, tied to the step id so it resets automatically when the step changes
  const [prog, setProg] = useState<{ step: string; taps: number; selected: boolean }>({ step: '', taps: 0, selected: false });
  const stepKey = current?.id ?? '';
  const taps = prog.step === stepKey ? prog.taps : 0;
  const selected = prog.step === stepKey ? prog.selected : false; // tap-to-drag fallback
  const setTaps = (n: number) => setProg({ step: stepKey, taps: n, selected });
  const setSelected = (v: boolean | ((x: boolean) => boolean)) => setProg({ step: stepKey, taps, selected: typeof v === 'function' ? v(selected) : v });
  const [colour, setColour] = useState<string | null>(null);
  const [painted, setPainted] = useState<Record<number, string>>({});
  const [palette, setPalette] = useState(PALETTE.slice(0, 4));
  const [cheer, setCheer] = useState<string | null>(null);
  const rects = useRef<Record<number, Rect>>({});
  type Measurable = { measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => void };
  const targetRefs = useRef<Record<number, Measurable | null>>({});
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holdV] = useState(() => new Animated.Value(0));
  const [pop] = useState(() => new Animated.Value(1));

  useEffect(() => () => { if (holdTimer.current) clearTimeout(holdTimer.current); }, []);
  // reset per-step progress when the step changes
  useEffect(() => { holdV.setValue(0); }, [stepKey, holdV]);

  const complete = () => {
    if (!current) return;
    if (action?.mode === 'hold' && def.targets[action.target].key === 'bowl') setPalette((p) => (p.length < PALETTE.length ? [...p, PALETTE[p.length]] : p));
    setCheer(current.optional ? 'Extra done!' : 'Nice!');
    setTimeout(() => setCheer(null), 700);
    Animated.sequence([
      Animated.timing(pop, { toValue: 1.12, duration: 120, useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, useNativeDriver: true }),
    ]).start();
    if (current.optional) setChosenExtra(null);
    onStep(current.id);
  };

  const measure = (i: number) => targetRefs.current[i]?.measureInWindow((x, y, w, h) => { rects.current[i] = { x, y, w, h }; });
  const measureAll = () => def.targets.forEach((_, i) => measure(i));

  const onTargetPress = (i: number) => {
    if (!action || action.target !== i) return;
    if (action.mode === 'tap') {
      const n = taps + 1;
      setTaps(n);
      Animated.sequence([
        Animated.timing(pop, { toValue: 0.92, duration: 60, useNativeDriver: true }),
        Animated.timing(pop, { toValue: 1, duration: 90, useNativeDriver: true }),
      ]).start();
      if (n >= (action.count ?? 1)) complete();
    } else if (action.mode === 'drag' && selected) {
      setSelected(false);
      complete();
    } else if (action.mode === 'paint' && colour) {
      setPainted((p) => ({ ...p, [i]: colour }));
      complete();
    }
  };
  const onHoldIn = (i: number) => {
    if (!action || action.mode !== 'hold' || action.target !== i) return;
    Animated.timing(holdV, { toValue: 1, duration: HOLD_MS, useNativeDriver: false }).start();
    holdTimer.current = setTimeout(() => { holdTimer.current = null; complete(); }, HOLD_MS);
  };
  const onHoldOut = () => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; Animated.timing(holdV, { toValue: 0, duration: 150, useNativeDriver: false }).start(); }
  };
  const onDrop = (pageX: number, pageY: number) => {
    if (!action || action.mode !== 'drag') return false;
    const r = rects.current[action.target];
    if (r && pageX >= r.x - 12 && pageX <= r.x + r.w + 12 && pageY >= r.y - 12 && pageY <= r.y + r.h + 12) { complete(); return true; }
    return false;
  };

  const ready = canFinish(task, job);
  const availableExtras = opt.filter((s) => stepAvailable(task, job, s));

  const renderTarget = (i: number) => {
    const key = def.targets[i].key;
    const active = action?.target === i && !!current;
    const big = i === 0 || kind === 'create';
    const size = kind === 'create' ? (key === 'bowl' ? 64 : 86) : big ? 150 : 84;
    let art: React.ReactNode;
    if (key === 'machine' || key === 'lab') art = <TaskGlyph glyph={task.glyph} size={size * 0.75} color={task.tint} />;
    else if (key === 'notebook') art = <TaskGlyph glyph="book" size={size * 0.7} color="#8A5A3B" />;
    else if (key === 'person') art = <Avatar look={{ style: 'short', skin: 2, outfit: '#7D6B5A' }} size={size * 0.85} />;
    else if (key === 'merchant') art = <Avatar look={{ style: 'cap', skin: 0, outfit: '#C2A23A' }} size={size * 0.85} />;
    else if (key === 'crowd') art = <View style={{ flexDirection: 'row' }}>{[0, 1, 2].map((k) => <Avatar key={k} look={{ style: (['hijab', 'short', 'braid'] as const)[k], skin: k, outfit: ['#6B5BA8', '#3E8E5A', '#C24F7E'][k] }} size={size * 0.42} />)}</View>;
    else if (key === 'fire') art = <TaskGlyph glyph="fire" size={size * 0.7} color="#E08A3C" />;
    else if (key === 'shelf') art = <Shelf size={size} />;
    else if (key === 'ledger') art = <TaskGlyph glyph="ledger" size={size * 0.7} color="#5E9C8E" />;
    else if (key === 'bowl') art = <TaskGlyph glyph="palette" size={size * 0.75} color="#D2607F" />;
    else art = <View style={[st.tile, { width: size * 0.8, height: size * 0.8, backgroundColor: painted[i] ?? '#FFFFFF' }]}>{job.done.includes(opt[1]?.id ?? '_') && i === 1 ? <StarIcon size={30} color="#FFFFFF" /> : null}</View>;
    return (
      <Pressable key={key} testID={`target-${key}`} ref={(r) => { targetRefs.current[i] = r as unknown as Measurable; }} onLayout={() => measure(i)}
        onPress={() => onTargetPress(i)} onPressIn={() => onHoldIn(i)} onPressOut={onHoldOut}
        accessibilityRole="button" accessibilityLabel={`${def.targets[i].label}${active && action ? `. ${action.hint}` : ''}`}
        style={[st.target, { width: size + 16, height: size + 16 }, active && st.targetActive]}>
        <Animated.View style={active ? { transform: [{ scale: pop }] } : undefined}>{art}</Animated.View>
        {active && action?.mode === 'hold' ? <View style={st.holdTrack}><Animated.View style={[st.holdFill, { width: holdV.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} /></View> : null}
        {active && action?.mode === 'tap' && (action.count ?? 1) > 1 ? (
          <View style={st.pips}>{Array.from({ length: action.count ?? 1 }, (_, k) => <View key={k} style={[st.pip, k < taps && { backgroundColor: colors.primary }]} />)}</View>
        ) : null}
      </Pressable>
    );
  };

  return (
    <View style={[st.root, { backgroundColor: def.backdrop }]}>
      <Hud title={task.place} sub={sub} coins={coins} />
      <View style={st.goal} accessibilityLiveRegion="polite">
        {current ? (
          <>
            <Text style={type.label}>{current.optional ? 'EXTRA (OPTIONAL)' : `STEP ${req.indexOf(current) + 1} OF ${req.length}`}</Text>
            <Text style={type.subtitle}>{current.label}</Text>
            <Text style={[type.small, { color: colors.primaryDark }]}>👉 {action?.hint}{action?.mode === 'drag' && selected ? ' — now tap the target' : ''}</Text>
          </>
        ) : (
          <>
            <Text style={type.subtitle}>All the main steps are done!</Text>
            <Text style={type.small}>Finish now, or try an extra if you like.</Text>
          </>
        )}
      </View>

      <View style={st.stage} onLayout={measureAll}>
        <View style={kind === 'create' ? st.tilesRow : st.targetsRow}>{def.targets.map((_, i) => renderTarget(i))}</View>
        {cheer ? <View style={st.cheer} pointerEvents="none"><CheckIcon size={22} color="#FFFFFF" /><Text style={st.cheerText}>{cheer}</Text></View> : null}
      </View>

      <View style={st.tray}>
        {action?.mode === 'drag' && action.item ? (
          <Draggable key={`${current?.id}`} selected={selected} onSelect={() => setSelected((v) => !v)} onDragStart={measureAll} onDrop={onDrop}>
            <ItemIcon item={action.item} size={64} />
          </Draggable>
        ) : null}
        {action?.mode === 'paint' ? (
          <View style={st.palette}>
            {palette.map((c) => (
              <Pressable key={c} testID={`colour-${c}`} onPress={() => setColour(c)} accessibilityRole="button" accessibilityLabel={`Colour ${c}`} accessibilityState={{ selected: colour === c }}
                style={[st.swatch, { backgroundColor: c }, colour === c && st.swatchSel]} />
            ))}
          </View>
        ) : null}
        {action?.mode === 'tap' || action?.mode === 'hold' ? <Text style={[type.small, { textAlign: 'center' }]}>{action.mode === 'tap' ? 'Tap the glowing picture' : 'Press and keep holding the glowing picture'}</Text> : null}
      </View>

      {availableExtras.length ? (
        <View style={st.extras}>
          <Text style={type.label}>EXTRAS</Text>
          {availableExtras.map((s) => (
            <Pressable key={s.id} testID={`extra-${s.id}`} onPress={() => setChosenExtra(s.id)} accessibilityRole="button" accessibilityLabel={`Extra: ${s.label}`}
              style={[st.extra, chosenExtra === s.id && st.extraOn]}>
              <StarIcon size={14} />
              <Text style={[type.small, { color: colors.ink }]} numberOfLines={1}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={st.footer}>
        <Button label={finishLabel} onPress={onFinish} disabled={!ready} testID="job-finish" style={{ flex: 2 }} />
        <Button label="Leave" variant="secondary" onPress={onLeave} testID="job-leave" style={{ flex: 1 }} />
      </View>
    </View>
  );
}

function Draggable({ children, onDrop, onSelect, onDragStart, selected }: { children: React.ReactNode; onDrop: (x: number, y: number) => boolean; onSelect: () => void; onDragStart: () => void; selected: boolean }) {
  const [pan] = useState(() => new Animated.ValueXY());
  const cbs = useRef({ onDrop, onSelect, onDragStart });
  useEffect(() => { cbs.current = { onDrop, onSelect, onDragStart }; });
  // Taps go to the inner Pressable (select, then tap the target); only real finger movement starts a drag.
  // The ref is read only inside gesture callbacks, never during render (lint false positive for this pattern).
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
    onPanResponderGrant: () => cbs.current.onDragStart(),
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
    onPanResponderRelease: (_e, g) => {
      if (!cbs.current.onDrop(g.moveX, g.moveY)) Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      else pan.setValue({ x: 0, y: 0 });
    },
    onPanResponderTerminate: () => Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start(),
  }));
  return (
    <Animated.View {...responder.panHandlers} style={{ transform: pan.getTranslateTransform() }}>
      <Pressable testID="drag-item" onPress={() => cbs.current.onSelect()} accessibilityRole="button"
        accessibilityLabel={selected ? 'Item picked up. Now tap the glowing target.' : 'Item to move. Drag it to the target, or tap it and then tap the target.'}
        style={[st.dragItem, selected && st.dragSel]}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

function Shelf({ size }: { size: number }) {
  return (
    <View style={{ width: size * 0.8, height: size * 0.7, borderWidth: 4, borderColor: '#8A5A3B', borderRadius: 6, justifyContent: 'space-around', backgroundColor: '#F3E2C3' }}>
      <View style={{ height: 4, backgroundColor: '#8A5A3B' }} />
      <View style={{ height: 4, backgroundColor: '#8A5A3B' }} />
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  goal: { backgroundColor: colors.surface, margin: space.md, marginBottom: 0, borderRadius: radius.md, padding: space.md, gap: 2, borderWidth: 1, borderColor: colors.border },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.md },
  targetsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.lg, flexWrap: 'wrap' },
  tilesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, flexWrap: 'wrap' },
  target: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.55)', borderWidth: 3, borderColor: 'transparent' },
  targetActive: { borderColor: colors.accent, backgroundColor: '#FFFFFF' },
  tile: { borderRadius: 8, borderWidth: 2, borderColor: '#B9A07E', alignItems: 'center', justifyContent: 'center' },
  holdTrack: { position: 'absolute', bottom: 8, left: 12, right: 12, height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' },
  holdFill: { height: 8, backgroundColor: colors.primary },
  pips: { position: 'absolute', bottom: 8, flexDirection: 'row', gap: 6 },
  pip: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.border },
  cheer: { position: 'absolute', top: space.md, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.success, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 6 },
  cheerText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  tray: { minHeight: 96, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.md },
  dragItem: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.primary },
  dragSel: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  palette: { flexDirection: 'row', gap: space.sm },
  swatch: { width: 52, height: 52, borderRadius: 26, borderWidth: 3, borderColor: '#FFFFFF' },
  swatchSel: { borderColor: colors.ink, transform: [{ scale: 1.1 }] },
  extras: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, paddingBottom: space.sm },
  extra: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: space.md, borderRadius: radius.pill, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.accent, backgroundColor: '#FFFFFFAA', maxWidth: '100%' },
  extraOn: { backgroundColor: colors.accentSoft, borderStyle: 'solid' },
  footer: { flexDirection: 'row', gap: space.sm, padding: space.md, paddingBottom: space.lg, backgroundColor: colors.parchment, borderTopWidth: 1, borderTopColor: colors.border },
});

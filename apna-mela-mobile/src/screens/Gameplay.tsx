/** Five-day gameplay: map, stall arrival, What / Loved-it / How cards, Hudhud's diary and the daily summary. */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useApp } from '../app/AppContext';
import { useBack, useMusic, useOnce } from '../app/hooks';
import { content } from '../logic/content';
import { pick } from '../logic/rng';
import { useL } from '../ui/layout';
import {
  Bg, Btn, Bubble, Char, Check, Hud, Img, Panel, Pill, Polaroid, Portrait, Ribbon, Stepper, T, Tap, useAppear, useLoop, useMotion,
} from '../ui/kit';
import { c, CREAM, INK, INK2, LILAC, NAME_COLOR, NAMES, WHITE } from '../ui/theme';
import { avatarOf } from './Story';

const TENT_W = 187;
const TENT_H = 167;
const dayMusic = (day: number) => (day === 5 ? 'mus_mela_day5' : 'mus_day_prep');

// =============================================================================== map
export function MapScreen() {
  const L = useL();
  const app = useApp();
  const s = app.session;
  useMusic(dayMusic(s.day));
  useBack(() => app.push({ name: 'pause' }));
  const avail = new Set(s.availableStalls());
  const n = s.progress.stalls_today.length;
  const tip = useMemo(() => (n === 0 ? content.dialogues.days[String(s.day)].map_tip : pick(content.dialogues.after_visit_map)), []); // eslint-disable-line react-hooks/exhaustive-deps
  const buddy = content.buddy(s.day);
  const ox = L.cx - 640;
  const open = (sid: string | null) => {
    if (sid && !avail.has(sid)) {
      app.toast("You've already helped here today. Try another stall!", 'purple');
      return;
    }
    app.push({ name: 'stallSelect', pre: sid });
  };
  const marker = useLoop(900);
  return (
    <View style={{ flex: 1, backgroundColor: '#8CC66B' }}>
      <Bg src="backgrounds/bg_mela_map" blur={14} />
      <View style={L.box(ox, 0, 1280, 720)}>
        <Img src="backgrounds/bg_mela_map" style={{ width: '100%', height: '100%' }} fit="cover" />
      </View>
      {s.day === 5
        ? [0, 1, 2, 3, 4, 5].map((k) => {
            const ang = k * 1.05 + 0.4;
            return <Char key={k} kind={`av${(k + 3) % 8}`} x={ox + 640 + Math.cos(ang) * 500} y={400 + Math.sin(ang) * 215} h={72} expr="happy" phase={k} />;
          })
        : null}
      {content.stalls.map((st) => {
        const [x, y] = st.map;
        const visited = !avail.has(st.id);
        return (
          <React.Fragment key={st.id}>
            <Tap at={[ox + x, y, TENT_W, TENT_H + 40]} onPress={() => open(st.id)} label={st.name} sound={visited ? null : 'sfx_card_select'} testID={`tent_${st.id}`}>
              <View style={{ flex: 1 }} />
            </Tap>
            <View pointerEvents="none" style={[L.box(ox + x + TENT_W / 2 - 110, y + TENT_H - 12, 220, 52), { alignItems: 'center' }]}>
              <Pill style={{ height: 52 * L.s }}>
                <View style={{ width: 36 * L.s, height: 36 * L.s, borderRadius: 18 * L.s, backgroundColor: c(st.color), borderWidth: 2.5 * L.s, borderColor: INK, alignItems: 'center', justifyContent: 'center', marginRight: 8 * L.s }}>
                  <Img src={st.icon} style={{ width: 24 * L.s, height: 24 * L.s }} />
                </View>
                <T size={22} font="baloo" fixed>{st.short}</T>
              </Pill>
            </View>
            {visited ? <Check x={ox + x + TENT_W - 22} y={y + 22} d={48} /> : null}
          </React.Fragment>
        );
      })}
      <Char kind="hudhud" x={ox + 760} y={300} h={72} pose="fly" expr="happy" />
      <Char kind={avatarOf(app)} x={ox + 640} y={600} h={112} />
      <Animated.View pointerEvents="none" style={[L.box(ox + 624, 462, 32, 24), { transform: [{ translateY: marker.interpolate({ inputRange: [0, 1], outputRange: [0, 8 * L.s] }) }] }]}>
        <View style={{ width: 0, height: 0, borderLeftWidth: 16 * L.s, borderRightWidth: 16 * L.s, borderTopWidth: 22 * L.s, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: c('pink') }} />
      </Animated.View>
      <Panel at={[L.left, 578, 380, 124]} radius={24} lip={6} pointerEvents="none">
        <View style={{ flex: 1, paddingHorizontal: 20 * L.s, paddingVertical: 10 * L.s }}>
          <T size={28} font="baloo">Today's plan</T>
          <T size={20} font="nunito_x" color={INK2}>Help at 3 different stalls</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 * L.s }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={{ width: 84 * L.s, height: 20 * L.s, borderRadius: 10 * L.s, marginRight: 8 * L.s, borderWidth: 2.5 * L.s, borderColor: INK, backgroundColor: i < n ? c('green') : WHITE }} />
            ))}
            <T size={22} font="baloo" style={{ marginLeft: 6 * L.s }}>{`${n} / 3`}</T>
          </View>
        </View>
      </Panel>
      <Btn at={[L.cx - 175, 610, 350, 92]} label="Choose a Stall" size={32} onPress={() => open(null)} pulse testID="choose" />
      <Portrait kind={buddy} expr="talk" x={L.right - 430} y={644} d={100} ring={NAME_COLOR[buddy]} />
      <View pointerEvents="none" style={L.box(L.right - 372, 584, 372, 118)}>
        <Bubble rel at={[0, 0, 372, 110]}>
          <T size={21}>{`${NAMES[buddy]}: ${tip}`}</T>
        </Bubble>
      </View>
      <Hud />
    </View>
  );
}

// =============================================================================== stall arrival
export function StallScreen() {
  const L = useL();
  const app = useApp();
  const s = app.session;
  useMusic('mus_stall_focus');
  useBack(() => app.push({ name: 'pause' }));
  const stall = useMemo(() => content.stallById[s.progress.stall as string], []); // eslint-disable-line react-hooks/exhaustive-deps
  const steps = useMemo(() => s.visitSteps(), []); // eslint-disable-line react-hooks/exhaustive-deps
  const buddy = content.buddy(s.day);
  const line = content.dialogues.arrivals[buddy][stall.id];
  useOnce(() => app.sfx('sfx_hudhud_chirp_01', 0.3));
  const start = () => {
    s.arrive();
    const step = s.currentStep();
    if (step) app.replace({ name: 'what', id: step[1] });
  };
  const glow = useLoop(1100);
  const cx = L.cx;
  const bx = Math.min(L.right - 360, cx + 250);
  return (
    <View style={{ flex: 1 }}>
      <Bg src={stall.bg} />
      <Ambient sid={stall.id} />
      <Char kind={buddy} x={cx - 450} y={720} h={buddy === 'karim' ? 450 : 420} pose="point" expr="talk" />
      <Char kind={avatarOf(app)} x={cx - 10} y={720} h={380} flip phase={1} />
      <View pointerEvents="none" style={L.box(cx - 340, 160, 400, 230)}>
        <Bubble rel at={[0, 0, 400, 220]} name={NAMES[buddy]} nameColor={NAME_COLOR[buddy]}>
          <T size={24}>{`${line} ${content.dialogues.board_prompt}`}</T>
        </Bubble>
      </View>
      <Tap at={[bx, 160, 350, 330]} onPress={start} label="Open the Job Board" sound="sfx_card_deal" testID="job_board">
        <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 26 * L.s, backgroundColor: c('yellow'), opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.7] }), transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1.02, 1.07] }) }] }]} />
        <Panel fill="#C98B5A" radius={18} ow={4.5} lip={7} style={{ flex: 1 }}>
          <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', padding: 22 * L.s, paddingTop: 40 * L.s, justifyContent: 'space-between' }}>
            {[WHITE, '#FFE08A', '#FFD1DC', '#D8F0E8'].map((col, i) => (
              <View key={i} style={{ width: 138 * L.s, height: 104 * L.s, marginBottom: 14 * L.s, backgroundColor: col, borderRadius: 5 * L.s, borderWidth: 2.6 * L.s, borderColor: INK, padding: 14 * L.s, paddingTop: 26 * L.s }}>
                <View style={{ height: 8 * L.s, width: '85%', borderRadius: 4 * L.s, backgroundColor: 'rgba(38,33,74,0.3)', marginBottom: 10 * L.s }} />
                <View style={{ height: 8 * L.s, width: '60%', borderRadius: 4 * L.s, backgroundColor: 'rgba(38,33,74,0.3)' }} />
              </View>
            ))}
          </View>
        </Panel>
        <View style={{ position: 'absolute', left: 70 * L.s, top: -26 * L.s }}>
          <Panel fill={c('yellow')} radius={16} ow={3.4} lip={6} lipColor="#D99A0B" style={{ paddingHorizontal: 22 * L.s, paddingVertical: 4 * L.s }}>
            <T size={28} font="baloo" fixed>JOB BOARD</T>
          </Panel>
        </View>
        <View style={{ position: 'absolute', right: 12 * L.s, bottom: -6 * L.s }}>
          <Panel fill={c('pink')} radius={24} ow={3.2} lip={5} lipColor="#B81F51" style={{ paddingHorizontal: 22 * L.s, paddingVertical: 4 * L.s }}>
            <T size={30} font="baloo" color={WHITE} shadow fixed>Tap!</T>
          </Panel>
        </View>
      </Tap>
      <Stepper kinds={steps.map((x) => x[0])} cur={0} cx={bx + 175} y={540} />
      <Hud />
    </View>
  );
}

/** A little living detail per stall (steam, bubbles, sparkles...). Off with Reduce motion. */
function Ambient({ sid }: { sid: string }) {
  const L = useL();
  const motion = useMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!motion) return;
    const a = Animated.loop(Animated.timing(v, { toValue: 1, duration: 2600, easing: Easing.linear, useNativeDriver: true }));
    a.start();
    return () => a.stop();
  }, [motion, v]);
  if (!motion) return null;
  const spec: Record<string, { x: number; y: number; dy: number; col: string; n: number; r: number }> = {
    chatkhara: { x: 0.18, y: 0.5, dy: -110, col: 'rgba(255,255,255,0.75)', n: 4, r: 18 },
    jugnu: { x: 0.3, y: 0.58, dy: -90, col: 'rgba(157,214,245,0.9)', n: 6, r: 10 },
    rangmahal: { x: 0.25, y: 0.35, dy: -40, col: 'rgba(255,201,60,0.9)', n: 6, r: 10 },
    madad: { x: 0.77, y: 0.58, dy: -120, col: 'rgba(232,51,109,0.8)', n: 3, r: 14 },
    karigar: { x: 0.22, y: 0.45, dy: 120, col: 'rgba(232,200,144,0.95)', n: 8, r: 5 },
    hisaab: { x: 0.25, y: 0.42, dy: -30, col: 'rgba(255,143,163,0.9)', n: 4, r: 12 },
  };
  const sp = spec[sid];
  if (!sp) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: sp.n }, (_, k) => {
        const off = k / sp.n;
        const p = v.interpolate({ inputRange: [0, 1 - off, 1 - off + 0.0001, 1], outputRange: [off, 1, 0, off] });
        return (
          <Animated.View
            key={k}
            style={{
              position: 'absolute', left: (sp.x * L.W + k * 34) * L.s, top: sp.y * L.H * L.s, width: sp.r * 2 * L.s, height: sp.r * 2 * L.s, borderRadius: sp.r * L.s,
              backgroundColor: sp.col, opacity: p.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
              transform: [{ translateY: p.interpolate({ inputRange: [0, 1], outputRange: [0, sp.dy * L.s] }) }, { translateX: p.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 10 * L.s, -6 * L.s] }) }],
            }}
          />
        );
      })}
    </View>
  );
}

// =============================================================================== card screen helpers
function useCardBase() {
  const app = useApp();
  const s = app.session;
  const base = useMemo(() => ({
    stall: content.stallById[s.progress.stall as string],
    buddy: content.buddy(s.day),
    steps: s.visitSteps(),
    stepIndex: s.progress.step,
    visitsBefore: s.progress.stalls_today.length,
  }), []); // eslint-disable-line react-hooks/exhaustive-deps
  useMusic('mus_stall_focus');
  useBack(() => app.push({ name: 'pause' }));
  return base;
}

/** Confirm -> short "CONFIRMED!" stamp -> commit. Taps during the stamp are ignored (no double answers). */
function useStamp(commit: () => void) {
  const app = useApp();
  const motion = useMotion();
  const [stamping, setStamping] = useState(false);
  const v = useRef(new Animated.Value(0)).current;
  const go = () => {
    if (stamping) return;
    setStamping(true);
    app.haptic('success');
    Animated.spring(v, { toValue: 1, useNativeDriver: true, friction: 5, tension: 120 }).start();
    setTimeout(commit, motion ? 480 : 150);
  };
  return { stamping, go, v };
}

function Stamp({ v, x, y }: { v: Animated.Value; x: number; y: number }) {
  const L = useL();
  return (
    <Animated.View pointerEvents="none" style={[L.box(x - 130, y - 44, 260, 88), { opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1.8, 1] }) }, { rotate: '-6deg' }] }]}>
      <Panel fill={c('pink')} radius={16} ow={4} style={{ flex: 1 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <T size={38} font="baloo" color={WHITE} shadow fixed>CONFIRMED!</T>
        </View>
      </Panel>
    </Animated.View>
  );
}

function CardBg({ src }: { src: string }) {
  return <Bg src={src} blur={10} tint="rgba(27,23,51,0.5)" />;
}

function Entry({ i, children, from = 'below', at }: { i: number; children: React.ReactNode; from?: 'below' | 'left' | 'right'; at: [number, number, number, number] }) {
  const L = useL();
  const a = useAppear(i * 90, 0);
  const off = from === 'below' ? { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [160 * L.s, 0] }) } : { translateX: a.interpolate({ inputRange: [0, 1], outputRange: [(from === 'left' ? -220 : 220) * L.s, 0] }) };
  return <Animated.View style={[L.box(at[0], at[1], at[2], at[3]), { opacity: a, transform: [off] }]}>{children}</Animated.View>;
}

// =============================================================================== What card (RIASEC)
export function WhatCard({ id }: { id: string }) {
  const L = useL();
  const app = useApp();
  const s = app.session;
  const base = useCardBase();
  const card = content.whatById[id];
  const options = useMemo(() => s.optionOrder(id, card.options.length).map((i) => card.options[i]), [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [sel, setSel] = useState<number | null>(null);
  useOnce(() => app.sfx('sfx_card_deal', 0.6));
  const stamp = useStamp(() => {
    s.recordWhat(id, options.map((o) => o.key), options[sel as number].key);
    app.fx('sparkle', L.left + 400, 50, 8);
    app.afterStep(base.visitsBefore);
  });
  const confirm = () => {
    if (sel === null) return;
    app.sfx('sfx_confirm_stamp');
    stamp.go();
  };
  const choose = (i: number) => {
    if (stamp.stamping) return;
    if (sel === i) return confirm();
    setSel(i);
  };
  const avail = L.right - L.left;
  const cw = Math.min(400, (avail - 60) / 3);
  const gap = Math.min(36, (avail - cw * 3) / 2);
  const x0 = L.cx - (cw * 3 + gap * 2) / 2;
  const n = parseInt(id.slice(1), 10);
  return (
    <View style={{ flex: 1 }}>
      <CardBg src={base.stall.bg} />
      <Stepper kinds={base.steps.map((x) => x[0])} cur={base.stepIndex} cx={L.cx} y={104} />
      <Ribbon x={L.cx - 330} y={176} w={660} h={64} text="What would you like to do?" color="pink" size={32} />
      <Pill at={[Math.min(L.cx + 350, L.right - 170), 184, 170, 52]}>
        <T size={21} font="baloo" fixed>{`Job ${n} of 20`}</T>
      </Pill>
      {options.map((opt, i) => {
        const on = sel === i;
        return (
          <Entry key={opt.key} i={i} at={[x0 + i * (cw + gap), 262, cw, 330]}>
            <Tap onPress={() => choose(i)} style={{ flex: 1 }} label={opt.text} lift={on ? -16 : 0} testID={`opt_${i}`}>
              {on ? <View style={[StyleSheet.absoluteFill, { margin: -9 * L.s, borderRadius: 34 * L.s, backgroundColor: c('yellow') }]} /> : null}
              <Panel fill={CREAM} radius={28} ow={3.6} lip={8} style={{ flex: 1 }}>
                <View style={{ flex: 1, alignItems: 'center', paddingTop: 16 * L.s, paddingHorizontal: 16 * L.s }}>
                  <View style={{ width: 170 * L.s, height: 170 * L.s, borderRadius: 85 * L.s, backgroundColor: '#FFE9C7', borderWidth: 3 * L.s, borderColor: INK, alignItems: 'center', justifyContent: 'center' }}>
                    <Img src={opt.image} style={{ width: 138 * L.s, height: 138 * L.s }} />
                  </View>
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <T size={29} font="baloo" align="center" lh={1.1}>{opt.text}</T>
                  </View>
                </View>
              </Panel>
              {on ? <View style={{ position: 'absolute', right: -10 * L.s, top: -10 * L.s }}><Check rel x={0} y={0} d={52} /></View> : null}
            </Tap>
          </Entry>
        );
      })}
      <View pointerEvents="none" style={L.box(L.cx - 500, 598, 1000, 30)}>
        <T size={21} font="nunito_x" color={WHITE} align="center">There are no wrong answers. Pick what you would enjoy most!</T>
      </View>
      <Btn at={[L.cx - 180, 630, 360, 80]} label="This one!" icon="check" size={32} disabled={sel === null} pulse={sel !== null && !stamp.stamping} onPress={confirm} testID="confirm" silent={sel !== null} />
      {sel !== null ? <Stamp v={stamp.v} x={x0 + sel * (cw + gap) + cw / 2} y={340} /> : null}
      <Hud />
    </View>
  );
}

// =============================================================================== Loved-it rating (RIASEC)
export function LovedIt({ id }: { id: string }) {
  const L = useL();
  const app = useApp();
  const s = app.session;
  const base = useCardBase();
  const opt = useMemo(() => {
    const w = s.riasec!.what.find((r) => r.id === id);
    const card = content.whatById[id];
    return card.options.find((o) => w && o.key === w.chosen_key) ?? card.options[0];
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [sel, setSel] = useState<number | null>(null);
  const pops = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;
  const stamp = useStamp(() => {
    s.recordLoved(id, (sel as number) + 1);
    app.afterStep(base.visitsBefore);
  });
  const choose = (i: number) => {
    if (stamp.stamping) return;
    setSel(i);
    app.sfx('sfx_heart_pop', 0.8);
    for (let k = 0; k <= i; k++) {
      pops[k].setValue(0);
      Animated.sequence([Animated.delay(k * 40), Animated.spring(pops[k], { toValue: 1, useNativeDriver: true, friction: 3, tension: 160 })]).start();
    }
  };
  const confirm = () => {
    if (sel === null || stamp.stamping) return;
    app.sfx('sfx_light_earned', 0.7);
    app.fx('confetti', L.cx, 320, 30); // identical for every rating
    stamp.go();
  };
  const cx = L.cx;
  const pw = 900;
  const x0 = cx - pw / 2;
  return (
    <View style={{ flex: 1 }}>
      <CardBg src={base.stall.bg} />
      <Stepper kinds={base.steps.map((x) => x[0])} cur={base.stepIndex} cx={cx} y={104} />
      <Entry i={0} at={[x0, 174, pw, 440]}>
        <Panel fill={CREAM} radius={30} ow={3.6} lip={9} style={{ flex: 1 }}>
          <View style={{ height: 168 * L.s, backgroundColor: '#FFE3A3', borderBottomWidth: 3.4 * L.s, borderColor: INK }} />
          <View style={{ alignItems: 'center', paddingTop: 10 * L.s }}>
            <T size={22} font="nunito_x" color={INK2}>{opt.done_text}</T>
            <T size={40} font="baloo" style={{ marginTop: 4 * L.s }}>How much did you love doing this?</T>
          </View>
        </Panel>
        <Char rel kind={avatarOf(app)} x={pw / 2 - 200} y={168} h={160} pose="think" expr="happy" />
        <View style={[{ position: 'absolute', left: (pw / 2 - 66) * L.s, top: 18 * L.s, width: 132 * L.s, height: 132 * L.s, borderRadius: 66 * L.s, backgroundColor: WHITE, borderWidth: 3 * L.s, borderColor: INK, alignItems: 'center', justifyContent: 'center' }]}>
          <Img src={opt.image} style={{ width: 100 * L.s, height: 100 * L.s }} />
        </View>
        <Char rel kind={base.buddy} x={pw / 2 + 200} y={168} h={base.buddy === 'hudhud' ? 100 : 145} expr="happy" phase={1} />
      </Entry>
      {[0, 1, 2, 3, 4].map((i) => {
        const filled = sel !== null && i <= sel;
        const sc = pops[i].interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.25, 1] });
        return (
          <Tap key={i} at={[cx - 330 + i * 132, 450, 120, 110]} onPress={() => choose(i)} sound={null} label={`${i + 1} of 5 hearts`} testID={`heart_${i + 1}`}>
            <Animated.View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', transform: [{ scale: sc }] }}>
              <Img src={filled ? 'ui/heart_full' : 'ui/heart_empty'} style={{ width: 104 * L.s, height: 104 * L.s }} />
            </Animated.View>
          </Tap>
        );
      })}
      <View pointerEvents="none" style={[L.box(cx - 360, 564, 720, 30), { flexDirection: 'row', justifyContent: 'space-between' }]}>
        <T size={21} font="baloo" color={INK2}>Not for me</T>
        <T size={21} font="baloo" color={c('pink')}>Loved it!</T>
      </View>
      <Btn at={[cx - 140, 630, 280, 80]} label="Done" icon="check" size={32} disabled={sel === null} pulse={sel !== null && !stamp.stamping} onPress={confirm} testID="confirm" />
      <Hud />
    </View>
  );
}

// =============================================================================== How card (Big Five, research only)
export function HowCard({ id }: { id: string }) {
  const L = useL();
  const app = useApp();
  const s = app.session;
  const base = useCardBase();
  const card = content.howById[id];
  const options = useMemo(() => s.optionOrder(id, 2).map((i) => card.options[i]), [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [sel, setSel] = useState<number | null>(null);
  const stamp = useStamp(() => {
    s.recordHow(id, options[0].pole, options[sel as number].pole);
    app.toast(pick(content.dialogues.reactions), 'purple', 1.2);
    app.afterStep(base.visitsBefore);
  });
  const confirm = () => {
    if (sel === null) return;
    app.sfx('sfx_confirm_stamp');
    stamp.go();
  };
  const choose = (i: number) => {
    if (stamp.stamping) return;
    if (sel === i) return confirm();
    setSel(i);
  };
  const cx = L.cx;
  const avail = L.right - L.left;
  const cw = Math.min(600, (avail - 40) / 2);
  const x0 = cx - cw - 16;
  const expr = card.domain === 'B-N' ? 'worried' : 'think';
  return (
    <View style={{ flex: 1 }}>
      <CardBg src={base.stall.bg} />
      <Stepper kinds={base.steps.map((x) => x[0])} cur={base.stepIndex} cx={cx} y={104} />
      <Portrait kind={base.buddy} expr={expr} x={x0 + 80} y={262} d={150} ring={NAME_COLOR[base.buddy]} />
      <View pointerEvents="none" style={L.box(x0 + 176, 190, cw * 2 + 32 - 176, 150)}>
        <Bubble rel at={[0, 0, cw * 2 + 32 - 176, 142]} name="Twist!" nameColor="purple">
          <T size={29}>{`${card.scenario} What would you do?`}</T>
        </Bubble>
      </View>
      {options.map((opt, i) => {
        const on = sel === i;
        return (
          <Entry key={opt.pole} i={i} from={i === 0 ? 'left' : 'right'} at={[x0 + i * (cw + 32), 368, cw, 210]}>
            <Tap onPress={() => choose(i)} style={{ flex: 1 }} label={opt.text} lift={on ? -14 : 0} testID={`opt_${i}`}>
              {on ? <View style={[StyleSheet.absoluteFill, { margin: -9 * L.s, borderRadius: 34 * L.s, backgroundColor: c('yellow') }]} /> : null}
              <Panel fill={CREAM} radius={28} ow={3.6} lip={8} style={{ flex: 1 }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22 * L.s }}>
                  <View style={{ width: 70 * L.s, height: 70 * L.s, borderRadius: 35 * L.s, backgroundColor: i === 0 ? c('teal') : c('purple'), borderWidth: 3 * L.s, borderColor: INK, alignItems: 'center', justifyContent: 'center', marginRight: 20 * L.s }}>
                    <T size={38} font="baloo" color={WHITE} fixed>{i === 0 ? 'A' : 'B'}</T>
                  </View>
                  <View style={{ flex: 1 }}>
                    <T size={31} font="baloo" lh={1.12}>{opt.text}</T>
                  </View>
                </View>
              </Panel>
              {on ? <View style={{ position: 'absolute', right: -10 * L.s, top: -10 * L.s }}><Check rel x={0} y={0} d={52} /></View> : null}
            </Tap>
          </Entry>
        );
      })}
      <View pointerEvents="none" style={L.box(cx - 400, 596, 800, 30)}>
        <T size={22} font="nunito_x" color={WHITE} align="center">Choose the one that sounds most like you.</T>
      </View>
      <Btn at={[cx - 160, 630, 320, 80]} label="Confirm" icon="check" size={32} disabled={sel === null} pulse={sel !== null && !stamp.stamping} onPress={confirm} testID="confirm" silent={sel !== null} />
      {sel !== null ? <Stamp v={stamp.v} x={x0 + sel * (cw + 32) + cw / 2} y={470} /> : null}
      <Hud />
    </View>
  );
}

// =============================================================================== Hudhud's diary (research self-report, unscored)
export function Diary() {
  const L = useL();
  const app = useApp();
  const s = app.session;
  useMusic('mus_diary_night');
  useBack(() => app.push({ name: 'pause' }));
  const item = s.diaryItem();
  const scale = content.diary.scale;
  const itemsToday = content.diaryForDay(s.day);
  const k = s.progress.diary_index;
  const [sel, setSel] = useState<number | null>(null);
  const [turning, setTurning] = useState(false);
  const flip = useRef(new Animated.Value(0)).current;
  const motion = useMotion();
  useOnce(() => app.sfx('sfx_book_open', 0.6));
  if (!item) return null;
  const confirm = () => {
    if (sel === null || turning) return;
    setTurning(true);
    app.sfx('sfx_page_turn');
    app.haptic('success');
    Animated.timing(flip, { toValue: 1, duration: motion ? 380 : 60, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
      s.recordDiary(item.id, (sel as number) + 1);
      app.route();
    });
  };
  const cx = L.cx;
  const bw = Math.min(1160, L.right - L.left);
  const x0 = cx - bw / 2;
  const pw = (bw - 60) / 2;
  const names = s.progress.stalls_today.map((x) => content.stallById[x].short).join(', ');
  return (
    <View style={{ flex: 1 }}>
      <Bg src="backgrounds/bg_mela_night" tint="rgba(27,23,51,0.25)" />
      <Panel at={[x0, 100, bw, 520]} fill="#4D2A86" radius={30} ow={4.5} lip={10} lipColor="rgba(0,0,0,0.45)" />
      <Panel at={[x0 + 20, 116, pw, 488]} fill="#FFF8E8" radius={18} ow={3}>
        <View style={{ flex: 1, padding: 30 * L.s }}>
          <T size={46} font="baloo" color={c('purple')} fixed>{`Day ${s.day}`}</T>
          <T size={32} font="baloo">Hudhud's Diary</T>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Img src="ui/icon_lock" style={{ width: 20 * L.s, height: 20 * L.s, marginRight: 6 * L.s }} />
            <T size={19} font="nunito_x" color={INK2}>Just between us</T>
          </View>
          <View style={{ flexDirection: 'row', marginTop: 16 * L.s }}>
            {s.progress.stalls_today.slice(0, 3).map((sid) => (
              <View key={sid} style={{ alignItems: 'center', marginRight: 26 * L.s, width: 110 * L.s }}>
                <View style={{ width: 92 * L.s, height: 92 * L.s, borderRadius: 46 * L.s, backgroundColor: WHITE, borderWidth: 2.6 * L.s, borderColor: INK, alignItems: 'center', justifyContent: 'center' }}>
                  <Img src={content.stallById[sid].icon} style={{ width: 58 * L.s, height: 58 * L.s }} />
                </View>
                <T size={17} font="nunito_x" color={INK2} align="center" fixed>{content.stallById[sid].short}</T>
              </View>
            ))}
          </View>
          <T size={23} font="nunito_s" style={{ marginTop: 14 * L.s }}>{`Today you helped at ${names}. Now, a quick question just for you…`}</T>
          {!s.consent ? <T size={18} font="nunito_x" color={INK2} style={{ marginTop: 8 * L.s }}>Research notes are off, so this page isn't saved.</T> : null}
        </View>
      </Panel>
      <Animated.View style={[L.box(x0 + 40 + pw, 116, pw, 488), { transform: [{ perspective: 1200 * L.s }, { translateX: (-pw / 2) * L.s }, { rotateY: flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-88deg'] }) }, { translateX: (pw / 2) * L.s }] }]}>
        <Panel fill="#FFF8E8" radius={18} ow={3} style={{ flex: 1 }}>
          <View style={{ flex: 1, padding: 28 * L.s }}>
            <View style={{ alignSelf: 'flex-start' }}>
              <Pill style={{ height: 46 * L.s }}>
                <T size={19} font="baloo" fixed>{`Question ${k + 1} of ${itemsToday.length}`}</T>
              </Pill>
            </View>
            <T size={36} font="baloo" lh={1.15} style={{ marginTop: 14 * L.s }}>{item.text}</T>
            <View style={{ flex: 1 }} />
            <T size={25} font="baloo" color={INK2}>{content.diary.prompt}</T>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 * L.s }}>
              {scale.map((lab, i) => {
                const on = sel === i;
                const d = 58 + i * 5;
                return (
                  <Tap key={lab} testID={`scale_${i + 1}`} onPress={() => !turning && setSel(i)} sound="sfx_ui_toggle" label={lab} style={{ width: (pw - 56) / 5 * L.s, alignItems: 'center' }}>
                    <View style={{ alignItems: 'center' }}>
                      <View style={{ width: (d + 14) * L.s, height: (d + 14) * L.s, borderRadius: (d + 14) * L.s, backgroundColor: on ? c('yellow') : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                        <View style={{ width: d * L.s, height: d * L.s, borderRadius: d * L.s, backgroundColor: on ? c('purple') : WHITE, borderWidth: 3 * L.s, borderColor: INK }} />
                      </View>
                      <T size={17} font="nunito_x" align="center" fixed lh={1.1}>{lab}</T>
                    </View>
                  </Tap>
                );
              })}
            </View>
          </View>
        </Panel>
      </Animated.View>
      <Char kind="hudhud" x={x0 + 80} y={714} h={96} flip expr="talk" />
      <Btn at={[x0 + bw - 330, 632, 320, 80]} label="Write it down" icon="check" color="purple" size={30} disabled={sel === null} pulse={sel !== null && !turning} onPress={confirm} testID="confirm" />
      <Hud showDiary={false} />
    </View>
  );
}

// =============================================================================== daily summary
export function Summary() {
  const L = useL();
  const app = useApp();
  const s = app.session;
  useMusic('mus_menu_theme');
  useBack(() => app.push({ name: 'pause' }));
  const day = s.day;
  const entries = s.profile!.board.filter((e) => e.day === day);
  const buddy = content.buddy(day);
  useOnce(() => {
    app.sfx('sfx_day_complete', 0.8);
    app.fx('confetti', L.cx, 140, 50);
  });
  const lights = s.profile!.lights;
  const bar = useAppear(300, 0);
  const next = () => {
    s.summaryDone();
    app.route();
  };
  const names = entries.map((e) => content.stallById[e.stall].short).join(', ');
  const closing = content.dialogues.diary_closing.split('{name}').join(s.name);
  const cx = L.cx;
  const bw = Math.min(1180, L.right - L.left);
  const x0 = cx - bw / 2;
  const jobs = s.riasec!.what.filter((w) => w.day === day).length;
  const nb = day < 5 ? content.buddy(day + 1) : 'karim';
  return (
    <View style={{ flex: 1 }}>
      <Bg src="backgrounds/bg_menu_dusk" blur={8} />
      <Panel at={[x0, 64, bw, 640]} radius={30} lip={10} />
      <Ribbon x={cx - 230} y={32} w={460} h={76} text={`Day ${day} complete!`} color="yellow" size={42} />
      <View style={L.box(x0 + 40, 122, bw - 80, 64)}>
        <T size={24} align="center">{`You helped at ${names} with ${NAMES[buddy]}. ${closing}`}</T>
      </View>
      {[['Stalls visited', String(entries.length), 'teal', 'map'], ['Jobs done', String(jobs), 'orange', 'check']].map(([lab, val, col, ic], i) => (
        <Panel key={lab} at={[x0 + 40 + i * 214, 196, 196, 156]} fill={WHITE} radius={24} ow={3}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 60 * L.s, height: 60 * L.s, borderRadius: 30 * L.s, backgroundColor: c(col), borderWidth: 3 * L.s, borderColor: INK, alignItems: 'center', justifyContent: 'center' }}>
              <Img src={`ui/icon_${ic}_white`} style={{ width: 34 * L.s, height: 34 * L.s }} />
            </View>
            <T size={40} font="baloo" fixed>{val}</T>
            <T size={18} font="nunito_x" color={INK2} fixed>{lab}</T>
          </View>
        </Panel>
      ))}
      <Panel at={[x0 + 480, 196, bw - 520, 156]} fill={WHITE} radius={24} ow={3}>
        <View style={{ flex: 1, paddingHorizontal: 26 * L.s, justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Img src="ui/diya" style={{ width: 64 * L.s, height: 64 * L.s }} />
            <T size={40} font="baloo" style={{ marginLeft: 12 * L.s }} fixed>+20 lights</T>
          </View>
          <View style={{ height: 30 * L.s, borderRadius: 15 * L.s, borderWidth: 2.6 * L.s, borderColor: INK, backgroundColor: LILAC, overflow: 'hidden', marginTop: 8 * L.s }}>
            <Animated.View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%', backgroundColor: c('yellow'), transform: [{ translateX: bar.interpolate({ inputRange: [0, 1], outputRange: [-(bw - 580) * L.s, -(bw - 580) * (1 - lights / 100) * L.s] }) }] }} />
          </View>
          <T size={19} font="nunito_x" align="center" style={{ marginTop: 4 * L.s }}>{`${lights} / 100 mela lights lit`}</T>
        </View>
      </Panel>
      {entries.slice(0, 3).map((e, i) => (
        <Polaroid key={i} x={x0 + 50 + i * 150} y={378 + (i % 2) * 12} w={136} entry={e} avatar={avatarOf(app)} rotate={i % 2 ? 3 : -3} />
      ))}
      <Panel at={[x0 + 520, 372, bw - 560, 210]} fill="#FFF3DA" radius={24} ow={3}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22 * L.s }}>
          <View style={{ width: 130 * L.s }} />
          <View style={{ flex: 1, marginLeft: 16 * L.s }}>
            <T size={19} font="nunito_x" color={INK2}>{day < 5 ? `TOMORROW · DAY ${day + 1}` : 'TONIGHT'}</T>
            <T size={32} font="baloo" lh={1.1}>{day < 5 ? content.dialogues.days[String(day)].teaser : 'The closing ceremony and your Mela Code!'}</T>
          </View>
        </View>
      </Panel>
      <Portrait kind={nb} expr="happy" x={x0 + 610} y={477} d={124} ring={NAME_COLOR[nb]} />
      <Btn at={[x0 + bw - 600, 600, 250, 84]} label="Mela Board" icon="board" color="teal" size={28} onPress={() => app.push({ name: 'board' })} />
      <Btn at={[x0 + bw - 330, 600, 300, 84]} label={day < 5 ? 'Next Day' : 'Closing ceremony'} icon="next" size={day < 5 ? 32 : 26} pulse onPress={next} testID="next" />
    </View>
  );
}


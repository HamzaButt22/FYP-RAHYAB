/**
 * Final reveal, RIASEC results and ending. Uses ONLY the RIASEC scoring module: Big Five research data is never
 * read or shown here (ASSESSMENT_DESIGN.md section 1).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useApp } from '../app/AppContext';
import { useBack, useMusic, useOnce } from '../app/hooks';
import { content, RiasecType } from '../logic/content';
import { scoreRiasec } from '../logic/riasec';
import { useL } from '../ui/layout';
import { Bg, Btn, Bubble, Char, Img, Medallion, Panel, Pill, Portrait, Ribbon, T, useAppear, useMotion } from '../ui/kit';
import { c, CREAM, dark, INK, INK2, LILAC, WHITE } from '../ui/theme';
import { avatarOf } from './Story';

function useReport() {
  const { session } = useApp();
  return useMemo(() => scoreRiasec(session.riasec, content.what, content.stalls, content.assessment.riasec), [session.riasec]);
}

const groupName = (g: string[]) => g.map((t) => content.careers[t as RiasecType].name).join(' / ');

// =============================================================================== reveal
const INTRO = 3.4;
const STEP = 0.9;

export function Reveal() {
  const L = useL();
  const app = useApp();
  const rep = useReport();
  useMusic('mus_mela_day5');
  const lines = useMemo(() => app.lines(content.dialogues.reveal_intro), []); // eslint-disable-line react-hooks/exhaustive-deps
  const motion = useMotion();
  const [t, setT] = useState(0);
  const t0 = useRef(Date.now());
  const skipped = useRef(0);
  const meds = rep.medallions.slice(0, 3);
  const endT = INTRO + meds.length * STEP + 0.4;
  useEffect(() => {
    const id = setInterval(() => setT((Date.now() - t0.current) / 1000 + skipped.current), 100);
    return () => clearInterval(id);
  }, []);
  const played = useRef(new Set<number>());
  const cheer = useRef(false);
  const st = t - INTRO;
  useEffect(() => {
    meds.forEach((_, i) => {
      if (st > i * STEP && !played.current.has(i)) {
        played.current.add(i);
        app.sfx('sfx_medallion_reveal', 0.7);
        app.haptic('success');
      }
    });
    if (t > endT && !cheer.current) {
      cheer.current = true;
      app.sfx('sfx_cheer', 0.6);
    }
  }, [t]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!motion) return;
    const id = setInterval(() => {
      app.fx('firework', L.left + 100 + Math.random() * (L.right - L.left - 200), 80 + Math.random() * 220);
      app.sfx('sfx_firework_pop', 0.3);
    }, 750);
    return () => clearInterval(id);
  }, [motion]); // eslint-disable-line react-hooks/exhaustive-deps
  const finish = () => {
    app.session.finaleDone();
    app.replace({ name: 'results', first: true });
  };
  const skip = () => {
    if (t < endT) skipped.current += endT - t + 0.1;
  };
  useBack(() => {
    if (t < endT) skip();
  });
  const cx = L.cx;
  const xs = [cx, cx - 260, cx + 260];
  const done = t > endT;
  return (
    <View style={{ flex: 1 }}>
      <Bg src="backgrounds/bg_mela_night" />
      <Pressable style={StyleSheet.absoluteFill} onPress={skip} accessibilityLabel="Skip ahead" />
      <View pointerEvents="none" style={[L.box(cx - 300, 40, 600, 600), { borderRadius: 300 * L.s, backgroundColor: 'rgba(255,240,180,0.13)' }]} />
      <View pointerEvents="none" style={[L.box(cx - 190, 150, 380, 380), { borderRadius: 190 * L.s, backgroundColor: 'rgba(255,240,180,0.16)' }]} />
      <Ribbon x={cx - 260} y={20} w={520} h={74} text="Your Mela Code!" color="pink" size={42} />
      <Char kind="hudhud" x={cx} y={250} h={150} pose="fly" expr="happy" />
      {st < 0 ? (
        <View pointerEvents="none" style={L.box(cx - 330, 280, 660, 200)}>
          <Bubble rel at={[0, 0, 660, 120]} name="Hudhud" nameColor="yellow">
            <T size={27}>{lines[t < 1.7 ? 0 : 1].text}</T>
          </Bubble>
          {t > 2.4 ? (
            <View style={{ position: 'absolute', left: 150 * L.s, top: 150 * L.s }}>
              <Pill style={{ height: 52 * L.s, width: 360 * L.s }}>
                <T size={22} font="baloo" fixed>{`Hudhud is reading the diary${'.'.repeat(1 + (Math.floor(t * 3) % 3))}`}</T>
              </Pill>
            </View>
          ) : null}
        </View>
      ) : null}
      {!meds.length && st >= 0 ? (
        <View pointerEvents="none" style={L.box(cx - 330, 300, 660, 130)}>
          <Bubble rel at={[0, 0, 660, 120]}><T size={26}>Your diary has no job choices yet, so there is no code to show.</T></Bubble>
        </View>
      ) : null}
      {meds.map((g, i) => (st > i * STEP ? <RevealMedal key={i} x={xs[i]} y={i === 0 ? 390 : 410} d={i === 0 ? 200 : 168} group={g} /> : null))}
      {done ? (
        <>
          {['zain', 'hira', 'bilal', 'sara'].map((k, n) => (
            <Char key={k} kind={k} x={n < 2 ? L.left + 70 + n * 150 : L.right - 70 - (3 - n) * 150} y={735} h={230} pose={n % 3 === 0 ? 'wave' : 'idle'} expr="happy" phase={n} flip={n >= 2} />
          ))}
          <Btn at={[cx - 210, 626, 420, 84]} label="See what it means" icon="next" color="yellow" size={32} pulse onPress={finish} testID="go" />
        </>
      ) : null}
    </View>
  );
}

function RevealMedal({ x, y, d, group }: { x: number; y: number; d: number; group: string[] }) {
  const L = useL();
  const a = useAppear(0, 0.05);
  const label = useAppear(380, 0);
  return (
    <>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { transform: [{ translateX: x * L.s }, { translateY: y * L.s }, { scale: a }, { translateX: -x * L.s }, { translateY: -y * L.s }] }]}>
        <Medallion x={x} y={y} d={d} group={group} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[L.box(x - 125, y + d / 2 + 18, 250, 56), { opacity: label }]}>
        <Pill style={{ flex: 1 }}><T size={25} font="baloo" lines={1} fixed>{groupName(group)}</T></Pill>
      </Animated.View>
    </>
  );
}

// =============================================================================== results
export function Results({ first }: { first?: boolean }) {
  const L = useL();
  const app = useApp();
  const s = app.session;
  const rep = useReport();
  useMusic('mus_results');
  const isFirst = useMemo(() => !!first || s.phase === 'results', []); // eslint-disable-line react-hooks/exhaustive-deps
  const finish = () => {
    s.resultsSeen();
    if (isFirst) app.replace({ name: 'ending' });
    else app.toMenu();
  };
  useBack(finish);
  const meds = rep.medallions;
  const types = content.careers;
  const names = meds.length ? meds.map(groupName).join(' · ') : 'Not enough answers yet';
  let sent = 'Play through the mela days to discover your code.';
  if (meds.length) {
    const parts = meds.slice(0, 3).map((g) => types[g[0] as RiasecType].summary);
    sent = 'You lit up most when you were ' + (parts.length > 1 ? parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1] : parts[0]) + '.';
  }
  const bars = useAppear(250, 0);
  const avail = L.right - L.left;
  const w1 = Math.min(400, avail * 0.28);
  const w2 = Math.min(470, avail * 0.33);
  const w3 = avail - w1 - w2 - 40;
  const x1 = L.left;
  const x2 = x1 + w1 + 20;
  const x3 = x2 + w2 + 20;
  const careerTypes: string[] = [];
  for (const g of meds.slice(0, 3)) for (const t of g.slice(0, 2)) if (!careerTypes.includes(t)) careerTypes.push(t);
  return (
    <View style={{ flex: 1, backgroundColor: '#FCEFD8' }}>
      <Ribbon x={L.cx - 290} y={12} w={580} h={68} text="Your interests at the mela" color="teal" size={34} />
      {/* card 1: the code */}
      <Panel at={[x1, 100, w1, 500]} radius={26} lip={7}>
        <View style={{ flex: 1, padding: 22 * L.s }}>
          <T size={30} font="baloo">Your Mela Code</T>
          <View style={{ height: 150 * L.s }} />
          <T size={27} font="baloo" color={c('purple')} lh={1.1} fixed>{names}</T>
          <T size={22} style={{ marginTop: 10 * L.s }}>{sent}</T>
        </View>
      </Panel>
      {meds.slice(0, 3).map((g, i) => <Medallion key={i} x={x1 + 70 + i * ((w1 - 40) / 3)} y={240} d={Math.min(96, (w1 - 90) / 3)} group={g} />)}
      <Portrait kind="hudhud" expr="happy" x={x1 + w1 - 56} y={548} d={84} />
      {/* card 2: all six */}
      <Panel at={[x2, 100, w2, 500]} radius={26} lip={7}>
        <View style={{ flex: 1, padding: 22 * L.s }}>
          <T size={30} font="baloo">All six interest areas</T>
          <T size={18} font="nunito_x" color={INK2}>Based only on your choices in this game.</T>
          {rep.order.map((t, i) => {
            const info = types[t];
            const v = rep.bars[t];
            const bw = w2 * 0.42;
            return (
              <View key={t} style={{ flexDirection: 'row', alignItems: 'center', height: 64 * L.s }}>
                <View style={{ width: 48 * L.s, height: 48 * L.s, borderRadius: 24 * L.s, backgroundColor: c(info.colour), borderWidth: 2.5 * L.s, borderColor: INK, alignItems: 'center', justifyContent: 'center' }}>
                  <Img src={info.icon} style={{ width: 30 * L.s, height: 30 * L.s }} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 * L.s }}>
                  <T size={24} font="baloo" fixed lh={1}>{info.name}</T>
                  <T size={16} font="nunito_x" color={INK2} fixed>{info.term}</T>
                </View>
                <View style={{ width: bw * L.s, height: 28 * L.s, borderRadius: 14 * L.s, borderWidth: 2.5 * L.s, borderColor: INK, backgroundColor: LILAC, overflow: 'hidden' }}>
                  <Animated.View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%', backgroundColor: c(info.colour), transform: [{ translateX: bars.interpolate({ inputRange: [0, 1], outputRange: [-bw * L.s, -bw * (1 - v) * L.s] }) }] }} />
                </View>
              </View>
            );
          })}
        </View>
      </Panel>
      {/* card 3: careers to explore */}
      <Panel at={[x3, 100, w3, 500]} radius={26} lip={7}>
        <View style={{ flex: 1, padding: 22 * L.s }}>
          <T size={30} font="baloo">Careers to explore</T>
          <T size={18} font="nunito_x" color={INK2}>Ideas to look into, not a list to pick from.</T>
          {careerTypes.slice(0, 3).map((t) => {
            const info = types[t as RiasecType];
            return (
              <View key={t} style={{ marginTop: 10 * L.s }}>
                <T size={24} font="baloo" color={dark(info.colour)}>{`${info.name}s`}</T>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {info.careers.slice(0, 4).map((cr) => (
                    <View key={cr} style={{ paddingHorizontal: 12 * L.s, paddingVertical: 3 * L.s, borderRadius: 16 * L.s, borderWidth: 2.4 * L.s, borderColor: INK, backgroundColor: WHITE, marginRight: 8 * L.s, marginBottom: 7 * L.s }}>
                      <T size={18} font="nunito_x" fixed>{cr}</T>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      </Panel>
      <View style={[L.box(x1, 620, Math.max(300, L.right - x1 - 830), 90), { flexDirection: 'row', alignItems: 'center' }]}>
        <Img src="ui/icon_info" style={{ width: 34 * L.s, height: 34 * L.s, marginRight: 10 * L.s }} />
        <T size={17} font="nunito_s" style={{ flex: 1 }}>This shows what you enjoyed in this game, not what you are good at. Interests grow and change. Talk to your teacher or counsellor about it.</T>
      </View>
      <Btn at={[L.right - 810, 622, 300, 84]} label="What does it mean?" icon="info" color="teal" size={24} onPress={() => app.push({ name: 'explain', rep })} />
      <Btn at={[L.right - 494, 622, 240, 84]} label="Mela Board" icon="board" color="cream" size={24} onPress={() => app.push({ name: 'board' })} />
      <Btn at={[L.right - 238, 622, 238, 84]} label="Finish" icon="check" size={30} pulse onPress={finish} testID="finish" />
    </View>
  );
}

// =============================================================================== ending
export function Ending() {
  const L = useL();
  const app = useApp();
  const motion = useMotion();
  useMusic('mus_menu_theme');
  useOnce(() => app.sfx('sfx_cheer', 0.6));
  useEffect(() => {
    if (!motion) return;
    const id = setInterval(() => app.fx('firework', L.left + 150 + Math.random() * (L.right - L.left - 300), 80 + Math.random() * 160), 700);
    return () => clearInterval(id);
  }, [motion]); // eslint-disable-line react-hooks/exhaustive-deps
  useBack(() => app.toMenu());
  const fly = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!motion) return;
    Animated.timing(fly, { toValue: 1, duration: 7000, useNativeDriver: true }).start();
  }, [fly, motion]);
  const name = app.session.active ? app.session.name : 'Volunteer';
  const cx = L.cx;
  const cast = ['zain', 'hira', 'karim', avatarOf(app), 'bilal', 'sara'];
  const span = Math.min(1300, L.right - L.left - 100);
  return (
    <View style={{ flex: 1 }}>
      <Bg src="backgrounds/bg_mela_night" />
      <Panel at={[cx - 440, 50, 880, 210]} radius={30} lip={9}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 * L.s }}>
          <T size={38} font="baloo" align="center" fixed>{content.dialogues.ending.split('{name}').join(name)}</T>
          <T size={23} font="nunito_s" color={INK2} align="center">All 100 mela lights are glowing. Thank you for helping Gulshan Model School's Apna Mela shine!</T>
        </View>
      </Panel>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { transform: [{ translateX: fly.interpolate({ inputRange: [0, 1], outputRange: [0, (L.W / 2 + 200) * L.s] }) }, { translateY: fly.interpolate({ inputRange: [0, 1], outputRange: [0, -60 * L.s] }) }] }]}>
        <Char kind="hudhud" x={cx} y={340} h={92} pose="fly" expr="happy" />
      </Animated.View>
      {cast.map((k, i) => (
        <Char key={i} kind={k} x={cx - span / 2 + (i + 0.5) * (span / 6)} y={612} h={k === 'karim' ? 320 : 290} pose="wave" expr="happy" phase={i} flip={i >= 3} />
      ))}
      <Btn at={[cx - 160, 626, 320, 84]} label="Main Menu" icon="home" size={32} pulse onPress={() => app.toMenu()} testID="menu" />
    </View>
  );
}



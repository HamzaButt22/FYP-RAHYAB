/** Opening story, day intro title card and the shared dialogue screen. */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useApp } from '../app/AppContext';
import { useBack, useMusic, useOnce } from '../app/hooks';
import { content, Line } from '../logic/content';
import { useL } from '../ui/layout';
import { Bg, Btn, Bubble, Char, IconBtn, Img, Panel, Pill, Portrait, T, useAppear, useLoop, useMotion, useTypewriter } from '../ui/kit';
import { c, CREAM, INK, INK2, LILAC, NAME_COLOR, NAMES, WHITE } from '../ui/theme';

const avatarOf = (app: ReturnType<typeof useApp>) => (app.session.active ? `av${app.session.profile!.avatar}` : 'av1');

// =============================================================================== opening story
export function Story() {
  const L = useL();
  const app = useApp();
  useMusic('mus_menu_theme');
  const beats = content.dialogues.story;
  const [i, setI] = useState(0);
  const [skipType, setSkipType] = useState(false);
  const { shown, done } = useTypewriter(beats[i].caption, skipType);
  const finish = () => {
    app.session.storyDone();
    app.route();
  };
  const advance = () => {
    if (!done) return setSkipType(true);
    if (i < beats.length - 1) {
      setI(i + 1);
      setSkipType(false);
      app.sfx('sfx_page_turn', 0.5);
    } else finish();
  };
  useBack(() => app.push({ name: 'pause' }));
  const cx = L.cx;
  const pw = 340;
  const ph = pw * (900 / 840);
  return (
    <View style={{ flex: 1, backgroundColor: '#2C2260' }}>
      <Pressable style={StyleSheet.absoluteFill} onPress={advance} accessibilityLabel="Continue the story" />
      <StarField />
      {i < 3 ? (
        [0, 1, 2].slice(0, i + 1).map((j) => <StoryPanel key={j} j={j} x={cx - (pw * 3 + 40) / 2 + j * (pw + 20)} y={34} w={pw} h={ph} isNew={j === i} panel={beats[j].panel} avatar={avatarOf(app)} />)
      ) : (
        <BigPanel cx={cx} panel={beats[3].panel} />
      )}
      <View pointerEvents="none" style={L.box(cx - 600, 432, 1200, 200)}>
        <Panel fill={CREAM} radius={28} lip={8} lipColor="rgba(0,0,0,0.35)" style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'center', paddingLeft: 36 * L.s, paddingRight: 230 * L.s }}>
            <T size={30}>{shown}</T>
          </View>
        </Panel>
      </View>
      <Btn at={[cx + 380, 486, 190, 90]} label={i < beats.length - 1 ? 'Next' : "Let's go"} icon="next" color="yellow" size={30} onPress={advance} pulse={done} />
      <Btn at={[L.right - 150, 18, 150, 70]} label="Skip" color="cream" size={24} onPress={finish} testID="skip" />
      <View pointerEvents="none" style={[L.box(cx - 120, 662, 240, 24), { flexDirection: 'row', justifyContent: 'center' }]}>
        {beats.map((_, k) => (
          <View key={k} style={{ width: (k === i ? 40 : 18) * L.s, height: 18 * L.s, borderRadius: 9 * L.s, marginHorizontal: 5 * L.s, borderWidth: 2.4 * L.s, borderColor: INK, backgroundColor: k <= i ? c('pink') : WHITE }} />
        ))}
      </View>
    </View>
  );
}

function StoryPanel({ j, x, y, w, h, isNew, panel, avatar }: { j: number; x: number; y: number; w: number; h: number; isNew: boolean; panel: string; avatar: string }) {
  const L = useL();
  const a = useAppear(0, 0);
  const motion = useMotion();
  const tx = a.interpolate({ inputRange: [0, 1], outputRange: [isNew && motion ? 140 * L.s : 0, 0] });
  return (
    <Animated.View pointerEvents="none" style={[L.box(x, y, w, h), { opacity: isNew ? a : 1, transform: [{ translateX: tx }] }]}>
      <View style={{ flex: 1, borderRadius: 14 * L.s, borderWidth: 5 * L.s, borderColor: INK, overflow: 'hidden', backgroundColor: INK }}>
        <Img src={panel} style={{ width: '100%', height: '100%' }} fit="cover" />
      </View>
      {j === 2 ? <Char rel kind={avatar} x={w * 0.3} y={h - 6} h={200} expr="wow" /> : null}
      <View style={{ position: 'absolute', left: 12 * L.s, top: 12 * L.s, width: 44 * L.s, height: 44 * L.s, borderRadius: 22 * L.s, backgroundColor: c('yellow'), borderWidth: 3 * L.s, borderColor: INK, alignItems: 'center', justifyContent: 'center' }}>
        <T size={24} font="baloo" fixed>{String(j + 1)}</T>
      </View>
    </Animated.View>
  );
}

function BigPanel({ cx, panel }: { cx: number; panel: string }) {
  const L = useL();
  const a = useAppear(0, 0);
  return (
    <Animated.View pointerEvents="none" style={[L.box(cx - 420, 30, 840, 420), { opacity: a, borderRadius: 16 * L.s, borderWidth: 5 * L.s, borderColor: INK, overflow: 'hidden' }]}>
      <Img src={panel} style={{ width: '100%', height: '100%' }} fit="cover" />
    </Animated.View>
  );
}

function StarField() {
  const L = useL();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: 46 }, (_, k) => (
        <View key={k} style={{ position: 'absolute', left: ((k * 233) % Math.round(L.W)) * L.s, top: ((k * 97) % 700) * L.s, width: (3 + (k % 3)) * L.s, height: (3 + (k % 3)) * L.s, borderRadius: 4 * L.s, backgroundColor: 'rgba(255,246,230,0.6)' }} />
      ))}
    </View>
  );
}

// =============================================================================== day intro
export function DayIntro() {
  const L = useL();
  const app = useApp();
  const s = app.session;
  const day = s.day;
  const info = content.dialogues.days[String(day)];
  const music = day === 5 ? 'mus_mela_day5' : 'mus_day_prep';
  useMusic(music);
  const doneRef = useRef(false);
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    app.replace({
      name: 'dialogue', lines: app.lines(info.morning), bg: info.scene, music, gameplay: true,
      onDone: () => {
        app.session.morningDone();
        app.route();
      },
    });
  };
  useOnce(() => app.sfx('sfx_dhol_hit'));
  useEffect(() => {
    const t = setTimeout(finish, 4500);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useBack(() => app.push({ name: 'pause' }));
  const a = useAppear(80, 0.2);
  const cx = L.cx;
  return (
    <Pressable style={{ flex: 1 }} onPress={finish}>
      <Bg src={day < 5 ? 'backgrounds/bg_school_day' : 'backgrounds/bg_menu_dusk'} blur={5} tint="rgba(27,23,51,0.25)" />
      <Animated.View style={[L.box(cx - 330, 100, 660, 136), { transform: [{ scaleX: a }] }]}>
        <Panel fill={c('pink')} radius={28} ow={4} lip={8} lipColor="#B81F51" style={{ flex: 1 }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <T size={84} font="baloo" color={WHITE} shadow fixed lh={1.05}>{`DAY ${day}`}</T>
          </View>
        </Panel>
      </Animated.View>
      <View style={L.box(cx - 500, 256, 1000, 70)}>
        <T size={50} font="baloo" color={WHITE} shadow align="center" fixed>{info.title}</T>
      </View>
      <Portrait kind={info.buddy} expr="happy" x={cx} y={418} d={160} ring={NAME_COLOR[info.buddy]} />
      <Pill at={[cx - 170, 510, 340, 56]}>
        <T size={26} font="baloo" fixed>{`Today with ${NAMES[info.buddy]}`}</T>
      </Pill>
      <View style={[L.box(cx - 120, 582, 240, 30), { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}>
        {[1, 2, 3, 4, 5].map((k) => (
          <View key={k} style={{ width: (k === day ? 28 : 20) * L.s, height: (k === day ? 28 : 20) * L.s, borderRadius: 14 * L.s, marginHorizontal: 8 * L.s, borderWidth: 2.6 * L.s, borderColor: INK, backgroundColor: k < day ? c('yellow') : k === day ? WHITE : LILAC }} />
        ))}
      </View>
      <Btn at={[cx - 120, 622, 240, 84]} label="Let's go!" icon="next" size={30} onPress={finish} pulse testID="day_go" />
    </Pressable>
  );
}

// =============================================================================== dialogue
export function Dialogue({ lines, bg, onDone, music, crowd, gameplay = true }: { lines: Line[]; bg: string; onDone: () => void; music?: string; crowd?: boolean; gameplay?: boolean }) {
  const L = useL();
  const app = useApp();
  useMusic(music);
  const [i, setI] = useState(0);
  const [skipType, setSkipType] = useState(false);
  const [log, setLog] = useState(false);
  const finished = useRef(false);
  const line = lines[i];
  const { shown, done } = useTypewriter(line.text, skipType);
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onDone();
  };
  const advance = () => {
    if (log) return setLog(false);
    if (!done) return setSkipType(true);
    if (i < lines.length - 1) {
      const ni = i + 1;
      setI(ni);
      setSkipType(false);
      if (lines[ni].speaker === 'hudhud') app.sfx(`sfx_hudhud_chirp_0${1 + (ni % 3)}`, 0.5);
    } else finish();
  };
  useBack(() => {
    if (log) setLog(false);
    else if (gameplay) app.push({ name: 'pause' });
  });
  const sp = line.speaker;
  const expr = line.expr ?? 'smile';
  const arrow = useLoop(900, done);
  const cx = L.cx;
  return (
    <View style={{ flex: 1 }}>
      <Bg src={bg} blur={4} />
      <Pressable style={StyleSheet.absoluteFill} onPress={advance} accessibilityLabel="Next line" />
      {crowd ? ['zain', 'hira', 'bilal', 'sara'].filter((k) => k !== sp).map((k, n) => (
        <Char key={k} kind={k} x={cx - 80 + n * 130} y={520} h={240} pose={n % 2 ? 'wave' : 'idle'} expr="happy" phase={n} />
      )) : null}
      {sp === 'hudhud' ? (
        <Char key={`h${i}`} kind="hudhud" x={cx - 380} y={480} h={240} expr={expr} />
      ) : (
        <Char key={`c${sp}${i}`} kind={sp} x={cx - 390} y={650} h={sp === 'karim' ? 500 : 470} pose={line.pose ?? 'idle'} expr={!done && expr === 'talk' ? 'talk' : expr} />
      )}
      <Char kind={avatarOf(app)} x={cx + 420} y={620} h={400} flip phase={2} opacity={0.92} />
      <View pointerEvents="none" style={L.box(cx - 580, 470, 1160, 214)}>
        <Bubble rel at={[0, 0, 1160, 200]} name={NAMES[sp] ?? sp} nameColor={NAME_COLOR[sp] ?? 'pink'}>
          <T size={32} lh={1.35}>{shown}</T>
        </Bubble>
        {done ? (
          <Animated.View style={[{ position: 'absolute', right: 34 * L.s, bottom: 26 * L.s, transform: [{ translateY: arrow.interpolate({ inputRange: [0, 1], outputRange: [0, 6 * L.s] }) }] }]}>
            <View style={{ width: 0, height: 0, borderLeftWidth: 14 * L.s, borderRightWidth: 14 * L.s, borderTopWidth: 18 * L.s, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: c('pink') }} />
          </Animated.View>
        ) : null}
      </View>
      <View pointerEvents="none" style={L.box(cx - 300, 690, 600, 26)}>
        <T size={17} font="nunito_x" color={WHITE} align="center" fixed>Tap anywhere to continue</T>
      </View>
      {gameplay ? <IconBtn x={L.left} y={16} icon="pause" bg="yellow" label="Pause" onPress={() => app.push({ name: 'pause' })} /> : null}
      <Btn at={[L.right - 290, 18, 130, 70]} label="Log" color="cream" size={24} onPress={() => setLog(!log)} />
      <Btn at={[L.right - 146, 18, 146, 70]} label="Skip" color="cream" size={24} onPress={finish} testID="skip" />
      {log ? (
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(27,23,51,0.65)' }]} onPress={() => setLog(false)}>
          <Panel at={[cx - 450, 70, 900, 580]} radius={26} lip={8}>
            <View style={{ flex: 1, padding: 30 * L.s }}>
              <T size={34} font="baloo" align="center">Conversation log</T>
              {lines.slice(0, i + 1).slice(-6).map((ln, k) => (
                <T key={k} size={22} font="nunito_s" style={{ marginTop: 10 * L.s }}>
                  <T size={22} font="baloo">{`${NAMES[ln.speaker] ?? ln.speaker}: `}</T>
                  {ln.text}
                </T>
              ))}
              <View style={{ flex: 1 }} />
              <T size={18} font="nunito_x" color={INK2} align="center">Tap anywhere to close</T>
            </View>
          </Panel>
        </Pressable>
      ) : null}
    </View>
  );
}

export { avatarOf };

/** Overlays drawn above the current screen: stall picker, visit complete, Mela Board, diary pages, pause,
 * settings, how to play, about & privacy, confirm dialogs, save error and the results explanation. */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ConfirmSpec, Keyed, OverlaySpec, useApp } from '../app/AppContext';
import { useBack, useOnce } from '../app/hooks';
import { content } from '../logic/content';
import { RiasecReport } from '../logic/riasec';
import { pick } from '../logic/rng';
import { useL } from '../ui/layout';
import { Bg, Btn, Bubble, Char, Check, IconBtn, Img, Panel, Pill, Polaroid, Portrait, Ribbon, T, Tap, useAppear } from '../ui/kit';
import { c, CREAM, INK, INK2, LILAC, WHITE } from '../ui/theme';
import { avatarOf } from './Story';

/** Dimmed backdrop + springy entrance. Tapping the backdrop closes the overlay when `dismiss` is given. */
function Frame({ children, dismiss, alpha = 0.6 }: { children: React.ReactNode; dismiss?: () => void; alpha?: number }) {
  const a = useAppear(0, 0);
  const { settings } = useApp();
  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(27,23,51,${settings.high_contrast ? alpha + 0.15 : alpha})`, opacity: a }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} accessibilityLabel={dismiss ? 'Close' : undefined} />
      </Animated.View>
      <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { opacity: a, transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }] }]}>
        {children}
      </Animated.View>
    </View>
  );
}

export function OverlayView({ o }: { o: Keyed<OverlaySpec> }) {
  const app = useApp();
  const close = () => app.pop(o.key);
  switch (o.name) {
    case 'pause': return <Pause close={close} />;
    case 'settings': return <SettingsOverlay close={close} />;
    case 'howto': return <HowTo close={close} />;
    case 'about': return <About close={close} />;
    case 'confirm': return <Confirm spec={o} close={close} />;
    case 'stallSelect': return <StallSelect pre={o.pre ?? null} close={close} />;
    case 'visitComplete': return <VisitComplete close={close} />;
    case 'board': return <Board close={close} />;
    case 'diaryPages': return <DiaryPages close={close} />;
    case 'explain': return <Explain rep={o.rep} close={close} />;
    case 'saveError': return <SaveError close={close} />;
    default: return null;
  }
}

// =============================================================================== stall selection
function StallSelect({ pre, close }: { pre: string | null; close: () => void }) {
  const L = useL();
  const app = useApp();
  const s = app.session;
  const avail = new Set(s.availableStalls());
  const [sel, setSel] = useState<string | null>(pre && avail.has(pre) ? pre : null);
  useBack(close);
  const go = () => {
    if (sel && s.chooseStall(sel)) {
      close();
      app.replace({ name: 'stall' });
    }
  };
  const avW = L.right - L.left;
  const cw = Math.min(390, (avW - 60) / 3);
  const gap = Math.min(30, (avW - cw * 3) / 2);
  const x0 = L.cx - (cw * 3 + gap * 2) / 2;
  return (
    <Frame dismiss={close}>
      <Ribbon x={L.cx - 210} y={20} w={420} h={70} text="Where to next?" color="teal" size={36} />
      {content.stalls.map((st, i) => {
        const visited = !avail.has(st.id);
        const on = st.id === sel;
        const x = x0 + (i % 3) * (cw + gap);
        const y = 116 + Math.floor(i / 3) * 236;
        return (
          <Tap key={st.id} testID={`stall_${st.id}`} at={[x, y, cw, 214]} label={visited ? `${st.name}, visited today` : st.name} lift={on ? -10 : 0} disabled={visited}
            onPress={() => setSel(st.id)}>
            {on ? <View style={[StyleSheet.absoluteFill, { margin: -8 * L.s, borderRadius: 32 * L.s, backgroundColor: c('yellow') }]} /> : null}
            <Panel fill={visited ? LILAC : CREAM} radius={26} ow={3.6} lip={8} style={{ flex: 1 }}>
              <View style={{ height: 92 * L.s, backgroundColor: visited ? '#CFC8DA' : c(st.color), borderBottomWidth: 3.4 * L.s, borderColor: INK, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 * L.s }}>
                <View style={{ width: 66 * L.s, height: 66 * L.s, borderRadius: 33 * L.s, backgroundColor: WHITE, borderWidth: 3 * L.s, borderColor: INK, alignItems: 'center', justifyContent: 'center' }}>
                  <Img src={st.icon} style={{ width: 44 * L.s, height: 44 * L.s }} opacity={visited ? 0.55 : 1} />
                </View>
                <View style={{ flex: 1 }} />
                <Img src={st.tent} style={{ width: 104 * L.s, height: 86 * L.s, marginTop: 10 * L.s }} opacity={visited ? 0.55 : 1} />
              </View>
              <View style={{ flex: 1, paddingHorizontal: 18 * L.s, justifyContent: 'center' }}>
                <T size={27} font="baloo" color={visited ? INK2 : INK} lines={1} fixed>{st.name}</T>
                <T size={20} font="nunito_x" color={INK2} lines={1}>{st.tagline}</T>
              </View>
            </Panel>
            {visited ? (
              <View style={{ position: 'absolute', right: 12 * L.s, top: 12 * L.s }}>
                <Pill fill={c('green')} style={{ height: 40 * L.s }}><T size={17} font="nunito_x" fixed>Visited today</T></Pill>
              </View>
            ) : null}
            {on ? <View style={{ position: 'absolute', right: -6 * L.s, top: -6 * L.s }}><Check rel x={0} y={0} d={52} /></View> : null}
          </Tap>
        );
      })}
      <View pointerEvents="none" style={L.box(L.cx - 450, 584, 900, 30)}>
        <T size={20} font="nunito_x" color={WHITE} align="center">Any stall, any order. You can come back to a stall on another day.</T>
      </View>
      <Btn at={[x0, 622, 170, 84]} label="Map" icon="back" color="cream" size={26} onPress={close} />
      <Btn at={[L.cx - 160, 622, 320, 84]} label="Let's go!" icon="next" size={32} disabled={!sel} pulse={!!sel} onPress={go} testID="go" />
    </Frame>
  );
}

// =============================================================================== visit complete
function VisitComplete({ close }: { close: () => void }) {
  const L = useL();
  const app = useApp();
  const s = app.session;
  const entry = s.profile!.board[s.profile!.board.length - 1];
  const last = s.progress.stalls_today.length >= 3;
  const line = useMemo(() => pick(content.dialogues.visit_complete), []);
  const flash = useRef(new Animated.Value(1)).current;
  useOnce(() => {
    app.sfx('sfx_camera_shutter');
    app.sfx('sfx_visit_complete', 0.8);
    app.haptic('success');
    app.fx('sparkle', L.cx, 300, 16);
    if (!app.settings.reduce_motion) Animated.timing(flash, { toValue: 0, duration: 260, useNativeDriver: true }).start();
    else flash.setValue(0);
  });
  const go = () => {
    close();
    if (last) app.toast(content.dialogues.all_visits_done, 'purple', 2.4);
    app.route();
  };
  useBack(go);
  const drop = useAppear(120, 0);
  const cx = L.cx;
  return (
    <Frame>
      <Panel at={[cx - 380, 100, 760, 540]} radius={30} lip={9} />
      <Ribbon x={cx - 180} y={70} w={360} h={66} text="Stall done!" color="yellow" size={34} />
      <Animated.View style={{ opacity: drop, transform: [{ translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-60 * L.s, 0] }) }] }}>
        {entry ? <Polaroid x={cx - 340} y={170} w={250} entry={entry} avatar={avatarOf(app)} rotate={-3} /> : null}
      </Animated.View>
      <View style={L.box(cx - 50, 180, 400, 300)}>
        <T size={36} font="baloo">{line}</T>
        <T size={23} font="nunito_x" color={INK2}>Sara took a photo for the Mela Board.</T>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 26 * L.s }}>
          <Img src="ui/diya" style={{ width: 66 * L.s, height: 66 * L.s }} />
          <T size={32} font="baloo" style={{ marginLeft: 10 * L.s }}>{`${s.profile!.lights} / 100 lights`}</T>
        </View>
        <T size={24} font="nunito_x" color={INK2} style={{ marginTop: 18 * L.s }}>{`Stalls today: ${s.progress.stalls_today.length} of 3`}</T>
      </View>
      <Btn at={[cx - 190, 532, 380, 88]} label={last ? 'Head to the evening' : 'Back to the map'} icon="next" size={30} pulse onPress={go} testID="go" />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: WHITE, opacity: flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.8] }) }]} />
    </Frame>
  );
}

// =============================================================================== Mela Board
function Board({ close }: { close: () => void }) {
  const L = useL();
  const app = useApp();
  const s = app.session;
  useBack(close);
  const lights = s.active ? s.profile!.lights : 0;
  const board = s.active ? s.profile!.board : [];
  const lit = Math.floor(lights / 5);
  const colW = Math.min(230, (L.right - L.left - 160) / 5);
  const x0 = L.cx - (colW * 5) / 2 - 60;
  return (
    <View style={StyleSheet.absoluteFill}>
      <Bg src="backgrounds/bg_board_wall" />
      <Ribbon x={L.cx - 210} y={14} w={420} h={70} text="Mela Board" color="pink" size={40} />
      <View pointerEvents="none" style={[L.box(L.cx - 400, 100, 600, 40), { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        {Array.from({ length: 20 }, (_, i) => (
          <View key={i} style={{ width: 22 * L.s, height: 22 * L.s, borderRadius: 11 * L.s, borderWidth: 2.5 * L.s, borderColor: INK, backgroundColor: i < lit ? '#FFE07A' : '#BDB5CF', shadowColor: '#FFE07A', shadowOpacity: i < lit ? 1 : 0, shadowRadius: 8 * L.s, elevation: i < lit ? 4 : 0 }} />
        ))}
      </View>
      <Pill at={[L.cx + 230, 94, 170, 50]}><T size={22} font="baloo" fixed>{`${lights} / 100`}</T></Pill>
      {[1, 2, 3, 4, 5].map((d) => {
        const ent = board.filter((e) => e.day === d);
        const x = x0 + (d - 1) * colW;
        return (
          <React.Fragment key={d}>
            <Panel at={[x + colW / 2 - 80, 152, 160, 50]} fill={ent.length ? c('teal') : '#CFC8DA'} radius={16} ow={3} lip={5} lipColor={ent.length ? '#0B6F67' : '#A79FBC'}>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><T size={26} font="baloo" color={ent.length ? WHITE : INK2} fixed>{`Day ${d}`}</T></View>
            </Panel>
            {[0, 1, 2].map((j) => {
              const y = 214 + j * 158;
              if (j < ent.length) return <Polaroid key={j} x={x + colW / 2 - 60 + (j % 2) * 10} y={y} w={120} entry={ent[j]} avatar={avatarOf(app)} rotate={j % 2 ? 2 : -2} />;
              return (
                <View key={j} style={[L.box(x + colW / 2 - 60, y, 120, 140), { borderRadius: 8 * L.s, borderWidth: 2.5 * L.s, borderStyle: 'dashed', borderColor: '#6B4A2E', alignItems: 'center', justifyContent: 'center' }]}>
                  <Img src="ui/icon_camera" style={{ width: 44 * L.s, height: 44 * L.s }} opacity={0.6} />
                  <T size={15} font="nunito_x" color="#6B4A2E" fixed>Coming soon</T>
                </View>
              );
            })}
          </React.Fragment>
        );
      })}
      <Char kind="sara" x={L.right - 100} y={735} h={240} pose="wave" expr="happy" flip />
      {!board.length ? (
        <View pointerEvents="none" style={L.box(L.right - 520, 470, 300, 100)}>
          <Bubble rel at={[0, 0, 300, 92]}><T size={21} font="nunito_x">I'll take photos as you go!</T></Bubble>
        </View>
      ) : null}
      <Btn at={[L.left, 622, 180, 84]} label="Back" icon="back" color="cream" size={28} onPress={close} />
    </View>
  );
}

// =============================================================================== diary pages (never shows answers)
function DiaryPages({ close }: { close: () => void }) {
  const L = useL();
  const app = useApp();
  const s = app.session;
  useBack(close);
  const cx = L.cx;
  return (
    <Frame dismiss={close}>
      <Panel at={[cx - 470, 70, 940, 600]} fill="#FFF8E8" radius={28} lip={9} />
      <Ribbon x={cx - 180} y={40} w={360} h={64} text="Diary pages" color="purple" size={32} />
      <View style={L.box(cx - 430, 120, 860, 480)}>
        <T size={19} font="nunito_x" color={INK2} align="center">Your answers stay private. Only the pages you've written are listed here.</T>
        <ScrollView style={{ marginTop: 10 * L.s }}>
          {[1, 2, 3, 4, 5].map((d) => {
            const items = content.diaryForDay(d);
            let done = 0;
            if (s.active) {
              if (s.day > d || (s.day === d && ['summary', 'finale', 'results', 'done'].includes(s.phase))) done = items.length;
              else if (s.day === d && s.phase === 'diary') done = s.progress.diary_index;
            }
            return (
              <View key={d} style={{ flexDirection: 'row', paddingVertical: 8 * L.s, borderBottomWidth: 2 * L.s, borderColor: LILAC }}>
                <T size={26} font="baloo" style={{ width: 110 * L.s }}>{`Day ${d}`}</T>
                <View style={{ flex: 1 }}>
                  {items.map((it, k) => (
                    <View key={it.id} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 34 * L.s }}>
                      <T size={20} font="nunito_s" color={k < done ? INK : INK2} style={{ flex: 1 }}>{k < done ? it.text : '…'}</T>
                      <T size={18} font="nunito_x" color={k < done ? c('green') : INK2}>{k < done ? 'Written' : 'Not yet'}</T>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
      <Btn at={[cx - 110, 606, 220, 80]} label="Close" size={28} onPress={close} testID="close" />
    </Frame>
  );
}

// =============================================================================== pause
function Pause({ close }: { close: () => void }) {
  const L = useL();
  const app = useApp();
  const s = app.session;
  useBack(close);
  let loc = '';
  if (s.active) {
    loc = `Day ${s.day}`;
    const st = s.progress.stall ? content.stallById[s.progress.stall] : null;
    if (st && s.phase === 'visit') loc += ` · ${st.name}`;
  }
  const toMenu = () => {
    app.toast('Game saved');
    app.toMenu();
  };
  const cx = L.cx;
  return (
    <Frame dismiss={close}>
      <Panel at={[cx - 240, 76, 480, 620]} radius={30} lip={9} />
      <Ribbon x={cx - 130} y={46} w={260} h={66} text="Paused" color="yellow" size={36} />
      <Portrait kind="hudhud" expr="smile" x={cx} y={180} d={110} ring="#FFE9A8" />
      <View style={L.box(cx - 220, 244, 440, 34)}><T size={22} font="baloo" color={INK2} align="center">{loc}</T></View>
      <Btn at={[cx - 180, 290, 360, 88]} label="Resume" icon="next" size={32} pulse onPress={close} />
      <Btn at={[cx - 180, 392, 360, 80]} label="Settings" icon="gear" color="teal" size={28} onPress={() => app.push({ name: 'settings' })} />
      <Btn at={[cx - 180, 486, 360, 80]} label="How to Play" icon="help" color="cream" size={28} onPress={() => app.push({ name: 'howto' })} />
      <Btn at={[cx - 180, 580, 360, 80]} label="Save & Main Menu" icon="home" color="cream" size={26} onPress={toMenu} />
    </Frame>
  );
}

// =============================================================================== settings
function Toggle({ value, onChange, label, disabled }: { value: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  const L = useL();
  const app = useApp();
  const v = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(v, { toValue: value ? 1 : 0, useNativeDriver: true, friction: 7 }).start();
  }, [value, v]);
  return (
    <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value, disabled }} hitSlop={10 * L.s}
      onPress={() => {
        if (disabled) return app.sfx('sfx_ui_denied', 0.6);
        app.sfx('sfx_ui_toggle');
        app.haptic('select');
        onChange(!value);
      }}
      style={{ width: 110 * L.s, height: 58 * L.s, borderRadius: 29 * L.s, borderWidth: 3.2 * L.s, borderColor: INK, backgroundColor: disabled ? '#CFC8DA' : value ? c('green') : LILAC, justifyContent: 'center' }}>
      <Animated.View style={{ width: 44 * L.s, height: 44 * L.s, borderRadius: 22 * L.s, marginLeft: 4 * L.s, backgroundColor: WHITE, borderWidth: 3 * L.s, borderColor: INK, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, 52 * L.s] }) }] }} />
    </Pressable>
  );
}

function Segmented({ options, value, onChange, labels, fontSizes }: { options: number[]; value: number; onChange: (v: number) => void; labels: string[]; fontSizes?: number[] }) {
  const L = useL();
  const app = useApp();
  return (
    <View style={{ flexDirection: 'row', borderRadius: 18 * L.s, borderWidth: 3.2 * L.s, borderColor: INK, overflow: 'hidden', backgroundColor: WHITE }}>
      {options.map((o, i) => {
        const on = Math.abs(o - value) < 0.01;
        return (
          <Pressable key={o} accessibilityRole="button" accessibilityLabel={labels[i]} accessibilityState={{ selected: on }}
            onPress={() => {
              app.sfx('sfx_ui_toggle');
              app.haptic('select');
              onChange(o);
            }}
            style={{ width: 68 * L.s, height: 56 * L.s, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c('yellow') : WHITE, borderLeftWidth: i ? 2.4 * L.s : 0, borderColor: INK }}>
            <T size={fontSizes ? fontSizes[i] : 20} font="baloo" fixed>{fontSizes ? 'A' : labels[i]}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

const VOLS = [0.25, 0.5, 0.75, 1];

function Row({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  const L = useL();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: 92 * L.s }}>
      <Img src={`ui/icon_${icon}`} style={{ width: 40 * L.s, height: 40 * L.s, marginRight: 14 * L.s }} />
      <T size={27} font="baloo" style={{ flex: 1 }} lines={1}>{label}</T>
      {children}
    </View>
  );
}

function SettingsOverlay({ close }: { close: () => void }) {
  const L = useL();
  const app = useApp();
  const st = app.settings;
  const s = app.session;
  useBack(close);
  const setResearch = (v: boolean) => {
    if (v) {
      s.setConsent(true);
      app.refresh();
      app.toast('Thank you! Research notes are on.');
    } else {
      app.push({
        name: 'confirm', title: 'Turn off research notes?', body: 'Any research notes already saved on this phone will be deleted.',
        yes: 'Turn off', no: 'Keep them on', onYes: () => {
          s.setConsent(false);
          app.refresh();
          app.toast('Research notes deleted');
        },
      });
    }
  };
  const doDelete = () => {
    app.saves.deleteAll();
    app.session.close();
    app.resetSettings();
    app.clearOverlays();
    app.toMenu();
    app.toast('Your data was deleted');
  };
  const deleteData = () => {
    app.push({
      name: 'confirm', title: 'Delete all your data?', body: 'Your progress, your answers and your settings will be removed from this phone.',
      yes: 'Yes, delete', danger: true,
      onYes: () => app.push({ name: 'confirm', title: 'Are you completely sure?', body: "This deletes your game, answers and settings. It can't be undone.", yes: 'Delete everything', danger: true, delay: 2, onYes: doDelete }),
    });
  };
  const cx = L.cx;
  const W = Math.min(1200, L.right - L.left);
  const x0 = cx - W / 2;
  const colW = (W - 100) / 2;
  return (
    <Frame dismiss={close}>
      <Panel at={[x0, 70, W, 620]} radius={30} lip={9} />
      <Ribbon x={cx - 140} y={40} w={280} h={66} text="Settings" color="teal" size={34} />
      <View style={[L.box(x0 + 40, 120, W - 80, 420), { flexDirection: 'row', justifyContent: 'space-between' }]}>
        <View style={{ width: colW * L.s }}>
          <Row icon="music" label="Music">
            <Toggle value={st.music_on} label="Music" onChange={(v) => app.setSettings({ music_on: v })} />
          </Row>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: -10 * L.s, marginBottom: 6 * L.s }}>
            <Segmented options={VOLS} labels={['Quiet', 'Low', 'Mid', 'Loud']} value={VOLS.reduce((a, b) => (Math.abs(b - st.music_volume) < Math.abs(a - st.music_volume) ? b : a))} onChange={(v) => app.setSettings({ music_volume: v, music_on: true })} />
          </View>
          <Row icon="sound" label="Sound effects">
            <Toggle value={st.sfx_on} label="Sound effects" onChange={(v) => app.setSettings({ sfx_on: v })} />
          </Row>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: -10 * L.s, marginBottom: 6 * L.s }}>
            <Segmented options={VOLS} labels={['Quiet', 'Low', 'Mid', 'Loud']} value={VOLS.reduce((a, b) => (Math.abs(b - st.sfx_volume) < Math.abs(a - st.sfx_volume) ? b : a))} onChange={(v) => { app.setSettings({ sfx_volume: v, sfx_on: true }); app.sfx('sfx_ui_tap'); }} />
          </View>
          <Row icon="text" label="Text size">
            <Segmented options={[1, 1.15, 1.3]} labels={['Normal text', 'Large text', 'Largest text']} fontSizes={[20, 25, 30]} value={st.text_scale} onChange={(v) => app.setSettings({ text_scale: v })} />
          </Row>
        </View>
        <View style={{ width: colW * L.s }}>
          <Row icon="motion" label="Reduce motion">
            <Toggle value={st.reduce_motion} label="Reduce motion" onChange={(v) => app.setSettings({ reduce_motion: v })} />
          </Row>
          <Row icon="contrast" label="High contrast">
            <Toggle value={st.high_contrast} label="High contrast" onChange={(v) => app.setSettings({ high_contrast: v })} />
          </Row>
          <Row icon="screen" label="Vibration">
            <Toggle value={st.haptics} label="Vibration" onChange={(v) => app.setSettings({ haptics: v })} />
          </Row>
          <Row icon="book" label="Research notes">
            <T size={18} font="nunito_x" color={INK2} style={{ marginRight: 12 * L.s }}>{s.active ? (s.consent ? 'On' : 'Off') : 'Set when you start'}</T>
            <Toggle value={s.active && s.consent} label="Research notes" disabled={!s.active} onChange={setResearch} />
          </Row>
        </View>
      </View>
      <View style={[L.box(x0 + 40, 560, W - 80, 3), { backgroundColor: LILAC }]} />
      <Btn at={[x0 + 40, 586, 300, 80]} label="Delete my data…" icon="trash" color="danger" size={24} onPress={deleteData} />
      <Btn at={[x0 + W - 260, 586, 220, 80]} label="Done" size={30} onPress={close} />
    </Frame>
  );
}

// =============================================================================== how to play
function HowTo({ close }: { close: () => void }) {
  const L = useL();
  const app = useApp();
  const pages = content.dialogues.howto;
  const [i, setI] = useState(0);
  useBack(close);
  const go = (d: number) => setI((k) => Math.max(0, Math.min(pages.length - 1, k + d)));
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderRelease: (_, g) => {
      if (g.dx < -50) go(1);
      else if (g.dx > 50) go(-1);
    },
  }), []); // eslint-disable-line react-hooks/exhaustive-deps
  const p = pages[i];
  const cx = L.cx;
  const isBg = p.image.startsWith('backgrounds');
  const isPortrait = p.image.includes('portrait');
  return (
    <Frame dismiss={close}>
      <View {...pan.panHandlers} style={L.box(cx - 480, 60, 960, 610)}>
        <Panel radius={30} lip={9} style={{ flex: 1 }}>
          <View style={{ flex: 1, flexDirection: 'row', padding: 46 * L.s, paddingTop: 56 * L.s }}>
            <View style={{ width: 320 * L.s, height: 320 * L.s, borderRadius: 160 * L.s, backgroundColor: '#FFE9C7', borderWidth: 3 * L.s, borderColor: INK, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <Img key={p.image} src={p.image} fit={isBg ? 'cover' : 'contain'} style={isBg ? { width: '100%', height: '100%' } : { width: (isPortrait ? 300 : 200) * L.s, height: (isPortrait ? 300 : 200) * L.s }} />
            </View>
            <View style={{ flex: 1, marginLeft: 40 * L.s }}>
              <T size={20} font="nunito_x" color={INK2}>{`${i + 1} / ${pages.length}`}</T>
              <T size={40} font="baloo" fixed>{p.title}</T>
              <T size={28} style={{ marginTop: 10 * L.s }}>{p.text}</T>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 120 * L.s }}>
            {pages.map((_, k) => (
              <View key={k} style={{ width: (k === i ? 22 : 16) * L.s, height: (k === i ? 22 : 16) * L.s, borderRadius: 11 * L.s, marginHorizontal: 8 * L.s, borderWidth: 2.4 * L.s, borderColor: INK, backgroundColor: k === i ? c('pink') : WHITE }} />
            ))}
          </View>
        </Panel>
      </View>
      <Ribbon x={cx - 160} y={30} w={320} h={64} text="How to play" color="teal" size={32} />
      <IconBtn x={cx - 470} y={570} icon="back" label="Previous page" onPress={() => go(-1)} />
      <IconBtn x={cx + 386} y={570} icon="next" label="Next page" onPress={() => go(1)} />
      <Btn at={[cx - 130, 566, 260, 84]} label={i < pages.length - 1 ? 'Next' : 'Got it!'} size={30} pulse={i === pages.length - 1} onPress={() => (i < pages.length - 1 ? go(1) : close())} />
    </Frame>
  );
}

// =============================================================================== about & privacy
const ABOUT: Record<string, string> = {
  About:
    "Apna Mela is a festival game about discovering what you enjoy. Over five days you help prepare your school's mela, choose stalls and jobs, and handle little surprises. At the end, Hudhud shows your Mela Code: the kinds of activities you enjoyed most.\n\nThe Mela Code is about interests, not abilities. Interests grow and change over time, so treat it as a starting point for a conversation with your teacher or counsellor.",
  'Your privacy':
    'Apna Mela works completely offline. It has no accounts, no ads and no tracking, and it does not send your answers anywhere.\n\nSaved on this phone only: your nickname (optional), avatar, settings, progress and your answers. Your interest answers and your optional research notes are kept in separate records.\n\nResearch notes (Twist answers and diary) are saved only if you said yes. They are never shown as a score to you, your teachers or your parents. You can switch them off, or delete everything, in Settings.',
  Credits:
    'Game design, art and code: the Apna Mela team.\nCharacters: Hudhud, Zain, Hira, Bilal, Sara and Ustad Karim.\n\nFonts: Baloo 2 (Ek Type) and Nunito (The Nunito Project Authors), SIL Open Font License 1.1.\nAll illustrations, music and sound effects are original and were made for this game.',
};

function About({ close }: { close: () => void }) {
  const L = useL();
  const [tab, setTab] = useState('About');
  useBack(close);
  const cx = L.cx;
  return (
    <Frame dismiss={close}>
      <Panel at={[cx - 470, 50, 940, 640]} radius={30} lip={9} />
      <View style={[L.box(cx - 420, 76, 840, 84), { flexDirection: 'row', justifyContent: 'space-between' }]}>
        {Object.keys(ABOUT).map((k) => (
          <Btn key={k} label={k} color={tab === k ? 'yellow' : 'cream'} size={24} onPress={() => setTab(k)} style={{ width: 268 * L.s }} />
        ))}
      </View>
      <View style={L.box(cx - 420, 180, 840, 400)}>
        <ScrollView>
          <T size={23} font="nunito_s" lh={1.45}>{ABOUT[tab]}</T>
        </ScrollView>
      </View>
      <Btn at={[cx - 110, 596, 220, 80]} label="Close" size={28} onPress={close} />
    </Frame>
  );
}

// =============================================================================== confirm
function Confirm({ spec, close }: { spec: ConfirmSpec; close: () => void }) {
  const L = useL();
  const [left, setLeft] = useState(spec.delay ?? 0);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((x) => Math.max(0, x - 1)), 1000);
    return () => clearTimeout(t);
  }, [left]);
  const no = () => {
    close();
    spec.onNo?.();
  };
  const yes = () => {
    close();
    spec.onYes();
  };
  useBack(no);
  const cx = L.cx;
  return (
    <Frame dismiss={no}>
      <Panel at={[cx - 380, 190, 760, 340]} radius={30} lip={9} />
      <View style={L.box(cx - 340, 220, 680, 190)}>
        <T size={40} font="baloo" align="center">{spec.title}</T>
        <T size={25} font="nunito_s" color={INK2} align="center" style={{ marginTop: 10 * L.s }}>{spec.body}</T>
      </View>
      <Btn at={[cx - 340, 420, 320, 84]} label={spec.no ?? 'Cancel'} color="cream" size={28} onPress={no} />
      <Btn at={[cx + 20, 420, 320, 84]} label={left > 0 ? `Wait ${left}…` : spec.yes} color={spec.danger ? 'red' : 'pink'} size={28} disabled={left > 0} onPress={yes} testID="yes" />
    </Frame>
  );
}

// =============================================================================== save error
function SaveError({ close }: { close: () => void }) {
  const L = useL();
  const app = useApp();
  useBack(close);
  const retry = () => {
    try {
      if (app.session.load()) {
        close();
        app.route();
        return;
      }
    } catch {
      /* still broken */
    }
    app.toast("Still couldn't open it", 'red');
  };
  const fresh = () => app.push({
    name: 'confirm', title: 'Start fresh?', body: 'The unreadable game will be removed.', yes: 'Remove it', danger: true,
    onYes: () => {
      app.saves.deleteGame();
      close();
      app.toMenu();
      app.toast('Old game removed. Press PLAY to start.');
    },
  });
  const cx = L.cx;
  return (
    <Frame dismiss={close}>
      <Panel at={[cx - 400, 150, 800, 420]} radius={30} lip={9} />
      <Char kind="hudhud" x={cx} y={300} h={120} expr="worried" />
      <View style={L.box(cx - 360, 310, 720, 120)}>
        <T size={34} font="baloo" align="center">We couldn't open your saved mela.</T>
        <T size={22} font="nunito_s" color={INK2} align="center">The save may be damaged. You can try again or start a new game.</T>
      </View>
      <Btn at={[cx - 360, 450, 220, 84]} label="Try again" color="teal" size={26} onPress={retry} />
      <Btn at={[cx - 110, 450, 220, 84]} label="Start fresh" color="danger" size={26} onPress={fresh} />
      <Btn at={[cx + 140, 450, 220, 84]} label="Back" color="cream" size={26} onPress={close} />
    </Frame>
  );
}

// =============================================================================== results explanation (RIASEC only)
function Explain({ rep, close }: { rep: RiasecReport; close: () => void }) {
  const L = useL();
  useBack(close);
  const seen: string[] = [];
  for (const g of rep.medallions.slice(0, 3)) for (const t of g) if (!seen.includes(t) && seen.length < 3) seen.push(t);
  const cx = L.cx;
  return (
    <Frame dismiss={close}>
      <Panel at={[cx - 560, 50, 1120, 640]} radius={30} lip={9} />
      <Ribbon x={cx - 220} y={22} w={440} h={64} text="What your code means" color="teal" size={32} />
      <View style={L.box(cx - 520, 100, 1040, 480)}>
        <ScrollView>
          {seen.map((t) => {
            const info = content.careers[t as keyof typeof content.careers];
            return (
              <View key={t} style={{ flexDirection: 'row', marginBottom: 18 * L.s }}>
                <View style={{ width: 84 * L.s, height: 84 * L.s, borderRadius: 42 * L.s, backgroundColor: c(info.colour), borderWidth: 3 * L.s, borderColor: INK, alignItems: 'center', justifyContent: 'center', marginRight: 22 * L.s }}>
                  <Img src={info.icon} style={{ width: 52 * L.s, height: 52 * L.s }} />
                </View>
                <View style={{ flex: 1 }}>
                  <T size={30} font="baloo">{`${info.name}  ·  ${info.term} (${t})`}</T>
                  <T size={23} font="nunito_s">{info.explain}</T>
                </View>
              </View>
            );
          })}
          <View style={{ height: 3 * L.s, backgroundColor: LILAC, marginVertical: 8 * L.s }} />
          <T size={21} font="nunito_s" color={INK2}>
            How was this worked out? Each time you picked a job on a Job Board, that kind of activity got a point. Your heart ratings and the stalls you chose helped break ties. Your code is your top three kinds of activity in this game. It is a starting point for exploring, not a label. People's interests develop as they try new things.
          </T>
        </ScrollView>
      </View>
      <Btn at={[cx - 110, 596, 220, 80]} label="Back" icon="back" size={28} onPress={close} />
    </Frame>
  );
}


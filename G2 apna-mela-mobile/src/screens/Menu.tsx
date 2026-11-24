/** Main menu, "Before we start" (privacy + research consent) and avatar selection. */
import React, { useMemo, useState } from 'react';
import { BackHandler, TextInput, View } from 'react-native';
import { useApp } from '../app/AppContext';
import { useBack, useMusic } from '../app/hooks';
import { SaveCorrupt } from '../logic/storage';
import { useL } from '../ui/layout';
import { Bg, Btn, Bubble, Char, Check, IconBtn, Img, Panel, Pill, Ribbon, T, Tap, useAppear } from '../ui/kit';
import { c, CREAM, INK, INK2, LILAC, WHITE } from '../ui/theme';
import { Animated } from 'react-native';

// =============================================================================== main menu
export function MainMenu() {
  const L = useL();
  const app = useApp();
  useMusic('mus_menu_theme');
  const { state, day } = useMemo(() => {
    try {
      const p = app.saves.load<any>('profile');
      if (!p) return { state: 'none', day: 1 };
      return { state: p.completed ? 'done' : 'ok', day: p.progress?.day ?? 1 };
    } catch (e) {
      if (e instanceof SaveCorrupt) return { state: 'corrupt', day: 1 };
      return { state: 'none', day: 1 };
    }
  }, [app.saves, app.rev]); // eslint-disable-line react-hooks/exhaustive-deps

  useBack(() => {
    app.push({
      name: 'confirm', title: 'Leave Apna Mela?', body: 'Your game is saved. You can continue later.', yes: 'Leave', no: 'Stay',
      onYes: () => BackHandler.exitApp(),
    });
  });

  const play = () => {
    if (state === 'ok' || state === 'corrupt') {
      app.push({
        name: 'confirm', title: 'Start a new game?', body: 'This erases your current game and all of its answers.', yes: 'Start new',
        no: 'Keep my game', danger: true, onYes: () => app.replace({ name: 'beforeStart' }),
      });
    } else app.replace({ name: 'beforeStart' });
  };
  const results = () => {
    try {
      if (app.session.load()) app.replace({ name: 'results' });
    } catch {
      app.push({ name: 'saveError' });
    }
  };
  const soundOn = app.settings.music_on || app.settings.sfx_on;
  const cx = L.cx;
  const logoIn = useAppear(0, 0.6);
  return (
    <View style={{ flex: 1 }}>
      <Bg src="backgrounds/bg_menu_dusk" />
      <Animated.View style={[L.box(cx - 330, 14, 660, 258), { transform: [{ scale: logoIn }] }]}>
        <Img src="ui/logo" style={{ width: '100%', height: '100%' }} />
      </Animated.View>
      <Char kind="hudhud" x={cx + 300} y={110} h={96} flip expr="happy" />
      <Char kind="zain" x={cx - 520} y={735} h={300} pose="wave" expr="happy" />
      <Char kind="hira" x={cx - 345} y={735} h={280} expr="smile" phase={1} />
      <Char kind="bilal" x={cx + 345} y={735} h={285} expr="happy" phase={2} />
      <Char kind="sara" x={cx + 520} y={735} h={300} pose="wave" expr="smile" flip phase={3} />
      <Btn at={[cx - 220, 290, 440, 112]} label="PLAY" size={52} onPress={play} pulse={state === 'none' || state === 'done'} testID="play" />
      {state === 'done' ? (
        <Btn at={[cx - 190, 424, 380, 88]} label="My Mela Code" icon="star" color="teal" size={32} onPress={results} />
      ) : state !== 'none' ? (
        <Btn at={[cx - 190, 424, 380, 88]} label={state === 'ok' ? `Continue · Day ${day}` : 'Continue'} color="teal" size={32} onPress={app.continueGame} pulse={state === 'ok'} testID="continue" />
      ) : null}
      <Btn at={[cx - 250, 540, 240, 84]} label="How to Play" icon="help" color="cream" size={26} onPress={() => app.push({ name: 'howto' })} />
      <Btn at={[cx + 10, 540, 240, 84]} label="About" icon="info" color="cream" size={26} onPress={() => app.push({ name: 'about' })} />
      <IconBtn x={L.right - 182} y={18} icon="sound" label="Sound on or off" onPress={() => app.setSettings({ music_on: !soundOn, sfx_on: !soundOn })} />
      {!soundOn ? <View pointerEvents="none" style={[L.box(L.right - 172, 58, 64, 6), { backgroundColor: c('red'), transform: [{ rotate: '45deg' }], borderRadius: 3 * L.s }]} /> : null}
      <IconBtn x={L.right - 84} y={18} icon="gear" label="Settings" onPress={() => app.push({ name: 'settings' })} />
      <Pill at={[L.right - 420, 662, 420, 44]}>
        <Img src="ui/icon_lock" style={{ width: 22 * L.s, height: 22 * L.s, marginRight: 8 * L.s }} />
        <T size={18} font="nunito_x" fixed>Offline · nothing leaves this phone</T>
      </Pill>
      {state === 'corrupt' ? (
        <View style={L.box(cx - 300, 640, 600, 30)}>
          <T size={18} font="nunito_x" color={WHITE} align="center">Your saved game couldn't be opened.</T>
        </View>
      ) : null}
    </View>
  );
}

// =============================================================================== before we start
export function BeforeStart() {
  const L = useL();
  const app = useApp();
  useMusic('mus_menu_theme');
  const [consent, setConsent] = useState<boolean | null>(null);
  useBack(() => app.toMenu());
  const cx = L.cx;
  const W = Math.min(1180, L.right - L.left);
  const x0 = cx - W / 2;
  const bullets = [
    'There are no right or wrong answers.',
    "Go with your first honest answer. You can't change it later.",
    'Everything stays on this phone.',
    'Use a nickname, not your full name.',
    'You can pause any time.',
  ];
  const rx = x0 + 330;
  const rw = W - 360;
  return (
    <View style={{ flex: 1 }}>
      <Bg src="backgrounds/bg_menu_dusk" blur={6} tint="rgba(27,23,51,0.3)" />
      <Panel at={[x0, 56, W, 640]} lip={9} radius={28} />
      <Ribbon x={cx - 200} y={22} w={400} h={70} text="Before we start" color="teal" size={34} />
      <Char kind="hudhud" x={x0 + 170} y={330} h={190} flip expr="talk" />
      <Bubble at={[x0 + 40, 350, 260, 120]}>
        <T size={24} font="nunito_x" align="center">No wrong answers. Promise!</T>
      </Bubble>
      <View style={L.box(rx, 108, rw, 250)}>
        {bullets.map((b) => (
          <View key={b} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 * L.s }}>
            <Img src="ui/icon_check" style={{ width: 28 * L.s, height: 28 * L.s, marginRight: 12 * L.s }} />
            <T size={25} style={{ flex: 1 }}>{b}</T>
          </View>
        ))}
      </View>
      <View style={[L.box(rx, 366, rw, 3), { backgroundColor: LILAC }]} />
      <View style={L.box(rx, 378, rw, 130)}>
        <T size={28} font="baloo">Research helper (optional)</T>
        <T size={20} font="nunito_s" color={INK2}>
          Hudhud can keep notes of your Twist answers and diary for a school research project. These notes are never shown as a score to you, your teachers or your parents. You can play everything either way, and change this later in Settings.
        </T>
      </View>
      <Btn at={[rx, 556, 300, 84]} label="Yes, I'd like to help" color={consent === true ? 'yellow' : 'cream'} size={24} onPress={() => setConsent(true)} testID="consent_yes" />
      <Btn at={[rx + 316, 556, 220, 84]} label="No, thanks" color={consent === false ? 'yellow' : 'cream'} size={24} onPress={() => setConsent(false)} testID="consent_no" />
      <Btn at={[x0 + W - 260, 556, 230, 84]} label="I'm ready!" size={32} disabled={consent === null} pulse={consent !== null}
        onPress={() => app.replace({ name: 'avatar', consent: !!consent })} testID="ready" />
      {consent === null ? (
        <View style={L.box(x0 + W - 270, 652, 250, 30)}>
          <T size={17} font="nunito_x" color={INK2} align="center">Choose one to continue</T>
        </View>
      ) : null}
      <Btn at={[x0 + 40, 556, 170, 84]} label="Back" icon="back" color="cream" size={26} onPress={() => app.toMenu()} />
    </View>
  );
}

// =============================================================================== avatar
export function Avatar({ consent }: { consent: boolean }) {
  const L = useL();
  const app = useApp();
  useMusic('mus_menu_theme');
  const [sel, setSel] = useState(1);
  const [name, setName] = useState('');
  useBack(() => app.replace({ name: 'beforeStart' }));
  const cx = L.cx;
  const gx = cx - 30;
  const tile = 150;
  const confirm = () => {
    app.session.newGame(sel, name, consent);
    app.haptic('success');
    app.route();
  };
  return (
    <View style={{ flex: 1, backgroundColor: '#FCEFD8' }}>
      <Ribbon x={cx - 280} y={18} w={560} h={70} text="Choose your volunteer!" color="pink" size={34} />
      <View style={[L.box(cx - 560, 150, 420, 420), { borderRadius: 210 * L.s, backgroundColor: 'rgba(255,255,255,0.6)' }]} />
      <Panel at={[cx - 560, 520, 420, 70]} fill={c('yellow')} radius={35} lip={6} lipColor="#D99A0B" />
      <Char key={sel} kind={`av${sel}`} x={cx - 350} y={552} h={390} pose="wave" expr="happy" />
      {Array.from({ length: 8 }, (_, i) => {
        const x = gx + (i % 4) * (tile + 14);
        const y = 110 + Math.floor(i / 4) * (tile + 22);
        const on = i === sel;
        return (
          <Tap key={i} at={[x, y, tile, tile + 8]} label={`Volunteer ${i + 1}`} lift={on ? -8 : 0} onPress={() => {
            setSel(i);
            app.fx('sparkle', x + tile / 2, y + tile / 2, 10);
          }}>
            <Panel fill={on ? '#FFE9A8' : CREAM} radius={22} ow={on ? 5 : 3.2} lip={6} style={{ flex: 1 }} outline={on ? c('pink') : INK}>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Img src={`characters/portrait_av${i}_${on ? 'happy' : 'smile'}`} style={{ width: (tile - 20) * L.s, height: (tile - 20) * L.s, borderRadius: 60 * L.s }} />
              </View>
            </Panel>
          </Tap>
        );
      })}
      <Check x={gx + (sel % 4) * (tile + 14) + tile - 6} y={110 + Math.floor(sel / 4) * (tile + 22) - 2} />
      <View style={[L.box(gx, 456, 640, 40), { flexDirection: 'row', alignItems: 'flex-end' }]}>
        <T size={26} font="baloo">Nickname</T>
        <T size={19} font="nunito_x" color={INK2} style={{ marginLeft: 10 * L.s, marginBottom: 3 * L.s }}>(optional)</T>
      </View>
      <View style={[L.box(gx, 500, 400, 80), { borderRadius: 22 * L.s, borderWidth: 3.4 * L.s, borderColor: INK, backgroundColor: WHITE, justifyContent: 'center', paddingHorizontal: 18 * L.s }]}>
        <TextInput
          value={name}
          onChangeText={(t) => setName(t.replace(/[^A-Za-z0-9 .'-]/g, '').slice(0, 12))}
          placeholder="Type a nickname"
          placeholderTextColor={INK2}
          maxLength={12}
          autoCorrect={false}
          autoComplete="off"
          returnKeyType="done"
          style={{ fontFamily: 'Nunito-Bold', fontSize: 28 * L.s, color: INK, padding: 0 }}
          accessibilityLabel="Nickname (optional)"
        />
      </View>
      <Btn at={[gx + 420, 496, 220, 92]} label="That's me!" size={32} pulse onPress={confirm} testID="thats_me" />
      <View style={[L.box(gx, 604, 640, 34), { flexDirection: 'row', alignItems: 'center' }]}>
        <Img src="ui/icon_lock" style={{ width: 20 * L.s, height: 20 * L.s, marginRight: 8 * L.s }} />
        <T size={18} font="nunito_x" color={INK2}>First name or a nickname only. It stays on this phone.</T>
      </View>
      <Btn at={[L.left, 620, 170, 80]} label="Back" icon="back" color="cream" size={26} onPress={() => app.replace({ name: 'beforeStart' })} />
    </View>
  );
}

import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Panel } from '@/ui/Layout';
import { GText } from '@/ui/Text';
import { GameButton } from '@/ui/Button';
import { ScreenHeader, SpeechBubble } from '@/ui/Game';
import { Icon } from '@/ui/Icon';
import { useGame, useTheme } from '@/state/GameProvider';
import { lookupClass } from '@/services/sync';
import { syncDeps } from '@/services/syncRuntime';
import { elevation, radius, space } from '@/ui/tokens';
import { audio } from '@/services/audio';

type Field = 'code' | 'roll';
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'next'] as const;

/** Link this phone to a teacher's class with a 6-digit class code and a roll number. Digits only — no typing, no names. */
export default function Join() {
  const { s, act } = useGame();
  const { c } = useTheme();
  const router = useRouter();
  const fromSettings = s.joinAsked;
  const [code, setCode] = useState(s.link?.classCode ?? '');
  const [roll, setRoll] = useState(s.link ? String(s.link.roll) : '');
  const [field, setField] = useState<Field>(s.link ? 'roll' : 'code');
  const [msg, setMsg] = useState<{ tone: 'ok' | 'bad' | 'info'; text: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const ready = code.length === 6 && Number(roll) >= 1;

  const press = (k: (typeof KEYS)[number]) => {
    audio.play('blip', 0.4); setMsg(null);
    if (k === 'next') { setField(field === 'code' ? 'roll' : 'code'); return; }
    const set = field === 'code' ? setCode : setRoll;
    const max = field === 'code' ? 6 : 4;
    if (k === 'del') set((v) => v.slice(0, -1));
    else set((v) => (v.length < max ? (field === 'roll' && v === '' && k === '0' ? v : v + k) : v));
    if (field === 'code' && k !== 'del' && code.length === 5) setField('roll');
  };

  const done = () => { if (fromSettings) router.back(); else router.replace('/play'); };

  const join = async () => {
    setChecking(true);
    const r = await lookupClass(code, syncDeps);
    setChecking(false);
    if (r && !r.found) { setMsg({ tone: 'bad', text: 'That class code was not found. Check the code with your teacher.' }); audio.play('gentle'); return; }
    act((e) => e.setLink(code, Number(roll), r?.name));
    audio.play('success');
    setMsg(r ? { tone: 'ok', text: `Joined ${r.name ?? 'your class'}!` } : { tone: 'info', text: 'Saved. We will check the code next time the phone is online.' });
    setTimeout(done, 900);
  };

  const Box = ({ f, label, value, digits }: { f: Field; label: string; value: string; digits: number }) => (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value || 'empty'}`} accessibilityState={{ selected: field === f }} onPress={() => setField(f)}
      style={[{ flex: 1, padding: space.md, borderRadius: radius.md, borderWidth: 3, borderColor: field === f ? c.primary : c.border, backgroundColor: c.surfaceRaised, gap: 4 }, elevation(1)]}>
      <GText variant="label" soft>{label.toUpperCase()}</GText>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {Array.from({ length: digits }, (_, i) => (
          <View key={i} style={{ flex: 1, height: 40, borderRadius: 8, backgroundColor: c.bgAlt, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: field === f && i === value.length ? c.primary : c.border }}>
            <GText variant="heading">{value[i] ?? ''}</GText>
          </View>
        ))}
      </View>
    </Pressable>
  );

  return (
    <Screen>
      <ScreenHeader title="Join your class" onBack={fromSettings ? undefined : () => router.back()}
        speak="Join your class. If your teacher gave you a class code, type it with the number pad, then your roll number. Only your class code, roll number, nickname and game results are shared with your teacher." />
      <SpeechBubble speaker="saima" mood="talk" text="Did your teacher give you a class code? Add it here and your results will appear on your teacher's dashboard." />
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <View style={{ flex: 3 }}><Box f="code" label="Class code" value={code} digits={6} /></View>
        <View style={{ flex: 2 }}><Box f="roll" label="Roll number" value={roll} digits={4} /></View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center', alignSelf: 'center', width: 3 * 84 + 2 * space.sm }}>
        {KEYS.map((k) => (
          <Pressable key={k} accessibilityRole="button" accessibilityLabel={k === 'del' ? 'Delete' : k === 'next' ? 'Switch box' : k} onPress={() => press(k)}
            style={({ pressed }) => [{ width: 84, height: 54, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: k === 'next' ? c.secondary : k === 'del' ? c.bgAlt : c.surfaceRaised, borderWidth: 2, borderColor: c.border, transform: [{ translateY: pressed ? 2 : 0 }] }, elevation(1)]}>
            {k === 'del' ? <Icon name="undo" size={22} color={c.text} /> : k === 'next' ? <Icon name="arrow" size={22} color="#FFFFFF" /> : <GText variant="heading">{k}</GText>}
          </Pressable>
        ))}
      </View>
      {msg ? (
        <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center', padding: space.md, borderRadius: radius.md, borderWidth: 2, backgroundColor: msg.tone === 'ok' ? '#E4F5E9' : msg.tone === 'bad' ? '#FDECEC' : '#FFF3E0', borderColor: msg.tone === 'ok' ? c.success : msg.tone === 'bad' ? c.warning : c.primary }}>
          <Icon name={msg.tone === 'ok' ? 'check' : msg.tone === 'bad' ? 'close' : 'calendar'} color="#2B2433" />
          <GText style={{ flex: 1 }} color="#2B2433">{msg.text}</GText>
        </View>
      ) : null}
      <GameButton label={checking ? 'Checking…' : 'Join class'} icon="check" size="lg" disabled={!ready || checking} onPress={join} testID="join-class" />
      {!fromSettings ? <GameButton label="Skip — I'm playing on my own" variant="ghost" onPress={() => { act((e) => e.skipJoin()); done(); }} testID="join-skip" /> : null}
      {fromSettings && s.link ? <GameButton label="Leave this class" variant="quiet" onPress={() => { act((e) => e.unlink()); router.back(); }} /> : null}
      <Panel tone="tinted">
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Icon name="lock" color={c.primaryDeep} />
          <GText variant="small" style={{ flex: 1 }}>Shared with your teacher: class code, roll number, nickname, game progress and results. Never shared: your name, phone number or anything you did outside the game. You can still play with no internet; results are sent when the phone is online.</GText>
        </View>
      </Panel>
    </Screen>
  );
}

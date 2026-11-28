import { useState } from 'react';
import { API_URL } from '@/services/syncRuntime';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Panel } from '@/ui/Layout';
import { GText } from '@/ui/Text';
import { GameButton } from '@/ui/Button';
import { ScreenHeader } from '@/ui/Game';
import { Segmented, Toggle } from '@/ui/Controls';
import { useGame } from '@/state/GameProvider';
import { space } from '@/ui/tokens';
import { Settings as SettingsT } from '@/game/engine/saveGame';

export default function Settings() {
  const { s, act, sync, syncing } = useGame();
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const router = useRouter();
  const [confirm, setConfirm] = useState(0);
  const set = (p: Partial<SettingsT>) => act((e) => e.updateSettings(p));
  return (
    <Screen>
      <ScreenHeader title="Settings" speak="Settings. Change sound, vibration, theme, your look, or start over." />
      <Panel title="Sound & feel" icon="speaker">
        <Toggle label="Sound effects & music" hint="Sounds are optional. Everything is also shown on screen." value={s.settings.sound} onChange={(v) => set({ sound: v })} testID="toggle-sound" />
        <Toggle label="Vibration" hint="Small buzzes when you tap or finish something." value={s.settings.haptics} onChange={(v) => set({ haptics: v })} />
      </Panel>
      <Panel title="Look" icon="eye">
        <Segmented label="Theme" value={s.settings.theme} onChange={(v) => set({ theme: v })} options={[{ value: 'system', label: 'Phone' }, { value: 'light', label: 'Day' }, { value: 'dark', label: 'Night' }]} />
        <GameButton label="Change my look" icon="person" variant="ghost" onPress={() => router.push('/avatar')} />
      </Panel>
      <GameButton label="Accessibility options" icon="access" variant="secondary" onPress={() => router.push('/accessibility')} />
      <Panel title="Class & dashboard" icon="clipboard" speak={s.link ? `Linked to class ${s.link.classCode}, roll number ${s.link.roll}.` : 'Not linked to a class.'}>
        {s.link ? (
          <>
            <GText>{`Class ${s.link.className ? `${s.link.className} (${s.link.classCode})` : s.link.classCode} · Roll no. ${s.link.roll}`}</GText>
            <GText variant="small" soft>{s.sync.lastError ? `Last try: ${s.sync.lastError}` : s.sync.lastSentAt ? `Results last sent ${new Date(s.sync.lastSentAt).toLocaleString()}` : 'Results not sent yet. They are sent automatically when the phone is online.'}</GText>
            {!API_URL ? <GText variant="small" soft>This build has no dashboard address, so results stay on the phone.</GText> : null}
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <GameButton style={{ flex: 1 }} size="sm" variant="ghost" label="Change" onPress={() => router.push('/join')} />
              <GameButton style={{ flex: 2 }} size="sm" icon="arrow" label={syncing ? 'Sending…' : 'Send now'} disabled={syncing || !API_URL}
                onPress={async () => { const r = await sync(); setSyncMsg(r.ok ? 'Sent to your teacher’s dashboard.' : r.message); }} testID="sync-now" />
            </View>
            {syncMsg ? <GText variant="small">{syncMsg}</GText> : null}
          </>
        ) : (
          <>
            <GText>Not linked to a class. Your results stay only on this phone.</GText>
            <GameButton size="sm" variant="ghost" icon="person" label="Join a class" onPress={() => router.push('/join')} />
          </>
        )}
      </Panel>
      <Panel title="Privacy" icon="lock">
        <GText>Naya Shehar has no ads, no purchases, no chat and no sign-in. It does not ask for your name, phone number or email. Your game is saved on this phone. If you join a class, your class code, roll number, nickname, progress and results are sent to your teacher's dashboard.</GText>
      </Panel>
      <Panel title="Start over" icon="undo">
        <GText>This deletes your town, your choices and your results on this phone. It cannot be undone.</GText>
        <View style={{ gap: space.sm }}>
          {confirm === 0 ? <GameButton label="Start over…" variant="ghost" onPress={() => setConfirm(1)} /> : (
            <>
              <GText variant="bodyBold">Are you sure? Everything will be deleted.</GText>
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <GameButton style={{ flex: 1 }} label="Keep my game" onPress={() => setConfirm(0)} />
                <GameButton style={{ flex: 1 }} label="Delete" variant="ghost" onPress={() => { act((e) => e.resetAll()); router.dismissAll(); router.replace('/'); }} />
              </View>
            </>
          )}
        </View>
      </Panel>
      <GText variant="small" center soft>Naya Shehar v1.0 · Made for students in Pakistan</GText>
    </Screen>
  );
}

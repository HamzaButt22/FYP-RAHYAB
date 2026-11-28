import { Screen, Panel } from '@/ui/Layout';
import { GText } from '@/ui/Text';
import { ScreenHeader } from '@/ui/Game';
import { Segmented, Toggle } from '@/ui/Controls';
import { useGame } from '@/state/GameProvider';
import { Settings } from '@/game/engine/saveGame';

export default function Accessibility() {
  const { s, act } = useGame();
  const set = (p: Partial<Settings>) => act((e) => e.updateSettings(p));
  const inSession = !!s.session && s.session.week > 0;
  return (
    <Screen>
      <ScreenHeader title="Accessibility" speak="Accessibility options. Read aloud, text size, motion, and accessible task mode." />
      <Panel title="Reading" icon="speaker">
        <Toggle label="Read story lines aloud automatically" hint="Every text also has its own speaker button." value={s.settings.readAloudAuto} onChange={(v) => set({ readAloudAuto: v })} />
        <Segmented label="Reading speed" value={s.settings.speechRate} onChange={(v) => set({ speechRate: v })} options={[{ value: 0.75, label: 'Slow' }, { value: 0.95, label: 'Normal' }, { value: 1.15, label: 'Fast' }]} />
        <Segmented label="Text size" value={s.settings.textScale} onChange={(v) => set({ textScale: v })} options={[{ value: 1, label: 'Normal' }, { value: 1.15, label: 'Large' }, { value: 1.3, label: 'Larger' }]} />
      </Panel>
      <Panel title="Motion" icon="eye">
        <Segmented label="Reduce motion" value={s.settings.reducedMotion} onChange={(v) => set({ reducedMotion: v })} options={[{ value: 'system', label: 'Phone' }, { value: 'on', label: 'On' }, { value: 'off', label: 'Off' }]} />
        <GText variant="small" soft>With reduced motion on, the town stays still and screens change without animation.</GText>
      </Panel>
      <Panel title="Accessible task mode" icon="access">
        <Toggle label="Accessible task mode" testID="toggle-accessible"
          hint="Play every activity normally. Weeks played in this mode are marked “not measured” and are NOT used for your career results."
          value={s.settings.accessibleMode} onChange={(v) => set({ accessibleMode: v })} />
        {inSession ? (
          <GText variant="small" soft>{s.session!.measured
            ? 'Turning this on now marks the WHOLE current week as not measured, including what you already did this week.'
            : 'This week is already marked as not measured. Turning the mode off now will not change that; it applies from your next week.'}</GText>
        ) : null}
        {s.unmeasuredWeeks.length ? <GText variant="small">{`Weeks not measured so far: ${s.unmeasuredWeeks.join(', ')}`}</GText> : null}
      </Panel>
    </Screen>
  );
}

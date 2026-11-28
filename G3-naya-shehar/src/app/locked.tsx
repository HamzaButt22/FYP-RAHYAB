import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';
import { Screen, Panel, Appear } from '@/ui/Layout';
import { GText } from '@/ui/Text';
import { GameButton } from '@/ui/Button';
import { ScreenHeader, SpeechBubble } from '@/ui/Game';
import { useGame } from '@/state/GameProvider';
import { ScoredWeek, Week } from '@/assessment/types';
import { SEASONS } from '@/game/story/dialogue';
import { SeasonArt } from '@/screens/session/SeasonIntro';
import { timeUntil } from '@/state/flow';
import { space, radius } from '@/ui/tokens';

/** Next week is not open yet: show when it opens and what to do meanwhile. */
export default function Locked() {
  const { engine, s, act } = useGame();
  const router = useRouter();
  const w = engine.currentWeek();
  if (w === null || w === 0) return <Screen><ScreenHeader title="All caught up" /><GameButton label="Back to the town" onPress={() => router.replace('/town')} /></Screen>;
  const at = engine.unlockTime(w as Week) ?? 0;
  const left = at - engine.now();
  const se = SEASONS[w as ScoredWeek];
  const anomaly = s.schedule.clockAnomalies > 0;
  return (
    <Screen>
      <ScreenHeader title={`Week ${w} is on its way`} speak={`Week ${w}, ${se.name}, opens in about ${timeUntil(left)}. The town needs time to grow. Meanwhile, you can visit the town and fund buildings.`} />
      <Appear>
        <View style={{ borderRadius: radius.xl, overflow: 'hidden', opacity: 0.9 }}><SeasonArt week={w as ScoredWeek} height={170} /></View>
      </Appear>
      <Appear delay={100} style={{ alignItems: 'center' }}>
        <Svg width={150} height={150} viewBox="0 0 150 150" accessibilityLabel={`Opens in ${timeUntil(left)}`}>
          <Rect x={15} y={25} width={120} height={110} rx={16} fill="#FFFBF3" stroke="#C8553D" strokeWidth={5} />
          <Rect x={15} y={25} width={120} height={32} rx={14} fill="#C8553D" />
          <Circle cx={45} cy={25} r={7} fill="#5D5468" /><Circle cx={105} cy={25} r={7} fill="#5D5468" />
          <SvgText x={75} y={104} fontSize={38} fontWeight="bold" fill="#2B2433" textAnchor="middle">{timeUntil(left).split(' ')[0]}</SvgText>
          <SvgText x={75} y={126} fontSize={14} fill="#5D5468" textAnchor="middle">{timeUntil(left).split(' ').slice(1).join(' ') || 'now'}</SvgText>
          <Path d="M32 48 h86" stroke="#FFFFFF" strokeWidth={3} opacity={0.6} />
        </Svg>
        <GText variant="heading" center>{`${se.name}: ${se.theme}`}</GText>
        <GText center soft>{`Opens in about ${timeUntil(left)}`}</GText>
      </Appear>
      <SpeechBubble speaker="saima" mood="happy" text="Great work so far! Towns grow slowly. Come back next week and we will start the next season together." />
      <Panel title="While you wait" icon="map">
        <GText>• Visit the town and see how it has changed.</GText>
        <GText>• Spend grant money to finish more buildings.</GText>
        <GText>• Check your progress and letters.</GText>
      </Panel>
      {anomaly ? <GText variant="small" soft center>Note: the phone's clock was changed. Weeks still open on the normal schedule.</GText> : null}
      {__DEV__ ? (
        <Panel title="Developer testing" icon="gear">
          <GText variant="small">{s.settings.devFastWeeks ? 'Fast weeks are ON: weeks open 2 minutes apart (development builds only).' : 'Turn on fast weeks to test the full loop quickly. Not available in release builds.'}</GText>
          <GameButton size="sm" variant="ghost" label={s.settings.devFastWeeks ? 'Fast weeks: ON' : 'Turn on fast weeks'} onPress={() => act((e) => e.updateSettings({ devFastWeeks: !s.settings.devFastWeeks }))} />
        </Panel>
      ) : null}
      <View style={{ gap: space.sm }}>
        <GameButton label="Visit the town" icon="map" onPress={() => router.replace('/town')} />
        <GameButton label="Main menu" variant="ghost" onPress={() => router.replace('/menu')} />
      </View>
    </Screen>
  );
}

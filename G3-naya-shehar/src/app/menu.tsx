import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Appear } from '@/ui/Layout';
import { GText } from '@/ui/Text';
import { GameButton } from '@/ui/Button';
import { Portrait, lookFromAvatar } from '@/art/Bust';
import { BuildingPreview } from '@/art/BuildingPreview';
import { Emblem } from '@/art/Logo';
import { SpeakButton } from '@/ui/Speak';
import { useGame, useTheme } from '@/state/GameProvider';
import { nextAction } from '@/state/flow';
import { stageOf } from '@/game/world/buildings';
import { elevation, radius, space } from '@/ui/tokens';

export default function Menu() {
  const { engine, s } = useGame();
  const { c, reducedMotion } = useTheme();
  const router = useRouter();
  const n = nextAction(engine);
  const done = [0, 1, 2, 3, 4].filter((w) => s.schedule.completedAt[w as 0] !== undefined).length;
  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Emblem size={56} />
        <View style={{ flex: 1 }}>
          <GText variant="title">Naya Shehar</GText>
          <GText variant="small" soft>{`Chapters complete: ${done} of 5`}</GText>
        </View>
        <SpeakButton text={`Main menu. ${n.detail}. ${n.label}.`} />
      </View>
      <Appear>
        <View style={[{ backgroundColor: c.surface, borderRadius: radius.xl, padding: space.lg, borderWidth: 2, borderColor: c.border, alignItems: 'center', gap: space.sm }, elevation(2)]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            <BuildingPreview id="community_center" stage={stageOf(s.town.progress.community_center)} size={170} night={false} />
            {s.avatar ? <View style={{ marginLeft: -40 }}><Portrait look={lookFromAvatar(s.avatar)} size={96} reducedMotion={reducedMotion} ring={c.bgAlt} /></View> : null}
          </View>
          <GText variant="heading" center>{s.avatar ? `Welcome back, ${s.avatar.nickname}!` : 'Welcome, volunteer!'}</GText>
          <GText center soft>{n.detail}</GText>
          <GameButton style={{ alignSelf: 'stretch' }} label={n.label} icon={n.kind === 'locked' ? 'calendar' : 'play'} size="lg" onPress={() => router.push(n.route)} testID="menu-continue" />
        </View>
      </Appear>
      <Appear delay={120} style={{ gap: space.sm }}>
        <GameButton label="Town map" icon="map" variant="secondary" onPress={() => router.push('/town')} disabled={!s.avatar} testID="menu-town" />
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <GameButton style={{ flex: 1 }} label="Progress" icon="star" variant="ghost" onPress={() => router.push('/progress')} />
          <GameButton style={{ flex: 1 }} label="Settings" icon="gear" variant="ghost" onPress={() => router.push('/settings')} />
        </View>
        {engine.isFinished() ? <GameButton label="My career paths" icon="trophy" variant="ghost" onPress={() => router.push(s.student ? '/results' : '/about-you')} /> : null}
      </Appear>
    </Screen>
  );
}

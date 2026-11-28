import { useMemo } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Panel, Appear } from '@/ui/Layout';
import { GText } from '@/ui/Text';
import { GameButton } from '@/ui/Button';
import { ScreenHeader, SpeechBubble } from '@/ui/Game';
import { Icon } from '@/ui/Icon';
import { Portrait, lookFromAvatar } from '@/art/Bust';
import { useGame, useTheme } from '@/state/GameProvider';
import { recap } from '@/game/story/recap';
import { writeLetter } from '@/game/story/letters';
import { BUILDINGS, stageOf } from '@/game/world/buildings';
import { radius, space } from '@/ui/tokens';

/** Final game summary: what you did, what it showed (only well-supported statements), and the final letter. */
export default function Summary() {
  const { engine, s } = useGame();
  const { c, reducedMotion } = useTheme();
  const router = useRouter();
  const profile = useMemo(() => engine.interestProfile(), [engine]);
  const lines = useMemo(() => recap(profile, engine.abilityProfile()), [engine, profile]);
  const letter = useMemo(() => writeLetter(4, profile, engine.measuredWeeks() > 0, s.avatar?.nickname ?? 'me'), [engine, profile, s.avatar]);
  const stats = [
    ['Activities', s.history.filter((h) => h.kind === 'choice' || h.kind === 'planned').length, 'hands'],
    ['Challenges', s.history.filter((h) => h.kind === 'puzzle').length, 'sparkle'],
    ['Buildings open', BUILDINGS.filter((b) => stageOf(s.town.progress[b.id]) === 4).length, 'home'],
  ] as const;
  return (
    <Screen footer={<GameButton label="Discover your paths" icon="trophy" size="lg" onPress={() => router.push(s.student ? '/results' : '/about-you')} testID="summary-next" />}>
      <ScreenHeader title="Your year in Naya Shehar" onBack={() => router.replace('/menu')} speak={`Your year in Naya Shehar. ${lines.join(' ')}`} />
      <Appear style={{ alignItems: 'center', gap: space.sm }}>
        {s.avatar ? <Portrait look={lookFromAvatar(s.avatar)} expression="proud" size={130} reducedMotion={reducedMotion} ring={c.bgAlt} /> : null}
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {stats.map(([l, v, i]) => (
            <View key={l} style={{ flex: 1, alignItems: 'center', padding: space.sm, borderRadius: radius.md, backgroundColor: c.surface, borderWidth: 2, borderColor: c.border }}>
              <Icon name={i} color={c.primaryDeep} /><GText variant="heading">{String(v)}</GText><GText variant="small" soft center>{l}</GText>
            </View>
          ))}
        </View>
      </Appear>
      <Panel title="What your choices showed" icon="star">
        {lines.map((l) => <View key={l} style={{ flexDirection: 'row', gap: space.sm }}><Icon name="sparkle" size={18} color={c.primaryDeep} /><GText style={{ flex: 1 }}>{l}</GText></View>)}
      </Panel>
      <Panel title="Your final letter" icon="letter" speak={[letter.greeting, ...letter.paragraphs, letter.signoff].join(' ')}>
        <View style={{ backgroundColor: '#FFFBF0', padding: space.md, borderRadius: radius.md, gap: space.sm }}>
          <GText variant="sub" color="#2B2433">{letter.greeting}</GText>
          {letter.paragraphs.map((p) => <GText key={p} color="#2B2433">{p}</GText>)}
          <GText variant="small" color="#5D5468" style={{ textAlign: 'right' }}>{letter.signoff}</GText>
        </View>
      </Panel>
      <SpeechBubble speaker="saima" mood="proud" text="Thank you for everything, volunteer. Before you go, let's look at some paths you might enjoy after school." />
    </Screen>
  );
}

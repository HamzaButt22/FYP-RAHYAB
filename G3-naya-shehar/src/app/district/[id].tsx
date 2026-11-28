import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, Panel, Appear, Pill } from '@/ui/Layout';
import { GText } from '@/ui/Text';
import { ScreenHeader, SpeechBubble } from '@/ui/Game';
import { Icon, DISTRICT_ICON } from '@/ui/Icon';
import { BuildingPreview } from '@/art/BuildingPreview';
import { DISTRICTS, DistrictId, isDistrictUnlocked } from '@/game/world/districts';
import { STAGES, buildingsInDistrict, stageOf } from '@/game/world/buildings';
import { useGame, useTheme } from '@/state/GameProvider';
import { elevation, radius, space } from '@/ui/tokens';

export default function DistrictScreen() {
  const { id } = useLocalSearchParams<{ id: DistrictId }>();
  const { s, engine } = useGame();
  const { c } = useTheme();
  const router = useRouter();
  const d = DISTRICTS.find((x) => x.id === id) ?? DISTRICTS[4];
  const open = isDistrictUnlocked(d.id, engine.reachedWeek());
  const bs = buildingsInDistrict(d.id);
  return (
    <Screen sky={[d.accent, c.bg]}>
      <ScreenHeader title={d.name} speak={`${d.name}. ${d.tagline}. ${d.description}${open ? '' : ` This district opens in week ${d.unlockWeek}.`}`} />
      <Appear>
        <View style={[{ backgroundColor: d.accent, borderRadius: radius.lg, padding: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.md }, elevation(2)]}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={open ? DISTRICT_ICON[d.icon] : 'lock'} size={32} color={d.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <GText variant="heading" color="#FFFFFF">{d.tagline}</GText>
            <GText color="#FFFFFF">{d.description}</GText>
          </View>
        </View>
      </Appear>
      {open ? <SpeechBubble speaker={d.host} mood="happy" text={`Welcome to ${d.name}! Tap any building to see how it is coming along.`} /> : (
        <Panel title="Not open yet" icon="lock">
          <GText>{`${d.name} opens in Week ${d.unlockWeek}. Keep playing and it will appear on your map!`}</GText>
        </Panel>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'space-between' }}>
        {bs.map((b) => {
          const st = stageOf(s.town.progress[b.id]);
          return (
            <Pressable key={b.id} disabled={!open} accessibilityRole="button" accessibilityLabel={`${b.name}. ${STAGES[st]}.`}
              onPress={() => router.push({ pathname: '/building/[id]', params: { id: b.id } })}
              style={({ pressed }) => [{ width: '48.5%', backgroundColor: c.surfaceRaised, borderRadius: radius.md, padding: space.sm, borderWidth: 2, borderColor: c.border, opacity: open ? 1 : 0.6, transform: [{ scale: pressed ? 0.97 : 1 }] }, elevation(1)]}>
              <BuildingPreview id={b.id} stage={st} size={150} />
              <GText variant="bodyBold" numberOfLines={2}>{b.name}</GText>
              <Pill label={STAGES[st]} icon={st === 4 ? 'check' : 'hammer'} color={st === 4 ? '#E4F5E9' : c.bgAlt} textColor="#2B2433" />
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

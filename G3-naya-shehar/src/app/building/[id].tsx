import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Screen, Panel, Appear } from '@/ui/Layout';
import { GText } from '@/ui/Text';
import { GameButton } from '@/ui/Button';
import { Celebration, ScreenHeader } from '@/ui/Game';
import { Icon } from '@/ui/Icon';
import { BuildingPreview } from '@/art/BuildingPreview';
import { BUILDINGS, BuildingId, STAGES, STAGE_THRESHOLDS, stageOf } from '@/game/world/buildings';
import { districtById, isDistrictUnlocked } from '@/game/world/districts';
import { FUND_COST, FUND_PROGRESS, canFund } from '@/game/progression/town';
import { useGame, useTheme } from '@/state/GameProvider';
import { radius, space } from '@/ui/tokens';
import { audio } from '@/services/audio';
import { feedback } from '@/services/feedback';

/** Building card: see its stage, what it does, and spend grant money to build the next stage. */
export default function BuildingScreen() {
  const { id } = useLocalSearchParams<{ id: BuildingId }>();
  const { s, act, engine } = useGame();
  const { c, reducedMotion } = useTheme();
  const b = BUILDINGS.find((x) => x.id === id) ?? BUILDINGS[0];
  const week = engine.reachedWeek();
  const p = s.town.progress[b.id];
  const st = stageOf(p);
  const [celebrate, setCelebrate] = useState(false);
  const bump = useSharedValue(1);
  const art = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));
  const open = isDistrictUnlocked(b.district, week);
  const next = STAGE_THRESHOLDS[Math.min(4, st + 1)];

  const doFund = () => {
    const r = act((e) => e.fundBuilding(b.id));
    if (!r?.ok) return;
    audio.play('build'); feedback.success();
    if (!reducedMotion) bump.value = withSequence(withTiming(0.92, { duration: 120 }), withSpring(1, { damping: 6, stiffness: 220 }));
    if (r.stagedUp) setCelebrate(true);
  };

  return (
    <Screen sky={[districtById(b.district).accent, c.bg]}>
      <ScreenHeader title={b.name} speak={`${b.name}. ${b.purpose} Stage: ${STAGES[st]}. Progress ${p} percent.`} />
      {celebrate ? <Celebration title={st === 4 ? 'Open for everyone!' : `New stage: ${STAGES[st]}`} subtitle={b.name} icon={st === 4 ? 'trophy' : 'hammer'} /> : null}
      <Appear>
        <View style={{ alignItems: 'center', backgroundColor: c.surface, borderRadius: radius.xl, padding: space.md, borderWidth: 2, borderColor: c.border }}>
          <Animated.View style={art}><BuildingPreview id={b.id} stage={st} size={300} /></Animated.View>
          <View accessible accessibilityLabel={`Progress ${p} percent. ${STAGES[st]}.`} style={{ alignSelf: 'stretch', gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <GText variant="bodyBold">{STAGES[st]}</GText>
              <GText variant="bodyBold">{`${p}%`}</GText>
            </View>
            <View style={{ height: 14, borderRadius: 7, backgroundColor: c.border, overflow: 'hidden' }}>
              <View style={{ width: `${p}%`, height: '100%', backgroundColor: c.success }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {STAGES.map((n, i) => <View key={n} style={{ alignItems: 'center', width: 56 }}><Icon name={i <= st ? 'check' : 'lock'} size={16} color={i <= st ? c.success : c.locked} /><GText variant="small" soft center style={{ fontSize: 11, lineHeight: 13 }}>{n}</GText></View>)}
            </View>
          </View>
        </View>
      </Appear>
      <Panel title="What it does" icon="eye"><GText>{b.purpose}</GText></Panel>
      {st < 4 ? (
        <Panel title="Help build it" icon="hammer" speak={`Spend ${FUND_COST} rupees from the town grant to add ${FUND_PROGRESS} progress. You have ${s.town.grant} rupees.`}>
          <GText>{open ? `Spend Rs ${FUND_COST} from the town grant to move the work forward (+${FUND_PROGRESS}%). Next stage at ${next}%.` : 'This district is not open yet.'}</GText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Icon name="coin" color="#D9A02B" /><GText variant="bodyBold">{`You have Rs ${s.town.grant}`}</GText></View>
          <GameButton label={`Fund work · Rs ${FUND_COST}`} icon="coin" disabled={!canFund(s.town, b.id, week)} onPress={doFund} sound={null} testID="fund" />
          {open && s.town.grant < FUND_COST ? <GText variant="small" soft>Earn more grant money by doing activities and challenges in your weekly sessions.</GText> : null}
        </Panel>
      ) : <Panel title="Open!" icon="check"><GText>This building is finished and helping the town every day.</GText></Panel>}
    </Screen>
  );
}

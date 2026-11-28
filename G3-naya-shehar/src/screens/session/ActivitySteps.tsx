import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Riasec, ReactionValue, ScoredWeek } from '@/assessment/types';
import { CHOICE_SCENARIOS, ChoiceOption, PRACTICE_CHOICE } from '@/game/content/choices';
import { plannerForWeek } from '@/game/content/planner';
import { CHARACTERS } from '@/game/characters/characters';
import { BuildingId, STAGES, buildingById, stageOf } from '@/game/world/buildings';
import { REWARD } from '@/game/progression/town';
import { ActivityArt } from '@/art/ActivityArt';
import { BuildingPreview } from '@/art/BuildingPreview';
import { Portrait, lookForCharacter } from '@/art/Bust';
import { MiniGame } from '../minigames';
import { GText } from '@/ui/Text';
import { GameButton } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { Appear, Panel } from '@/ui/Layout';
import { ReactionPicker, SpeechBubble } from '@/ui/Game';
import { SpeakButton } from '@/ui/Speak';
import { useGame, useTheme } from '@/state/GameProvider';
import { elevation, radius, space } from '@/ui/tokens';
import { audio } from '@/services/audio';
import { feedback } from '@/services/feedback';

/** Both choice cards are built by the same component with identical styling. */
function OptionCard({ o, selected, onPress, side }: { o: ChoiceOption; selected: boolean; onPress: () => void; side: 'left' | 'right' }) {
  const { c, reducedMotion } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`${side === 'left' ? 'First' : 'Second'} option: ${o.title}. ${o.text}`}
      onPress={onPress} testID={`option-${side}`}
      style={({ pressed }) => [{ flex: 1, borderRadius: radius.lg, padding: space.sm, gap: 6, backgroundColor: c.surfaceRaised, borderWidth: 3,
        borderColor: selected ? c.primary : c.border, transform: [{ scale: pressed ? 0.97 : selected ? 1.02 : 1 }] }, elevation(selected ? 3 : 1)]}>
      <ActivityArt category={o.category} size={150} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Portrait look={lookForCharacter(o.partner)} size={34} reducedMotion={reducedMotion} />
        <GText variant="label" color={c.secondaryDeep} style={{ flex: 1 }} numberOfLines={1}>{CHARACTERS[o.partner].name}</GText>
      </View>
      <GText variant="bodyBold">{o.title}</GText>
      <GText variant="small" soft>{o.text}</GText>
      {selected ? <View style={{ position: 'absolute', top: -10, right: -6, width: 34, height: 34, borderRadius: 17, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFFFFF' }}><Icon name="check" size={18} color={c.textOnPrimary} /></View> : null}
    </Pressable>
  );
}

/** Town reward after an activity: same amount whichever activity was picked. */
function Reward({ building, progressAdded, grant, onNext }: { building: BuildingId; progressAdded: number; grant: number; onNext: () => void }) {
  const { s } = useGame();
  const { c } = useTheme();
  const def = buildingById(building);
  const stage = stageOf(s.town.progress[building]);
  return (
    <Appear>
      <Panel speak={`${def.name} improved. It is now at stage: ${STAGES[stage]}. You earned ${grant} rupees for the town grant.`}>
        <View style={{ alignItems: 'center' }}>
          <BuildingPreview id={building} stage={stage} size={220} />
          <GText variant="heading" center>{def.name}</GText>
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.xs, flexWrap: 'wrap', justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: c.bgAlt }}><Icon name="hammer" size={18} color={c.primaryDeep} /><GText variant="label">{`${STAGES[stage]} · +${progressAdded}`}</GText></View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: c.bgAlt }}><Icon name="coin" size={18} color="#D9A02B" /><GText variant="label">{`+Rs ${grant}`}</GText></View>
          </View>
          <View style={{ height: 10, alignSelf: 'stretch', marginTop: space.sm, borderRadius: 5, backgroundColor: c.border, overflow: 'hidden' }}>
            <View style={{ width: `${s.town.progress[building]}%`, height: '100%', backgroundColor: c.success }} />
          </View>
        </View>
      </Panel>
      <GameButton style={{ marginTop: space.md }} label="Continue" icon="arrow" onPress={onNext} testID="reward-next" />
    </Appear>
  );
}

type Phase = 'choose' | 'play' | 'react' | 'reward';

/** Forced choice → chosen activity's mini-game → optional reaction → town reward. */
export function ChoiceStep({ scenarioId, left, right, onDone }: { scenarioId: string; left: Riasec; right: Riasec; onDone: () => void }) {
  const { s, act } = useGame();
  const already = s.session?.stepState?.chosen;
  const sc = scenarioId === PRACTICE_CHOICE.id ? PRACTICE_CHOICE : CHOICE_SCENARIOS.find((x) => x.id === scenarioId)!;
  const L = sc.options.find((o) => o.category === left)!;
  const R = sc.options.find((o) => o.category === right)!;
  const [sel, setSel] = useState<Riasec | null>(already ?? null);
  const [phase, setPhase] = useState<Phase>(already ? (s.session?.stepState?.reacted ? 'reward' : 'play') : 'choose');
  const chosen = sc.options.find((o) => o.category === sel);

  if (phase === 'choose') {
    return (
      <View style={{ gap: space.md }}>
        <SpeechBubble speaker={sc.host} text={`${sc.setup} Which would you like to do?`} mood="talk" />
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <OptionCard o={L} side="left" selected={sel === left} onPress={() => { setSel(left); audio.play('select'); feedback.tap(); }} />
          <OptionCard o={R} side="right" selected={sel === right} onPress={() => { setSel(right); audio.play('select'); feedback.tap(); }} />
        </View>
        <GText variant="small" center soft>There is no right or wrong choice. Pick what you would really enjoy.</GText>
        <GameButton label={chosen ? `Let's do it: ${chosen.title}` : 'Choose one'} icon="play" disabled={!sel}
          onPress={() => { act((e) => e.recordChoice(sc.id, [left, right], sel!)); setPhase('play'); }} testID="choice-confirm" />
      </View>
    );
  }
  if (phase === 'play' && chosen) {
    return <MiniGame category={chosen.category} title={chosen.title} partner={chosen.partner} seed={sc.id.length + sc.id.charCodeAt(sc.id.length - 1)} onDone={() => setPhase('react')} />;
  }
  if (phase === 'react' && chosen) {
    const go = (v?: ReactionValue) => { if (v) act((e) => e.recordReaction(sc.id, chosen.category, v)); setPhase('reward'); };
    return <Panel><ReactionPicker onPick={(v) => go(v)} onSkip={() => go()} /></Panel>;
  }
  return <Reward building={sc.building} progressAdded={REWARD.choice.progress} grant={REWARD.choice.grant} onNext={onDone} />;
}

/** One of the three jobs the player planned this week. */
export function PlannedStep({ week, rank, onDone }: { week: ScoredWeek; rank: 0 | 1 | 2; onDone: () => void }) {
  const { s, act } = useGame();
  const { c } = useTheme();
  const set = plannerForWeek(week);
  const cat = s.session?.ranked?.[rank];
  const a = set.activities.find((x) => x.category === cat);
  const [phase, setPhase] = useState<'intro' | 'play' | 'react' | 'reward'>(s.session?.stepState?.done ? 'reward' : 'intro');
  if (!a) return <GameButton label="Continue" onPress={onDone} />;
  if (phase === 'intro') {
    return (
      <View style={{ gap: space.md }}>
        <View style={[{ backgroundColor: c.surface, borderRadius: radius.lg, padding: space.md, borderWidth: 2, borderColor: c.border, gap: space.sm, alignItems: 'center' }, elevation(1)]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' }}>
            <GText variant="label" color={c.primaryDeep} style={{ flex: 1 }}>{`FROM YOUR PLAN · JOB ${rank + 1} OF 3`}</GText>
            <SpeakButton size={40} text={`From your plan: ${a.title}. ${a.text}`} />
          </View>
          <ActivityArt category={a.category} size={260} />
          <GText variant="heading" center>{a.title}</GText>
          <GText center soft>{a.text}</GText>
        </View>
        <GameButton label="Start" icon="play" onPress={() => setPhase('play')} testID="planned-start" />
      </View>
    );
  }
  if (phase === 'play') return <MiniGame category={a.category} title={a.title} partner={a.partner} seed={week * 7 + rank} onDone={() => { act((e) => e.completePlanned(rank)); setPhase('react'); }} />;
  if (phase === 'react') {
    const go = (v?: ReactionValue) => { if (v) act((e) => e.recordReaction(a.id, a.category, v)); setPhase('reward'); };
    return <Panel><ReactionPicker onPick={(v) => go(v)} onSkip={() => go()} /></Panel>;
  }
  return <Reward building={a.building} progressAdded={REWARD.planned.progress} grant={REWARD.planned.grant} onNext={onDone} />;
}

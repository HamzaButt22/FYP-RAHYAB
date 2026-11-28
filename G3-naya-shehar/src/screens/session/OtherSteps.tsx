import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { AbilityFamily, ScoredWeek, Week } from '@/assessment/types';
import { puzzleById } from '@/assessment/abilities/bank';
import { Puzzle } from '@/assessment/abilities/puzzleTypes';
import { PuzzleRunner } from '../puzzles/PuzzleRunner';
import { TownMap, MAP_W, MAP_H, buildingScreenPos } from '@/art/TownMap';
import { BuildingPreview } from '@/art/BuildingPreview';
import { SEASON_PROJECT, meters } from '@/game/progression/town';
import { STAGES, buildingById, stageOf } from '@/game/world/buildings';
import { writeLetter } from '@/game/story/letters';
import { SEASONS } from '@/game/story/dialogue';
import { GText } from '@/ui/Text';
import { GameButton } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { Appear, Panel } from '@/ui/Layout';
import { Celebration, SpeechBubble } from '@/ui/Game';
import { SpeakButton } from '@/ui/Speak';
import { useGame, useTheme } from '@/state/GameProvider';
import { elevation, radius, space } from '@/ui/tokens';
import { audio } from '@/services/audio';
import { timeUntil } from '@/state/flow';

/** Scored puzzle: the staircase picks the item; the result is recorded once. */
export function PuzzleStep({ family, onDone }: { family: AbilityFamily; onDone: () => void }) {
  const { engine, act, s } = useGame();
  const [puzzle] = useState<Puzzle | null>(() => engine.nextPuzzle(family));
  if (!puzzle) return <GameButton label="Continue" onPress={onDone} />;
  return (
    <PuzzleRunner key={puzzle.id} puzzle={puzzle} accessible={s.settings.accessibleMode}
      onComplete={(o) => { act((e) => e.recordPuzzle(puzzle, o.firstAttemptCorrect, o.solved, o.attempts)); onDone(); }} />
  );
}

export function PracticePuzzleStep({ puzzleId, onDone }: { puzzleId: string; onDone: () => void }) {
  const { act, s } = useGame();
  const p = puzzleById(puzzleId)!;
  return (
    <View style={{ gap: space.md }}>
      <SpeechBubble speaker="ayesha" mood="happy" compact text="Let's practise a puzzle! Take your time — there is no clock." />
      <PuzzleRunner key={p.id} puzzle={p} accessible={s.settings.accessibleMode} onComplete={(o) => { act((e) => e.recordPuzzle(p, o.firstAttemptCorrect, o.solved, o.attempts)); onDone(); }} />
    </View>
  );
}

/** Prologue: learn to move around the map and tap a building. */
export function TourStep({ onDone }: { onDone: () => void }) {
  const { s } = useGame();
  const { reducedMotion } = useTheme();
  const [tapped, setTapped] = useState(false);
  const target = buildingScreenPos('community_center');
  return (
    <View style={{ gap: space.md }}>
      <SpeechBubble speaker="bilal" mood="happy" text={tapped ? 'You found the Youth Office! Tap a building any time to see it up close.' : 'This is our town. Drag the map to look around, then tap the Youth Office (the pin)!'} />
      <View style={{ height: 330, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 3, borderColor: '#EAD8BC', backgroundColor: '#BFE6FF' }}>
        <ScrollView horizontal contentOffset={{ x: target.x - 170, y: 0 }} showsHorizontalScrollIndicator={false}>
          <ScrollView contentOffset={{ x: 0, y: target.y - 200 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
            <View style={{ width: MAP_W, height: MAP_H }}>
              <TownMap town={s.town} week={0} season={1} reducedMotion={reducedMotion} highlight={tapped ? [] : ['community_center']}
                onPressBuilding={(id) => { if (id === 'community_center') { setTapped(true); audio.play('success'); } }} />
            </View>
          </ScrollView>
        </ScrollView>
      </View>
      {tapped ? <Appear><GameButton label="Continue" icon="arrow" onPress={onDone} testID="tour-done" /></Appear> : <GText variant="small" center soft>Tip: you can also use the district buttons on the town screen to jump around.</GText>}
    </View>
  );
}

/** Construction & town development: the season's big project is finished in front of the player. */
export function BuildStep({ week, onDone }: { week: Week; onDone: () => void }) {
  const { s, act, engine } = useGame();
  const { c, reducedMotion } = useTheme();
  const id = SEASON_PROJECT[week];
  const def = buildingById(id);
  const startStage = useMemo(() => stageOf(s.town.progress[id]), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [stage, setStage] = useState<0 | 1 | 2 | 3 | 4>(startStage);
  const [built, setBuilt] = useState(startStage === 4);
  const before = useMemo(() => meters(s.town, engine.reachedWeek()), []); // eslint-disable-line react-hooks/exhaustive-deps
  const after = meters(s.town, engine.reachedWeek());
  const shake = useSharedValue(0);
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: Math.sin(shake.value * Math.PI * 6) * 3 }] }));

  const build = () => {
    act((e) => e.finishSeasonProject());
    audio.play('build');
    if (reducedMotion) { setStage(4); setBuilt(true); return; }
    let k = stage;
    const tick = () => {
      k = Math.min(4, k + 1) as typeof k;
      setStage(k);
      shake.value = 0; shake.value = withTiming(1, { duration: 500 });
      if (k < 4) setTimeout(tick, 650); else { setTimeout(() => setBuilt(true), 400); }
    };
    setTimeout(tick, 200);
  };

  return (
    <View style={{ gap: space.md }}>
      {built ? <Celebration title={`${def.name} is open!`} subtitle={def.purpose} icon="trophy" /> : (
        <SpeechBubble speaker={week === 0 ? 'saima' : week === 1 ? 'rafiq' : week === 2 ? 'zoya' : week === 3 ? 'rafiq' : 'kamran'} mood="proud"
          text={`Thanks to everyone's work this week, we can finish the ${def.name} now. Ready?`} />
      )}
      <View style={[{ alignItems: 'center', backgroundColor: c.surface, borderRadius: radius.lg, padding: space.md, borderWidth: 2, borderColor: c.border }, elevation(1)]}>
        <Animated.View style={st}><BuildingPreview id={id} stage={stage} size={280} night={false} /></Animated.View>
        <GText variant="heading">{def.name}</GText>
        <View accessible accessibilityLabel={`Stage ${stage + 1} of 5: ${STAGES[stage]}`} style={{ flexDirection: 'row', gap: 6, marginTop: space.sm }}>
          {STAGES.map((n, i) => (
            <View key={n} style={{ alignItems: 'center', width: 58 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: i <= stage ? c.success : c.border }}>
                {i <= stage ? <Icon name="check" size={16} color="#FFFFFF" /> : <GText variant="label" soft>{i + 1}</GText>}
              </View>
              <GText variant="small" center soft numberOfLines={2} style={{ fontSize: 11, lineHeight: 13 }}>{n}</GText>
            </View>
          ))}
        </View>
      </View>
      {built ? (
        <Appear>
          <Panel title="Town development" icon="home" speak={`Homes rebuilt: ${after.homes}. Happiness: ${after.happiness} percent. Balance: ${after.balance} percent.`}>
            {[['Homes rebuilt', before.homes, after.homes, ''], ['Happiness', before.happiness, after.happiness, '%'], ['Balance', before.balance, after.balance, '%']].map(([l, b, a, u]) => (
              <View key={l as string} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <GText>{l as string}</GText>
                <GText variant="bodyBold">{`${b}${u} → ${a}${u}`}</GText>
              </View>
            ))}
          </Panel>
          <GameButton style={{ marginTop: space.md }} label="Continue" icon="arrow" onPress={onDone} testID="build-next" />
        </Appear>
      ) : <GameButton label="Finish the building!" icon="hammer" size="lg" onPress={build} testID="build-go" />}
    </View>
  );
}

/** Weekly letter from the player's future self. */
export function LetterStep({ week, onDone }: { week: ScoredWeek; onDone: () => void }) {
  const { engine, s } = useGame();
  const { reducedMotion } = useTheme();
  const letter = useMemo(() => writeLetter(week, engine.interestProfile(), !!s.session?.measured, s.avatar?.nickname ?? 'me'), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [open, setOpen] = useState(false);
  const v = useSharedValue(0);
  useEffect(() => { if (open) v.value = reducedMotion ? 1 : withDelay(100, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })); }, [open, reducedMotion, v]);
  const paper = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ translateY: (1 - v.value) * 40 }, { rotate: `${(1 - v.value) * -4}deg` }] }));
  const full = [letter.greeting, ...letter.paragraphs, letter.signoff].join(' ');
  if (!open) {
    return (
      <View style={{ gap: space.lg, alignItems: 'center' }}>
        <SpeechBubble speaker="saima" mood="happy" text="A letter came for you at the post office. It says it's from… you, five years from now!" />
        <Svg width={220} height={150} viewBox="0 0 220 150" accessibilityLabel="A sealed envelope">
          <Rect x={10} y={20} width={200} height={120} rx={10} fill="#FFFBF3" stroke="#C9A26B" strokeWidth={3} />
          <Path d="M10 30 L110 95 L210 30" stroke="#C9A26B" strokeWidth={3} fill="#FCEBD2" />
          <Path d="M110 90 m-16 0 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0" fill="#C8553D" />
          <Path d="M104 90 l5 5 l9 -10" stroke="#FFFFFF" strokeWidth={3} fill="none" />
        </Svg>
        <GameButton label="Open the letter" icon="letter" size="lg" onPress={() => { setOpen(true); audio.play('page'); }} style={{ alignSelf: 'stretch' }} testID="letter-open" />
      </View>
    );
  }
  return (
    <View style={{ gap: space.md }}>
      <Animated.View style={[{ backgroundColor: '#FFFBF0', borderRadius: radius.md, padding: space.xl, gap: space.md, borderWidth: 1, borderColor: '#E6D3B3' }, elevation(2), paper]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <GText variant="label" color="#8B6A4E" style={{ flex: 1 }}>{`${SEASONS[week].name.toUpperCase()} · LETTER ${week} OF 4`}</GText>
          <SpeakButton text={full} size={44} />
        </View>
        <GText variant="heading" color="#2B2433">{letter.greeting}</GText>
        {letter.paragraphs.map((p, i) => <GText key={i} color="#2B2433" style={{ fontSize: 17, lineHeight: 26 }}>{p}</GText>)}
        <GText variant="sub" color="#5D5468" style={{ textAlign: 'right' }}>{letter.signoff}</GText>
      </Animated.View>
      <GText variant="small" center soft>Your letters get clearer as you play more weeks.</GText>
      <GameButton label="Keep it safe" icon="check" onPress={onDone} testID="letter-done" />
    </View>
  );
}

/** Week completion: what you did, and when the next week opens. */
export function CompleteStep({ week, onFinish }: { week: Week; onFinish: () => void }) {
  const { s, engine } = useGame();
  const { c } = useTheme();
  const items = s.history.filter((h) => h.week === week);
  const counts = { choice: items.filter((h) => h.kind === 'choice' || h.kind === 'planned').length, puzzle: items.filter((h) => h.kind === 'puzzle').length };
  const nextAt = week < 4 ? engine.unlockTime((week + 1) as Week) : null;
  const interval = s.settings.devFastWeeks && __DEV__ ? 2 * 60 * 1000 : 7 * 24 * 3600 * 1000;
  const wait = week === 0 ? 0 : interval;
  return (
    <View style={{ gap: space.md }}>
      <Celebration title={week === 0 ? 'Prologue complete!' : `Week ${week} complete!`} subtitle={week === 0 ? 'You are ready for your first real week.' : `${SEASONS[week as ScoredWeek].name} in Naya Shehar is done.`} icon="trophy" />
      <Panel title="This week" icon="star" speak={`This week you did ${counts.choice} activities and ${counts.puzzle} challenges.`}>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {[['Activities', counts.choice, 'hands'], ['Challenges', counts.puzzle, 'sparkle'], ['Grant', `Rs ${s.town.grant}`, 'coin']].map(([l, v, i]) => (
            <View key={l as string} style={{ flex: 1, alignItems: 'center', padding: space.sm, borderRadius: radius.md, backgroundColor: c.bgAlt, gap: 2 }}>
              <Icon name={i as 'hands'} size={24} color={c.primaryDeep} />
              <GText variant="heading">{String(v)}</GText>
              <GText variant="small" soft>{l as string}</GText>
            </View>
          ))}
        </View>
      </Panel>
      {week < 4 ? (
        <Panel title="What's next" icon="calendar" speak={week === 0 ? 'Week 1, Spring, is ready to play now.' : `Week ${week + 1} opens in about ${timeUntil(wait)}. The town needs time to grow!`}>
          <GText>{week === 0 ? 'Week 1 · Spring is ready now. You can start it straight away or come back later.' : `Week ${week + 1} · ${SEASONS[(week + 1) as ScoredWeek].name} opens in about ${timeUntil(wait)}. The town needs time to grow! Come back then.`}</GText>
          {nextAt ? null : null}
        </Panel>
      ) : null}
      <GameButton label={week === 4 ? 'See the whole town' : 'Back to the town'} icon={week === 4 ? 'sparkle' : 'map'} size="lg" onPress={onFinish} testID="week-finish" />
    </View>
  );
}

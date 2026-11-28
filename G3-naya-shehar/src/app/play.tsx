import { useEffect, useRef } from 'react';
import { ScrollView, View, type ScrollViewInstance } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame, useTheme } from '@/state/GameProvider';
import { nextAction, weekTitle } from '@/state/flow';
import { ScoredWeek } from '@/assessment/types';
import { SEASONS } from '@/game/story/dialogue';
import { IconButton } from '@/ui/Button';
import { GText } from '@/ui/Text';
import { Icon } from '@/ui/Icon';
import { StepDots } from '@/ui/Layout';
import { space, radius } from '@/ui/tokens';
import { SeasonIntro } from '@/screens/session/SeasonIntro';
import { DialogueStep } from '@/screens/session/DialogueStep';
import { PlannerStep } from '@/screens/session/PlannerStep';
import { ChoiceStep, PlannedStep } from '@/screens/session/ActivitySteps';
import { BuildStep, CompleteStep, LetterStep, PracticePuzzleStep, PuzzleStep, TourStep } from '@/screens/session/OtherSteps';

/** Runs the current week's session one step at a time. Progress is saved after every step. */
export default function Play() {
  const { engine, s, act } = useGame();
  const { c, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollViewInstance>(null);

  // Start (or resume) the right week on entry.
  useEffect(() => {
    if (s.session) return;
    const n = nextAction(engine);
    if (n.kind === 'start' && n.week !== null) act((e) => e.startOrResume(n.week!));
    else router.replace(n.route === '/play' ? '/town' : n.route);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const se = s.session;
  const step = se ? engine.currentStep() : null;
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [se?.stepIndex]);
  if (!se || !step) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  const total = engine.plan().length;
  const next = () => act((e) => e.advance());
  const week = se.week;
  const sky: [string, string] = week === 0 ? ['#FFE3B8', c.bg] : isDark ? ['#2A2442', c.bg] : [SEASONS[week as ScoredWeek].sky[0], c.bg];

  const body = (() => {
    switch (step.kind) {
      case 'season': return <SeasonIntro week={week as ScoredWeek} onNext={next} />;
      case 'dialogue': return <DialogueStep script={step.script} onDone={next} />;
      case 'tour': return <TourStep onDone={next} />;
      case 'planner': return <PlannerStep week={week as ScoredWeek} onCommit={(r) => { act((e) => e.commitPlan(r)); next(); }} />;
      case 'choice': return <ChoiceStep scenarioId={step.scenarioId} left={step.left} right={step.right} onDone={next} />;
      case 'planned': return <PlannedStep week={week as ScoredWeek} rank={step.rank} onDone={next} />;
      case 'puzzle': return <PuzzleStep family={step.family} onDone={next} />;
      case 'practice_puzzle': return <PracticePuzzleStep puzzleId={step.puzzleId} onDone={next} />;
      case 'build': return <BuildStep week={week} onDone={next} />;
      case 'letter': return <LetterStep week={week as ScoredWeek} onDone={next} />;
      case 'complete': return <CompleteStep week={week} onFinish={() => { act((e) => e.completeSession()); router.replace(week === 4 ? '/reveal' : '/town'); }} />;
    }
  })();

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 260, backgroundColor: sky[0], opacity: 0.55 }} />
      <View style={{ paddingTop: insets.top + space.sm, paddingHorizontal: space.md, paddingBottom: space.sm, flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <IconButton icon="pause" label="Pause" tone="primary" onPress={() => router.push('/pause')} testID="pause" />
        <View style={{ flex: 1, gap: 4 }}>
          <GText variant="label" numberOfLines={1}>{weekTitle(week).toUpperCase()}</GText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <StepDots index={se.stepIndex} total={total} />
            {!se.measured && week > 0 ? <View accessible accessibilityLabel="Accessible mode: this week is not measured" style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, borderRadius: radius.pill, backgroundColor: c.bgAlt }}><Icon name="access" size={14} color={c.text} /><GText variant="label" style={{ fontSize: 11 }}>PRACTICE MODE</GText></View> : null}
          </View>
        </View>
        <View accessible accessibilityLabel={`Grant: ${s.town.grant} rupees`} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 36, borderRadius: radius.pill, backgroundColor: c.surfaceRaised, borderWidth: 2, borderColor: c.border }}>
          <Icon name="coin" size={18} color="#D9A02B" />
          <GText variant="label">{s.town.grant}</GText>
        </View>
      </View>
      <ScrollView ref={scroll} contentContainerStyle={{ padding: space.md, paddingBottom: insets.bottom + space.xxl, gap: space.md }} keyboardShouldPersistTaps="handled">
        <View key={`${week}-${se.stepIndex}`}>{body}</View>
      </ScrollView>
    </View>
  );
}

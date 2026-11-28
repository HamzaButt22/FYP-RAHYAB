import { useState } from 'react';
import { View } from 'react-native';
import { Puzzle } from '@/assessment/abilities/puzzleTypes';
import { Answer, checkAnswer } from '@/assessment/abilities/staircase';
import { GText } from '@/ui/Text';
import { SpeakButton } from '@/ui/Speak';
import { GameButton } from '@/ui/Button';
import { Appear, Pill } from '@/ui/Layout';
import { Icon } from '@/ui/Icon';
import { useTheme } from '@/state/GameProvider';
import { elevation, radius, space } from '@/ui/tokens';
import { audio } from '@/services/audio';
import { feedback } from '@/services/feedback';
import { ABILITY_NAMES } from '@/assessment/recommendations/rules';
import { FitView } from './FitView';
import { SequenceView } from './SequenceView';
import { NumericView } from './NumericView';
import { ChoiceView } from './ChoiceView';
import { RouteView } from './RouteView';

export const MAX_ATTEMPTS = 3;

export interface PuzzleOutcome { firstAttemptCorrect: boolean; solved: boolean; attempts: number }

export interface ViewProps<P extends Puzzle> {
  puzzle: P;
  onAnswer: (a: Answer) => void;
  /** Wrong answers tried so far (index answers), so they can be shown as tried. */
  tried: number[];
  locked: boolean;
  reveal: boolean;
  solved: boolean;
  accessible: boolean;
}

/**
 * Runs one puzzle. No timers, no countdowns: the player can take as long as they like.
 * The FIRST attempt is what counts for measurement; later attempts are for learning.
 */
export function PuzzleRunner({ puzzle, onComplete, accessible }: { puzzle: Puzzle; onComplete: (o: PuzzleOutcome) => void; accessible: boolean }) {
  const { c } = useTheme();
  const [attempts, setAttempts] = useState(0);
  const [first, setFirst] = useState<boolean | null>(null);
  const [solved, setSolved] = useState(false);
  const [tried, setTried] = useState<number[]>([]);
  const [message, setMessage] = useState<{ tone: 'good' | 'retry' | 'reveal'; text: string } | null>(null);
  const finished = solved || attempts >= MAX_ATTEMPTS;

  const onAnswer = (a: Answer) => {
    if (finished) return;
    const r = checkAnswer(puzzle, a);
    const n = attempts + 1;
    setAttempts(n);
    if (first === null) setFirst(r.correct);
    if (r.correct) {
      setSolved(true);
      audio.play('success'); feedback.success();
      setMessage({ tone: 'good', text: r.detail ? `Brilliant! ${r.detail.yours} blocks — the shortest route!` : 'Brilliant! That’s right.' });
    } else {
      if (a.kind === 'index') setTried((t) => [...t, a.value]);
      audio.play('gentle', 0.5);
      const extra = r.detail ? ` Your route is ${r.detail.yours} blocks; a shorter one exists.` : '';
      setMessage(n >= MAX_ATTEMPTS
        ? { tone: 'reveal', text: `Good effort! Here is the answer, so you can see how it works.${extra}` }
        : { tone: 'retry', text: `Not quite — have another look. Take your time.${extra}` });
    }
  };

  const stars = '★'.repeat(puzzle.level) + '☆'.repeat(4 - puzzle.level);
  const common = { onAnswer, tried, locked: finished, reveal: !solved && attempts >= MAX_ATTEMPTS, solved, accessible };
  const view = (() => {
    switch (puzzle.kind) {
      case 'fit': return <FitView puzzle={puzzle} {...common} />;
      case 'sequence': return <SequenceView puzzle={puzzle} {...common} />;
      case 'numeric': return <NumericView puzzle={puzzle} {...common} />;
      case 'choice': return <ChoiceView puzzle={puzzle} {...common} />;
      case 'route': return <RouteView puzzle={puzzle} {...common} />;
    }
  })();

  return (
    <View style={{ gap: space.md }}>
      <View style={[{ backgroundColor: c.surface, borderRadius: radius.lg, padding: space.md, borderWidth: 2, borderColor: c.border, gap: space.xs }, elevation(1)]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Pill label={puzzle.practice ? 'PRACTICE' : `${ABILITY_NAMES[puzzle.family].toUpperCase()} CHALLENGE`} icon="sparkle" />
          <GText variant="label" soft accessibilityLabel={`Difficulty ${puzzle.level} of 4`} style={{ flex: 1, textAlign: 'right' }}>{stars}</GText>
        </View>
        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
          <View style={{ flex: 1, gap: 2 }}>
            <GText soft>{puzzle.story}</GText>
            <GText variant="sub">{puzzle.prompt}</GText>
          </View>
          <SpeakButton text={`${puzzle.story} ${puzzle.prompt}`} size={44} />
        </View>
      </View>
      {view}
      {message ? (
        <Appear from={8}>
          <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderRadius: radius.md, borderWidth: 2,
            backgroundColor: message.tone === 'good' ? '#E4F5E9' : '#FFF3E0', borderColor: message.tone === 'good' ? c.success : c.primary }}>
            <Icon name={message.tone === 'good' ? 'check' : message.tone === 'reveal' ? 'eye' : 'search'} size={26} color={message.tone === 'good' ? c.success : c.primaryDeep} />
            <GText style={{ flex: 1 }} color="#2B2433">{message.text}</GText>
          </View>
        </Appear>
      ) : null}
      {finished ? (
        <GameButton label="Continue" icon="arrow" onPress={() => onComplete({ firstAttemptCorrect: !!first, solved, attempts })} testID="puzzle-continue" />
      ) : null}
    </View>
  );
}

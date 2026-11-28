import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { GText } from '@/ui/Text';
import { Icon } from '@/ui/Icon';
import { useTheme } from '@/state/GameProvider';
import { elevation, radius, space } from '@/ui/tokens';
import { feedback } from '@/services/feedback';

const LETTERS = ['A', 'B', 'C', 'D'];

/** 2×2 grid of picture answers. Tried-and-wrong answers are crossed out (shape + text, not colour alone). */
export function OptionGrid({ count, render, labels, onPick, tried, locked, answer, reveal, solved }: {
  count: number; render: (i: number) => ReactNode; labels: string[]; onPick: (i: number) => void;
  tried: number[]; locked: boolean; answer: number; reveal: boolean; solved: boolean;
}) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center' }}>
      {Array.from({ length: count }, (_, i) => {
        const wrong = tried.includes(i);
        const right = (solved || reveal) && i === answer;
        return (
          <Pressable key={i} accessibilityRole="button" accessibilityLabel={`Option ${LETTERS[i]}: ${labels[i]}${wrong ? ', tried, not correct' : ''}${right ? ', correct answer' : ''}`}
            disabled={locked || wrong} onPress={() => { feedback.tap(); onPick(i); }}
            style={({ pressed }) => [{ width: '47%', minHeight: 110, borderRadius: radius.md, padding: space.sm, alignItems: 'center', justifyContent: 'center', gap: 4,
              backgroundColor: right ? '#E4F5E9' : c.surfaceRaised, borderWidth: 3, borderColor: right ? c.success : wrong ? c.locked : c.border,
              opacity: wrong ? 0.5 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }, elevation(1)]}>
            <View style={{ position: 'absolute', top: 6, left: 8, flexDirection: 'row', gap: 4, alignItems: 'center' }}>
              <GText variant="label" soft>{LETTERS[i]}</GText>
              {wrong ? <Icon name="close" size={16} color={c.locked} /> : right ? <Icon name="check" size={16} color={c.success} /> : null}
            </View>
            {render(i)}
          </Pressable>
        );
      })}
    </View>
  );
}

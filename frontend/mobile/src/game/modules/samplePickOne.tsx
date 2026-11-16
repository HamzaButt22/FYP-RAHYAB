// A sample module that shows every part of the contract in one small screen. It is NOT game content:
// the real modules (the week loop, the story, the task families) are Zahid's to design.
//
// It shows how a module: reads the context (the week, practice, the step's params), uses its saved
// progress, sends agreed events (scene_start, choice_made), tries an idea with host.experiment(), and
// finishes. Copy it as a starting point; nothing here limits what a real module looks like.
//
// Params (contract 1.1.0): { left, right, item } = the two interest types to offer, in screen order, and the
// item id. The sample week plan (samplePlan.ts) sets them from the pairs.json schedule. Without params (the
// game lab) it offers R and S in a random order.

import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, touchMin } from '@/theme/tokens';
import { CONTRACT_VERSION, type GameModule, type GameModuleProps } from '../contract.ts';

// A module brings its own words.
const TEXT = {
  note: 'A sample to test the game–app contract, not real game content.',
  again: 'You have played this sample before.',
  prompt: 'Which would you rather do this Saturday?',
  R: 'Fix the radio at home',
  I: 'Find out why the sky is blue',
  A: 'Design a poster for school',
  S: 'Help a friend study',
  E: 'Run the class food stall',
  C: 'Keep the class accounts in order',
  done: 'Done',
} as const;

type Option = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
const TYPES: readonly string[] = ['R', 'I', 'A', 'S', 'E', 'C'];

function SamplePickOne({ context, host, saved }: GameModuleProps) {
  const { colors } = useTheme();
  const text = TEXT;
  const { left, right, item: itemParam } = context.params ?? {};
  const item = typeof itemParam === 'string' ? itemParam : 'sample_pick_one';
  // From the week plan (its schedule already swaps sides between rounds), or, without params, a random
  // order, so the side a student taps can't decide the answer for them.
  const [order] = useState<Option[]>(() =>
    typeof left === 'string' && typeof right === 'string' && TYPES.includes(left) && TYPES.includes(right)
      ? [left as Option, right as Option]
      : Math.random() < 0.5
        ? ['R', 'S']
        : ['S', 'R']
  );
  const [picked, setPicked] = useState<Option | null>(null);
  const changes = useRef(0);
  const shownAt = useRef(0);
  const playedBefore = typeof saved === 'object' && saved !== null && !Array.isArray(saved) && saved.seen === true;

  useEffect(() => {
    shownAt.current = Date.now();
    host.emit({ type: 'scene_start', itemId: item, data: { scene_id: item } });
    host.save({ seen: true });
  }, [host, item]);

  const choose = (option: Option) => {
    if (picked !== null && picked !== option) changes.current += 1;
    setPicked(option);
  };

  const done = () => {
    if (picked === null) return;
    const index = order.indexOf(picked);
    const side = index === 0 ? 'left' : 'right';
    host.emit({
      type: 'choice_made',
      itemId: item,
      data: { pair: `${order[0]}-${order[1]}`, picked, side, dwell_ms: Date.now() - shownAt.current },
    });
    // An idea that is not an agreed measurement yet: kept on the phone, never uploaded.
    host.experiment({ name: 'changed_mind', data: { count: changes.current } });
    host.finish({ completed: true });
  };

  return (
    <View style={styles.column}>
      <AppText variant="caption" color="secondaryText">
        {text.note}
      </AppText>
      {playedBefore ? <AppText color="muted">{text.again}</AppText> : null}
      <AppText variant="heading" accessibilityRole="header">
        {text.prompt}
      </AppText>
      <View style={styles.row}>
        {order.map((option) => {
          const on = picked === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => choose(option)}
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: on ? colors.primary : colors.border },
                on && styles.cardOn,
              ]}
            >
              <AppText variant="title" align="center">
                {text[option]}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <Button label={text.done} onPress={done} disabled={picked === null} />
    </View>
  );
}

export const samplePickOne: GameModule = {
  id: 'sample-pick-one',
  version: '2.0.0',
  kind: 'scene',
  measures: ['interests'],
  title: 'Sample: pick one',
  contract: CONTRACT_VERSION,
  Screen: SamplePickOne,
};

const styles = StyleSheet.create({
  column: { gap: space[4] },
  row: { flexDirection: 'row', gap: space[3] },
  card: {
    flex: 1,
    minHeight: touchMin * 2,
    borderWidth: 2,
    borderRadius: radius.lg,
    padding: space[4],
    justifyContent: 'center',
  },
  cardOn: { borderWidth: 3 },
});

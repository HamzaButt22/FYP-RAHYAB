// A sample module that shows every part of the contract in one small screen. It is NOT game content:
// the real modules (the week loop, the story, the task families) are Zahid's to design.
//
// It shows how a module: reads the context (language, right-to-left), uses its saved
// progress, sends agreed events (scene_start, choice_made), tries an idea with host.experiment(), and
// finishes. Copy it as a starting point; nothing here limits what a real module looks like.

import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, touchMin } from '@/theme/tokens';
import { CONTRACT_VERSION, type GameModule, type GameModuleProps } from '../contract.ts';

// A module brings its own words. Urdu still needs a native speaker's review (like the rest of the app).
const TEXT = {
  en: {
    note: 'A sample to test the game–app contract, not real game content.',
    again: 'You have played this sample before.',
    prompt: 'Which would you rather do this Saturday?',
    R: 'Fix the radio at home',
    S: 'Help a friend study',
    done: 'Done',
  },
  ur: {
    note: 'یہ کھیل اور ایپ کے رابطے کو جانچنے کا نمونہ ہے، اصل کھیل نہیں۔',
    again: 'آپ یہ نمونہ پہلے کھیل چکے ہیں۔',
    prompt: 'اس ہفتے کو آپ کیا کرنا پسند کریں گے؟',
    R: 'گھر کا ریڈیو ٹھیک کرنا',
    S: 'دوست کو پڑھائی میں مدد دینا',
    done: 'ہو گیا',
  },
} as const;

type Option = 'R' | 'S';

function SamplePickOne({ context, host, saved }: GameModuleProps) {
  const { colors } = useTheme();
  const text = TEXT[context.locale];
  // Shown in a random order, so the side a student taps can't decide the answer for them.
  const [order] = useState<Option[]>(() => (Math.random() < 0.5 ? ['R', 'S'] : ['S', 'R']));
  const [picked, setPicked] = useState<Option | null>(null);
  const changes = useRef(0);
  const shownAt = useRef(0);
  const playedBefore = typeof saved === 'object' && saved !== null && !Array.isArray(saved) && saved.seen === true;

  useEffect(() => {
    shownAt.current = Date.now();
    host.emit({ type: 'scene_start', itemId: 'sample_pick_one', data: { scene_id: 'sample_pick_one' } });
    host.save({ seen: true });
  }, [host]);

  const choose = (option: Option) => {
    if (picked !== null && picked !== option) changes.current += 1;
    setPicked(option);
  };

  const done = () => {
    if (picked === null) return;
    const index = order.indexOf(picked);
    // In Urdu the row is mirrored, so the first option is on the right.
    const side = (index === 0) !== context.rtl ? 'left' : 'right';
    host.emit({
      type: 'choice_made',
      itemId: 'sample_pick_one',
      data: { pair: 'R-S', picked, side, dwell_ms: Date.now() - shownAt.current },
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
  version: '1.0.0',
  kind: 'scene',
  measures: ['interests'],
  title: { en: 'Sample: pick one', ur: 'نمونہ: ایک چنیں' },
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

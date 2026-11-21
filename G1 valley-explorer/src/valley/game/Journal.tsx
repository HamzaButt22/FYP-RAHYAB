/**
 * Traveller's Journal: after each stop, 2–3 short "How much is this like you?" statements (Mini-IPIP),
 * one at a time. Answer buttons are neutral (growing dots, no happy/sad faces) so no answer looks "better".
 * Skipping is always allowed. Answers earn no coins, so there is no reason to rush.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ANSWER_LABELS, BIG5_BY_ID } from '../core/bigfive/items';
import { Button, Card, Tap } from '../ui/components';
import { UstadMehr } from '../ui/icons';
import { colors, radius, space, TOUCH, type, useContentWidth, useLandscape } from '../ui/theme';

export function Journal({ items, first, onAnswer, onDone }: {
  items: string[];
  /** true for the very first journal page of the journey (longer explanation) */
  first: boolean;
  onAnswer: (itemId: string, answer: number | null, responseMs: number) => Promise<void> | void;
  onDone: () => void;
}) {
  const insets = useSafeAreaInsets();
  const landscape = useLandscape();
  const maxWidth = useContentWidth();
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const shownAt = useRef(0);
  const [fade] = useState(() => new Animated.Value(1));
  useEffect(() => {
    shownAt.current = Date.now();
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [index, fade]);

  const done = index >= items.length;
  const item = done ? null : BIG5_BY_ID[items[index]];

  const answer = async (a: number | null) => {
    if (!item || busy) return;
    setBusy(true);
    await onAnswer(item.id, a, Math.max(0, Date.now() - shownAt.current));
    setBusy(false);
    setIndex((i) => i + 1);
  };

  const intro = done ? 'Thank you! Your journal page is saved.'
    : first ? 'Before you go on, write a quick journal page. How much is each sentence like you? There are no right or wrong answers, and nothing here is marked. Answer about how you usually are.'
      : 'A quick journal page. How much is each sentence like you? There are no right or wrong answers.';
  const mehr = (
    <Card style={{ flexDirection: 'row', gap: space.md, alignItems: 'center', padding: landscape ? space.sm : undefined }}>
      <UstadMehr size={landscape ? 36 : 44} />
      <Text style={[landscape ? type.small : type.body, { flex: 1 }]}>{intro}</Text>
    </Card>
  );
  const answers = item ? (
    <View style={{ gap: space.sm }}>
      {ANSWER_LABELS.map((label, k) => (
        <Tap key={label} testID={`journal-answer-${k + 1}`} disabled={busy} dim={false} onPress={() => answer(k + 1)}
          accessibilityLabel={`${label} (${k + 1} of 5)`} style={st.answer}>
          <View style={st.scale}>{[0, 1, 2, 3, 4].map((j) => <View key={j} style={[st.pip, j <= k && st.pipOn]} />)}</View>
          <Text style={[type.body, { flex: 1 }]}>{label}</Text>
        </Tap>
      ))}
    </View>
  ) : null;
  const statement = item ? (
    <>
      <View style={st.dots} accessibilityLabel={`Sentence ${index + 1} of ${items.length}`}>
        {items.map((id, k) => <View key={id} style={[st.dot, k < index && st.dotDone, k === index && st.dotNow]} />)}
      </View>
      <Text style={st.statement} testID="journal-statement">{item.text}</Text>
      {item.gloss ? <Text style={[type.small, { textAlign: 'center' }]}>{item.gloss}</Text> : null}
    </>
  ) : null;
  const skip = <Button label="Skip this sentence" variant="ghost" onPress={() => answer(null)} disabled={busy} testID="journal-skip" />;
  const saved = (
    <View style={[st.page, { alignItems: 'center' }]}>
      <View style={st.stamp}><Text style={st.stampText}>✓</Text></View>
      <Text style={[type.subtitle, { textAlign: 'center' }]}>Journal page saved</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#E9DDC4', paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }}>
      <ScrollView contentContainerStyle={{ padding: landscape ? space.md : space.lg, gap: space.md, alignItems: 'center', flexGrow: 1 }}>
        <View style={{ width: '100%', maxWidth, gap: landscape ? space.sm : space.md }}>
          <Text style={[landscape ? type.subtitle : type.title, { textAlign: 'center' }]}>Traveller’s Journal</Text>
          {landscape && item ? (
            // landscape: the sentence on the left, all five answers on the right — nothing to scroll
            <View style={{ flexDirection: 'row', gap: space.md }}>
              <View style={{ flex: 1, gap: space.sm }}>
                {mehr}
                <Animated.View style={[st.page, { opacity: fade, flex: 1, justifyContent: 'center' }]}>{statement}{skip}</Animated.View>
              </View>
              <Animated.View style={{ flex: 1, opacity: fade, justifyContent: 'center' }}>{answers}</Animated.View>
            </View>
          ) : (
            <>
              {mehr}
              {item ? (
                <Animated.View style={[st.page, { opacity: fade }]}>
                  {statement}
                  <View style={{ marginTop: space.sm }}>{answers}</View>
                  {skip}
                </Animated.View>
              ) : saved}
            </>
          )}
        </View>
      </ScrollView>
      {done ? (
        <View style={{ padding: space.md, paddingBottom: Math.max(insets.bottom, space.md), alignItems: 'center' }}>
          <View style={{ width: '100%', maxWidth }}><Button label="Back to the valley" onPress={onDone} testID="journal-done" /></View>
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  page: { backgroundColor: '#FFFBF2', borderRadius: radius.lg, padding: space.lg, gap: space.sm, borderWidth: 1, borderColor: '#D8C6A3' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D8C6A3' },
  dotDone: { backgroundColor: colors.primary },
  dotNow: { backgroundColor: colors.accent },
  statement: { ...type.title, textAlign: 'center', marginVertical: space.sm },
  answer: { minHeight: TOUCH, flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 2, borderColor: colors.border, paddingHorizontal: space.md },
  scale: { flexDirection: 'row', gap: 3, width: 70 },
  pip: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border },
  pipOn: { backgroundColor: colors.primary },
  stamp: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  stampText: { color: '#FFFFFF', fontSize: 36, fontWeight: '800' },
});

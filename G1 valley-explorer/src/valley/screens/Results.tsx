/**
 * Student-facing summary. Plain language, no percentiles, no numeric scores, no labels like "introvert",
 * no career verdicts: fields are offered as ideas to explore. The structured output goes to RahYaab separately via adapter.onComplete.
 */
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import type { StudentSummary } from '../core/summary';
import { Button, Card, Guide, LevelHeader, Screen } from '../ui/components';
import { CheckIcon } from '../ui/icons';
import { colors, radius, space, type } from '../ui/theme';

export function Results({ summary, syncText, onDone }: { summary: StudentSummary; syncText: string; onDone: () => void }) {
  const { interests } = summary;
  return (
    <Screen footer={<Button label="Back to RahYaab" onPress={onDone} testID="results-done" />}>
      <LevelHeader title="Your journey summary" />
      <Guide>Thank you, traveller. Here is what I noticed. Remember: this is a starting point, not a final answer.</Guide>

      <Text style={type.title} accessibilityRole="header">What you enjoyed</Text>
      <Card style={{ gap: space.md }}>
        <Text style={type.body}>{interests.note}</Text>
        {interests.top.map((l, i) => (
          <View key={l.code} style={{ gap: 6 }}>
            <Text style={type.subtitle}>{i + 1}. {l.name}</Text>
            <Bar value={l.score / 100} />
            <Text style={type.small}>{l.text}</Text>
          </View>
        ))}
      </Card>

      <Text style={type.title} accessibilityRole="header">How you usually are</Text>
      <Card style={{ gap: space.md }} testID="results-personality">
        <Text style={type.body}>{summary.personality.note}</Text>
        {summary.personality.lines.map((l) => (
          <View key={l.trait} style={{ gap: 2 }}>
            <Text style={type.subtitle}>{l.name}</Text>
            <Text style={type.body}>{l.text}</Text>
          </View>
        ))}
      </Card>

      <Text style={type.title} accessibilityRole="header">Ideas to explore</Text>
      <Card style={{ gap: space.md }} testID="results-advice">
        {summary.advice.fields.length ? (
          <>
            <Text style={type.body}>People who enjoy the same kinds of activities often look at fields like these. They are ideas to find out more about, not a decision.</Text>
            {summary.advice.fields.map((f) => (
              <View key={f.code} style={{ gap: 2 }}>
                <Text style={type.subtitle}>{f.name}</Text>
                <Text style={type.body}>{f.examples}</Text>
              </View>
            ))}
          </>
        ) : <Text style={type.body}>Your interests were spread across many areas, so there is no short list yet. Visiting a few different workplaces or trying a short course can help you find out more.</Text>}
        {summary.advice.agreements.map((t) => <View key={t} style={st.agree}><Text style={type.body}>{t}</Text></View>)}
        {summary.advice.ways.length ? (
          <View style={{ gap: space.xs }}>
            <Text style={type.subtitle}>How you might like to work</Text>
            {summary.advice.ways.map((w) => <Text key={w} style={type.body}>• {w}</Text>)}
          </View>
        ) : null}
      </Card>

      <Text style={type.title} accessibilityRole="header">Puzzles you solved</Text>
      <Card style={{ gap: space.md }}>
        {summary.abilities.map((a) => (
          <View key={a.family} style={{ gap: 2 }}>
            <Text style={type.subtitle}>{a.name}</Text>
            <Text style={type.body}>{a.text}</Text>
          </View>
        ))}
        <Text style={type.small}>These are counts from a few puzzles today, not a grade. A tired day, a slow phone or new kinds of puzzles all make a difference.</Text>
      </Card>

      <Card tone="soft" style={{ gap: space.sm }}>
        {summary.reminders.map((r) => (
          <View key={r} style={{ flexDirection: 'row', gap: space.sm }}><CheckIcon size={18} /><Text style={[type.body, { flex: 1 }]}>{r}</Text></View>
        ))}
      </Card>
      <Text style={[type.small, { textAlign: 'center' }]}>{syncText}</Text>
    </Screen>
  );
}

function Bar({ value }: { value: number }) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => { Animated.timing(v, { toValue: Math.max(0.04, Math.min(1, value)), duration: 600, useNativeDriver: false }).start(); }, [v, value]);
  return (
    <View style={st.track} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[st.fill, { width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
    </View>
  );
}

const st = StyleSheet.create({
  track: { height: 10, borderRadius: radius.pill, backgroundColor: colors.border, overflow: 'hidden' },
  agree: { backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: space.md },
  fill: { height: 10, borderRadius: radius.pill, backgroundColor: colors.accent },
});

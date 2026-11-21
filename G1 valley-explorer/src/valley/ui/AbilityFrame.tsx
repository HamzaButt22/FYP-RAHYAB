/**
 * Shared game shell for the four puzzle levels: themed scene, HUD, one optional hint, skip, a themed
 * "try it" button and kind feedback. Feedback never says "wrong" or "fail"; skipping is a normal option.
 */
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AbilityState } from '../core/levels/abilityLevel';
import { Hud } from '../game/Hud';
import { Banner, Button, Card, Pill, Sheet } from './components';
import { BulbIcon, UstadMehr } from './icons';
import { colors, space, type, useContentWidth } from './theme';

export function AbilityFrame({ title, state, scoredCount, practice, hint, intro, canSubmit, onSubmit, onHint, onSkip, onNext, onRetry, onBack, explanation, children, scene = colors.parchment, submitLabel = 'Check answer', coins, solvedArt }: {
  title: string; state: AbilityState; scoredCount: number; practice: boolean; hint: string; intro?: string; canSubmit: boolean;
  onSubmit: () => void; onHint: () => void; onSkip: () => void; onNext: () => void; onRetry: () => void; onBack: () => void;
  explanation: string; children: React.ReactNode; scene?: string; submitLabel?: string; coins?: number; solvedArt?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const maxWidth = useContentWidth();
  const label = practice ? 'Practice puzzle (not counted)' : `Puzzle ${state.index} of ${scoredCount}`;
  const fb = state.phase === 'feedback';
  const isLast = state.index === scoredCount;

  let fbTitle = 'Answer saved';
  let fbText = explanation;
  if (state.lastSkipped) { fbTitle = 'Skipped — no problem'; fbText = `Here is how it works: ${explanation}`; }
  else if (state.lastCorrect) fbTitle = practice ? 'That’s it!' : 'Solved!';
  else if (practice) { fbTitle = 'Not quite — have another go'; fbText = 'Practice puzzles can be tried again. Use the hint if you like.'; }
  else { fbTitle = 'Not this one'; fbText = `Here is how it works: ${explanation}`; }

  return (
    <View style={{ flex: 1, backgroundColor: scene, paddingTop: insets.top }}>
      <Hud title={title} sub={label} coins={coins} onBack={onBack} backLabel="Back to the valley (progress saved)" right={practice ? <Pill text="PRACTICE" tone="accent" /> : undefined} />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, alignItems: 'center' }}>
        <View style={{ width: '100%', maxWidth, gap: space.md }}>
          {intro && practice ? (
            <Card style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}><UstadMehr size={44} /><Text style={[type.body, { flex: 1 }]}>{intro}</Text></Card>
          ) : null}
          {children}
          {state.hints > 0 ? <Banner tone="info" text={`Hint: ${hint}`} /> : (
            <Button label="Show a hint" variant="ghost" icon={<BulbIcon />} onPress={onHint} disabled={fb} testID="item-hint" />
          )}
        </View>
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: space.sm, padding: space.md, paddingBottom: Math.max(insets.bottom, space.md), backgroundColor: colors.parchment, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Button label="Skip" variant="secondary" onPress={onSkip} disabled={fb} style={{ flex: 1 }} testID="item-skip" />
        <Button label={submitLabel} variant="accent" onPress={onSubmit} disabled={!canSubmit || fb} style={{ flex: 2 }} testID="item-submit" />
      </View>
      <Sheet visible={fb} title={fbTitle} actions={
        practice && !state.lastCorrect && !state.lastSkipped
          ? <Button label="Try again" onPress={onRetry} testID="item-retry" />
          : <Button label={isLast ? 'Finish' : practice ? 'Start the real puzzles' : 'Next puzzle'} onPress={onNext} testID="item-next" />
      }>
        {state.lastCorrect && solvedArt ? <View style={{ alignItems: 'center', marginBottom: space.sm }}>{solvedArt}</View> : null}
        <Text style={type.body}>{fbText}</Text>
      </Sheet>
    </View>
  );
}

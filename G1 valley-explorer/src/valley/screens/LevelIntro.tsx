import React from 'react';
import { Text, View } from 'react-native';
import type { LevelDef } from '../core/journey';
import { Button, Card, Guide, LevelHeader, Screen } from '../ui/components';
import { CheckIcon } from '../ui/icons';
import { space, type } from '../ui/theme';

const RULES: Record<LevelDef['kind'], string[]> = {
  context: ['Nothing here is scored.', 'Tap places to look around.'],
  interest: ['There are no right or wrong choices.', 'Pick what you would most like to do.', 'You can leave any activity at any time.', 'No timers.'],
  ability: ['Start with one practice puzzle.', 'You can use one hint per puzzle, or skip.', 'No timers — take your time.', 'These puzzles are counted, but they are not an exam.'],
};

const GUIDE: Record<LevelDef['kind'], string> = {
  context: 'Let me show you around before we begin.',
  interest: 'Here I want to see what you enjoy. Choose honestly — there is nothing to win or lose.',
  ability: 'Time for some puzzles. Think it through, and do not worry if one feels hard.',
};

export function LevelIntro({ level, resuming, onStart, onBack }: { level: LevelDef; resuming: boolean; onStart: () => void; onBack: () => void }) {
  return (
    <Screen footer={<Button label={resuming ? 'Continue where I left off' : 'Let’s go'} onPress={onStart} testID="intro-start" />}>
      <LevelHeader title={`Stop ${level.index}: ${level.title}`} progressText={`About ${level.minutes} minutes`} onBack={onBack} />
      <Guide>{GUIDE[level.kind]}</Guide>
      <Card style={{ gap: space.sm }}>
        <Text style={type.body}>{level.tagline}</Text>
        {RULES[level.kind].map((r) => (
          <View key={r} style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
            <CheckIcon size={18} />
            <Text style={[type.body, { flex: 1 }]}>{r}</Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

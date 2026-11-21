/** End-of-journey reflection. Context only — stored as REFLECTION_RESPONSE and never scored. */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Glyph } from '../core/tasks';
import { Button, Guide, LevelHeader, Screen, Tap } from '../ui/components';
import { TaskGlyph } from '../ui/icons';
import { colors, radius, space, TOUCH, type } from '../ui/theme';

const PLACES: { id: string; label: string; glyph: Glyph; tint: string }[] = [
  { id: 'fixing', label: 'Fixing and building', glyph: 'wrench', tint: '#C9874B' },
  { id: 'investigating', label: 'Testing and finding out', glyph: 'magnifier', tint: '#5B8BC9' },
  { id: 'creating', label: 'Designing and painting', glyph: 'palette', tint: '#D2607F' },
  { id: 'helping', label: 'Helping people', glyph: 'hands', tint: '#E08A3C' },
  { id: 'leading', label: 'Persuading and leading', glyph: 'megaphone', tint: '#C2A23A' },
  { id: 'organising', label: 'Organising and checking', glyph: 'clipboard', tint: '#5E9C8E' },
];
const FEELINGS = [
  { id: 'fun', label: 'Fun' }, { id: 'ok', label: 'Okay' }, { id: 'hard', label: 'Hard' }, { id: 'boring', label: 'Boring' }, { id: 'confusing', label: 'Confusing' },
];

export function Reflection({ onDone }: { onDone: (answers: { favourite: string; feeling: string }) => void }) {
  const [favourite, setFavourite] = useState<string | null>(null);
  const [feeling, setFeeling] = useState<string | null>(null);
  return (
    <Screen footer={<Button label="See my journey summary" disabled={!favourite || !feeling} onPress={() => onDone({ favourite: favourite!, feeling: feeling! })} testID="reflection-done" />}>
      <LevelHeader title="Before we finish" progressText="Two quick questions" />
      <Guide>You made it through the whole valley! Tell me a little about it.</Guide>
      <Text style={type.subtitle}>Which kind of activity did you enjoy most?</Text>
      <View style={st.grid}>
        {[...PLACES, { id: 'not_sure', label: 'Not sure', glyph: null as Glyph | null, tint: colors.mountain }].map((p) => (
          <Tap key={p.id} testID={`fav-${p.id}`} onPress={() => setFavourite(p.id)} accessibilityState={{ selected: favourite === p.id }} accessibilityLabel={p.label}
            style={[st.choice, favourite === p.id && st.sel]}>
            {p.glyph ? <TaskGlyph glyph={p.glyph} size={30} color={p.tint} /> : null}
            <Text style={[type.body, { flex: 1 }]}>{p.label}</Text>
          </Tap>
        ))}
      </View>
      <Text style={type.subtitle}>How did the journey feel?</Text>
      <View style={st.row}>
        {FEELINGS.map((f) => (
          <Tap key={f.id} testID={`feel-${f.id}`} onPress={() => setFeeling(f.id)} accessibilityState={{ selected: feeling === f.id }} accessibilityLabel={f.label}
            style={[st.chip, feeling === f.id && st.sel]}>
            <Text style={type.body}>{f.label}</Text>
          </Tap>
        ))}
      </View>
    </Screen>
  );
}

const st = StyleSheet.create({
  grid: { gap: space.sm },
  choice: { minHeight: TOUCH + 4, flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 2, borderColor: colors.border, paddingHorizontal: space.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { minHeight: TOUCH, justifyContent: 'center', paddingHorizontal: space.lg, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface },
  sel: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
});

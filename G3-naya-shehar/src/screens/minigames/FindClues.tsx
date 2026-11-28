import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { MiniGameProps, MiniShell } from './Shell';
import { GText } from '@/ui/Text';
import { Icon, IconName } from '@/ui/Icon';
import { useTheme } from '@/state/GameProvider';
import { elevation, radius, space } from '@/ui/tokens';
import { audio } from '@/services/audio';
import { feedback } from '@/services/feedback';

const SPOTS: { icon: IconName; label: string; clue: string }[] = [
  { icon: 'search', label: 'Muddy puddle', clue: 'The water here is cloudy.' },
  { icon: 'wrench', label: 'Old pipe', clue: 'A small leak drips here!' },
  { icon: 'ledger', label: 'Notebook', clue: 'Readings change every evening.' },
  { icon: 'flask', label: 'Sample jar', clue: 'Tiny specks float inside.' },
  { icon: 'home', label: 'Wall', clue: 'A damp line shows the water level.' },
  { icon: 'map', label: 'Old map', clue: 'An old drain runs under here.' },
];

/** Investigate: tap places to look closely; find three clues. */
export default function FindClues({ title, partner, onDone, seed }: MiniGameProps) {
  const { c } = useTheme();
  const clueIdx = useMemo(() => new Set([seed % 6, (seed + 2) % 6, (seed + 4) % 6]), [seed]);
  const [opened, setOpened] = useState<number[]>([]);
  const found = opened.filter((i) => clueIdx.has(i)).length;
  const done = found >= 3;
  return (
    <MiniShell title={title} partner={partner} instructions="Tap each place to look closely. Find 3 clues." done={done} onDone={onDone} progress={`Clues found: ${found} of 3`}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center' }}>
        {SPOTS.map((s, i) => {
          const open = opened.includes(i);
          const isClue = clueIdx.has(i);
          return (
            <Pressable key={i} accessibilityRole="button" accessibilityLabel={open ? `${s.label}: ${isClue ? s.clue : 'nothing here'}` : `Look at ${s.label}`}
              disabled={open || done}
              onPress={() => { setOpened((o) => [...o, i]); audio.play(isClue ? 'select' : 'blip'); feedback.tap(); }}
              style={[{ width: '30%', minWidth: 96, aspectRatio: 0.85, borderRadius: radius.md, padding: space.sm, alignItems: 'center', justifyContent: 'center', gap: 4,
                backgroundColor: open ? (isClue ? '#E4F5E9' : c.bgAlt) : c.surfaceRaised, borderWidth: 3, borderColor: open && isClue ? c.success : c.border }, elevation(1)]}>
              <Icon name={open ? (isClue ? 'sparkle' : 'close') : s.icon} size={30} color={open ? (isClue ? c.success : c.locked) : c.secondaryDeep} />
              <GText variant="label" center>{s.label}</GText>
              {open ? <GText variant="small" center soft numberOfLines={3}>{isClue ? s.clue : 'Nothing here.'}</GText> : null}
            </Pressable>
          );
        })}
      </View>
    </MiniShell>
  );
}

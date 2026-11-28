import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { NumericPuzzle } from '@/assessment/abilities/puzzleTypes';
import { ViewProps } from './PuzzleRunner';
import { GText } from '@/ui/Text';
import { Icon } from '@/ui/Icon';
import { useTheme } from '@/state/GameProvider';
import { elevation, radius, space } from '@/ui/tokens';
import { audio } from '@/services/audio';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'] as const;

/** NUM: answer with the on-screen keypad (digits only — no free text). */
export function NumericView({ puzzle, onAnswer, locked, reveal, solved }: ViewProps<NumericPuzzle>) {
  const { c } = useTheme();
  const [v, setV] = useState('');
  const show = reveal ? String(puzzle.answer) : v;
  const press = (k: (typeof KEYS)[number]) => {
    if (locked) return;
    audio.play('blip', 0.4);
    if (k === 'del') setV((x) => x.slice(0, -1));
    else if (k === 'ok') { if (v) { onAnswer({ kind: 'number', value: Number(v) }); if (!solved) setV(''); } }
    else setV((x) => (x.length < 7 ? (x === '0' ? k : x + k) : x));
  };
  const pretty = show ? Number(show).toLocaleString('en-US') : '';
  return (
    <View style={{ gap: space.md }}>
      <View accessible accessibilityLabel={`Your answer: ${pretty || 'empty'} ${puzzle.unit ?? ''}`} accessibilityLiveRegion="polite"
        style={[{ alignSelf: 'center', minWidth: 220, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingVertical: space.md, paddingHorizontal: space.lg, borderRadius: radius.md, backgroundColor: c.surfaceRaised, borderWidth: 3, borderColor: solved || reveal ? c.success : c.border }, elevation(1)]}>
        {puzzle.unit === 'Rs' ? <GText variant="heading" soft>Rs</GText> : null}
        <GText variant="hero">{pretty || ' '}</GText>
        {puzzle.unit && puzzle.unit !== 'Rs' ? <GText variant="sub" soft>{puzzle.unit}</GText> : null}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center', alignSelf: 'center', width: 3 * 84 + 2 * space.sm }}>
        {KEYS.map((k) => (
          <Pressable key={k} accessibilityRole="button" accessibilityLabel={k === 'del' ? 'Delete' : k === 'ok' ? 'Check answer' : k} disabled={locked || (k === 'ok' && !v)}
            onPress={() => press(k)}
            style={({ pressed }) => [{ width: 84, height: 56, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
              backgroundColor: k === 'ok' ? c.success : k === 'del' ? c.bgAlt : c.surfaceRaised, borderWidth: 2, borderColor: k === 'ok' ? '#2E8B57' : c.border,
              opacity: locked || (k === 'ok' && !v) ? 0.45 : 1, transform: [{ translateY: pressed ? 2 : 0 }] }, elevation(1)]}>
            {k === 'del' ? <Icon name="undo" size={24} color={c.text} /> : k === 'ok' ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Icon name="check" size={22} color="#FFFFFF" /><GText variant="label" color="#FFFFFF">CHECK</GText></View> : <GText variant="heading">{k}</GText>}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

import { View } from 'react-native';
import { SequencePuzzle } from '@/assessment/abilities/puzzleTypes';
import { ViewProps } from './PuzzleRunner';
import { OptionGrid } from './OptionGrid';
import { TileGlyph, describeTile } from './glyphs';
import { space } from '@/ui/tokens';

/** ABS: complete the row or the 3×3 grid. */
export function SequenceView({ puzzle, onAnswer, tried, locked, reveal, solved }: ViewProps<SequencePuzzle>) {
  const shown = puzzle.tiles.map((t) => (t === null && (solved || reveal) ? puzzle.options[puzzle.answer] : t));
  const n = puzzle.tiles.length;
  const size = puzzle.layout === 'grid' ? 70 : Math.min(62, Math.floor(320 / n) - 6);
  const label = shown.map((t, i) => `${i + 1}: ${t ? describeTile(t) : 'missing'}`).join('. ');
  return (
    <View style={{ gap: space.md }}>
      <View accessible accessibilityLabel={label}
        style={{ alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 6, width: puzzle.layout === 'grid' ? size * 3 + 12 : undefined, justifyContent: 'center' }}>
        {shown.map((t, i) => <TileGlyph key={i} tile={t} size={size} />)}
      </View>
      <OptionGrid count={4} answer={puzzle.answer} tried={tried} locked={locked} reveal={reveal} solved={solved}
        labels={puzzle.options.map(describeTile)} onPick={(i) => onAnswer({ kind: 'index', value: i })}
        render={(i) => <TileGlyph tile={puzzle.options[i]} size={76} />} />
    </View>
  );
}

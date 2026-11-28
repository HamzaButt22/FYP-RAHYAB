import { View } from 'react-native';
import Svg, { G, Rect } from 'react-native-svg';
import { FitPuzzle } from '@/assessment/abilities/puzzleTypes';
import { ViewProps } from './PuzzleRunner';
import { OptionGrid } from './OptionGrid';
import { Piece, describeCells } from './glyphs';

/** SPA: a wall with a gap; choose the piece that fills it (turning allowed, flipping not). */
export function FitView({ puzzle, onAnswer, tried, locked, reveal, solved }: ViewProps<FitPuzzle>) {
  const gw = Math.max(...puzzle.gap.map((c) => c[0])) + 1;
  const gh = Math.max(...puzzle.gap.map((c) => c[1])) + 1;
  const cols = gw + 2, rows = gh + 2, k = Math.min(30, 220 / Math.max(cols, rows));
  const filled = solved || reveal;
  return (
    <View style={{ gap: 12 }}>
      <View style={{ alignSelf: 'center' }} accessible accessibilityLabel={`Wall with a gap. ${describeCells(puzzle.gap)}`}>
        <Svg width={cols * k} height={rows * k}>
          {Array.from({ length: rows }, (_, y) => Array.from({ length: cols }, (_, x) => {
            const inGap = puzzle.gap.some(([gx, gy]) => gx + 1 === x && gy + 1 === y);
            return (
              <G key={`${x}-${y}`}>
                <Rect x={x * k + 1} y={y * k + 1} width={k - 2} height={k - 2} rx={3}
                  fill={inGap ? (filled ? '#F4A340' : '#3B3048') : (x + y) % 2 ? '#D9A07A' : '#C98E64'} stroke={inGap ? (filled ? '#7A4E2D' : '#2B2433') : '#B07A52'} strokeWidth={1.5} />
              </G>
            );
          }))}
        </Svg>
      </View>
      <OptionGrid count={4} answer={puzzle.answer} tried={tried} locked={locked} reveal={reveal} solved={solved}
        labels={puzzle.options.map(describeCells)} onPick={(i) => onAnswer({ kind: 'index', value: i })}
        render={(i) => <Piece cells={puzzle.options[i]} size={78} colour={['#F4A340', '#F4A340', '#F4A340', '#F4A340'][i]} />} />
    </View>
  );
}

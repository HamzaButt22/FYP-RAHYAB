import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { RoutePuzzle, Stop } from '@/assessment/abilities/puzzleTypes';
import { ViewProps } from './PuzzleRunner';
import { GameButton } from '@/ui/Button';
import { GText } from '@/ui/Text';
import { useTheme } from '@/state/GameProvider';
import { radius, space } from '@/ui/tokens';
import { audio } from '@/services/audio';
import { manhattan, optimalLength, respectsOrder } from '@/assessment/abilities/bank/pln';

/** Best order, for the "show me" reveal after three tries. */
function bestOrder(p: RoutePuzzle): string[] {
  const perms = (xs: Stop[]): Stop[][] => (xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((r) => [x, ...r])));
  const target = optimalLength(p.start, p.stops, p.before, p.returnToStart);
  for (const o of perms(p.stops)) {
    if (!respectsOrder(o, p.before)) continue;
    let d = 0, cur: Stop = p.start;
    for (const s of o) { d += manhattan(cur, s); cur = s; }
    if (p.returnToStart) d += manhattan(cur, p.start);
    if (d === target) return o.map((s) => s.id);
  }
  return [];
}

/** PLN: plan the bus route by tapping stops in order. Distance is shown only after sending. */
export function RouteView({ puzzle, onAnswer, locked, reveal }: ViewProps<RoutePuzzle>) {
  const { c } = useTheme();
  const [order, setOrder] = useState<string[]>([]);
  const shown = reveal ? bestOrder(puzzle) : order;
  const W = 300, cell = W / (puzzle.grid - 1 + 1), off = cell / 2;
  const px = (s: { x: number; y: number }) => ({ x: off + s.x * cell, y: off + s.y * cell });
  const stops = shown.map((id) => puzzle.stops.find((s) => s.id === id)!);
  const path = [puzzle.start, ...stops, ...(puzzle.returnToStart && stops.length === puzzle.stops.length ? [puzzle.start] : [])];
  const pathD = path.map((s, i) => { const p = px(s); if (i === 0) return `M${p.x} ${p.y}`; const q = px(path[i - 1]); return `L${p.x} ${q.y} L${p.x} ${p.y}`; }).join(' ');
  const tap = (s: Stop) => { if (locked || order.includes(s.id)) return; audio.play('blip'); setOrder((o) => [...o, s.id]); };
  return (
    <View style={{ gap: space.md }}>
      <View style={{ alignSelf: 'center', borderRadius: radius.md, overflow: 'hidden', borderWidth: 3, borderColor: c.border }}>
        <Svg width={W} height={W}>
          <Rect x={0} y={0} width={W} height={W} fill="#B9DE8F" />
          {Array.from({ length: puzzle.grid }, (_, i) => (
            <G key={i}>
              <Line x1={off + i * cell} y1={off} x2={off + i * cell} y2={W - off} stroke="#D9C9A8" strokeWidth={10} />
              <Line x1={off} y1={off + i * cell} x2={W - off} y2={off + i * cell} stroke="#D9C9A8" strokeWidth={10} />
            </G>
          ))}
          <Path d={pathD} stroke={reveal ? '#2E8B57' : '#E9873A'} strokeWidth={5} fill="none" strokeLinejoin="round" strokeDasharray={reveal ? '8 5' : undefined} />
          <G>
            <Rect x={px(puzzle.start).x - 14} y={px(puzzle.start).y - 14} width={28} height={28} rx={6} fill="#2D2A4A" />
            <SvgText x={px(puzzle.start).x} y={px(puzzle.start).y + 5} fontSize={13} fontWeight="bold" fill="#FFFFFF" textAnchor="middle">D</SvgText>
          </G>
          {puzzle.stops.map((s) => {
            const p = px(s); const n = shown.indexOf(s.id);
            return (
              <G key={s.id} onPress={() => tap(s)}>
                <Circle cx={p.x} cy={p.y} r={16} fill={n >= 0 ? '#F4A340' : '#FFFBF3'} stroke="#2B2433" strokeWidth={2.5} />
                <SvgText x={p.x} y={p.y + 5} fontSize={14} fontWeight="bold" fill="#2B2433" textAnchor="middle">{n >= 0 ? String(n + 1) : s.label[0]}</SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
        {puzzle.stops.map((s) => {
          const n = shown.indexOf(s.id);
          return (
            <Pressable key={s.id} accessibilityRole="button" accessibilityLabel={n >= 0 ? `${s.label}, stop number ${n + 1}` : `Add ${s.label} as the next stop`} onPress={() => tap(s)} disabled={locked || n >= 0}
              style={{ minHeight: 44, paddingHorizontal: 10, borderRadius: radius.pill, justifyContent: 'center', borderWidth: 2, borderColor: c.border, backgroundColor: n >= 0 ? c.primary : c.surfaceRaised }}>
              <GText variant="label" color={n >= 0 ? c.textOnPrimary : c.text}>{n >= 0 ? `${n + 1}. ` : ''}{s.label}</GText>
            </Pressable>
          );
        })}
      </View>
      <GText variant="small" center soft>D = Bus depot. The bus drives along the streets.{puzzle.returnToStart ? ' It must return to the depot at the end.' : ''}</GText>
      {!locked ? (
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <GameButton style={{ flex: 1 }} variant="ghost" size="sm" icon="undo" label="Undo" disabled={!order.length} onPress={() => setOrder((o) => o.slice(0, -1))} />
          <GameButton style={{ flex: 2 }} size="sm" icon="bus" label="Send the bus" disabled={order.length !== puzzle.stops.length}
            onPress={() => { onAnswer({ kind: 'route', order }); setOrder([]); }} />
        </View>
      ) : null}
    </View>
  );
}

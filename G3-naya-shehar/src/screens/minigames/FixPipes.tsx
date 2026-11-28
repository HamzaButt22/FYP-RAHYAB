import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { MiniGameProps, MiniShell } from './Shell';
import { useTheme } from '@/state/GameProvider';
import { audio } from '@/services/audio';
import { feedback } from '@/services/feedback';
import { radius } from '@/ui/tokens';

const N = 1, E = 2, S = 4, W = 8;
const rotMask = (m: number, r: number) => { let x = m; for (let i = 0; i < r; i++) x = ((x << 1) | (x >> 3)) & 15; return x; };
const DIR: Record<number, [number, number]> = { [N]: [0, -1], [E]: [1, 0], [S]: [0, 1], [W]: [-1, 0] };
const OPP: Record<number, number> = { [N]: S, [S]: N, [E]: W, [W]: E };

type Kind = 'straight' | 'corner';
const BASE: Record<Kind, number> = { straight: N | S, corner: N | E };

const PATHS: [number, number][][] = [
  [[0, 1], [0, 0], [1, 0], [1, 1], [1, 2], [2, 2], [2, 1]],
  [[0, 1], [1, 1], [1, 0], [2, 0], [2, 1]],
  [[0, 1], [0, 2], [1, 2], [1, 1], [2, 1]],
];

/** Solvable 3×3 pipe puzzle: water enters at the left of row 2 and must reach the tank on the right of row 2. */
export function buildPipes(seed: number) {
  const path = PATHS[seed % PATHS.length];
  const tiles: { kind: Kind; rot: number }[] = Array.from({ length: 9 }, (_, i) => ({ kind: i % 2 ? 'corner' : 'straight', rot: (i * 7 + seed) % 4 }));
  path.forEach(([x, y], i) => {
    const prev = i === 0 ? [x - 1, y] : path[i - 1];
    const next = i === path.length - 1 ? [x + 1, y] : path[i + 1];
    const dirTo = (a: number[], b: number[]) => (b[0] > a[0] ? E : b[0] < a[0] ? W : b[1] > a[1] ? S : N);
    const need = dirTo([x, y], prev) | dirTo([x, y], next);
    const kind: Kind = need === (N | S) || need === (E | W) ? 'straight' : 'corner';
    let solvedRot = 0;
    while (rotMask(BASE[kind], solvedRot) !== need) solvedRot++;
    tiles[y * 3 + x] = { kind, rot: (solvedRot + 1 + ((seed + i) % 3)) % 4 };
  });
  return tiles;
}

export function pipesSolved(tiles: { kind: Kind; rot: number }[]) {
  let x = 0, y = 1, from = W;
  const wet = new Set<number>();
  for (let steps = 0; steps < 12; steps++) {
    if (x < 0 || y < 0 || x > 2 || y > 2) return { ok: false, wet };
    const m = rotMask(BASE[tiles[y * 3 + x].kind], tiles[y * 3 + x].rot);
    if (!(m & from)) return { ok: false, wet };
    wet.add(y * 3 + x);
    const out = m & ~from;
    if (x === 2 && y === 1 && out === E) return { ok: true, wet };
    const [dx, dy] = DIR[out];
    x += dx; y += dy; from = OPP[out];
  }
  return { ok: false, wet };
}

export default function FixPipes({ title, partner, onDone, seed }: MiniGameProps) {
  const { c } = useTheme();
  const [tiles, setTiles] = useState(() => buildPipes(seed));
  const { ok, wet } = useMemo(() => pipesSolved(tiles), [tiles]);
  const size = 92;
  return (
    <MiniShell title={title} partner={partner} instructions="Tap the pipes to turn them. Connect the water to the tank." done={ok} onDone={onDone}>
      <View style={{ alignSelf: 'center', flexDirection: 'row', alignItems: 'center' }}>
        <Svg width={22} height={40}><Rect x={0} y={12} width={22} height={16} fill="#3E9CC8" /></Svg>
        <View style={{ width: size * 3, flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#E8D7B5', borderRadius: radius.md, overflow: 'hidden' }}>
          {tiles.map((t, i) => (
            <Pressable key={i} accessibilityRole="button" accessibilityLabel={`Pipe ${i + 1}, ${t.kind}, turned ${t.rot * 90} degrees${wet.has(i) ? ', water flowing' : ''}`}
              disabled={ok}
              onPress={() => { audio.play('blip'); feedback.tap(); setTiles((ts) => ts.map((x, j) => (j === i ? { ...x, rot: (x.rot + 1) % 4 } : x))); }}
              style={{ width: size, height: size, borderWidth: 1, borderColor: '#D9C29A' }}>
              <Svg width={size} height={size} viewBox="0 0 90 90">
                <Rect x={2} y={2} width={86} height={86} rx={10} fill={wet.has(i) ? '#DFF2FA' : c.surfaceRaised} />
                <Path d={t.kind === 'straight' ? 'M45 0 V90' : 'M45 0 V45 H90'} stroke={wet.has(i) ? '#3E9CC8' : '#7D8A96'} strokeWidth={20} strokeLinecap="butt" strokeLinejoin="round" fill="none" transform={`rotate(${t.rot * 90} 45 45)`} />
                <Circle cx={45} cy={45} r={11} fill={wet.has(i) ? '#2F86B3' : '#5D6B78'} />
              </Svg>
            </Pressable>
          ))}
        </View>
        <Svg width={34} height={56}><Rect x={0} y={20} width={10} height={16} fill={ok ? '#3E9CC8' : '#7D8A96'} /><Rect x={10} y={4} width={22} height={48} rx={6} fill={ok ? '#6EC6E6' : '#C7BDD3'} stroke="#2B2433" strokeWidth={2} /></Svg>
      </View>
    </MiniShell>
  );
}

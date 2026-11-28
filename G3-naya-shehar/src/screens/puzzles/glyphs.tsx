import type { ReactNode } from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { Cell, Tile } from '@/assessment/abilities/puzzleTypes';

/** Polyomino piece, drawn as bevelled tiles. */
export function Piece({ cells, cell = 20, colour = '#F4A340', size }: { cells: Cell[]; cell?: number; colour?: string; size?: number }) {
  const w = Math.max(...cells.map((c) => c[0])) + 1;
  const h = Math.max(...cells.map((c) => c[1])) + 1;
  const box = size ?? Math.max(w, h) * cell;
  const k = box / Math.max(w, h);
  return (
    <Svg width={box} height={box} viewBox={`0 0 ${box} ${box}`}>
      <G transform={`translate(${(box - w * k) / 2} ${(box - h * k) / 2})`}>
        {cells.map(([x, y], i) => (
          <G key={i}>
            <Rect x={x * k + 1} y={y * k + 1} width={k - 2} height={k - 2} rx={3} fill={colour} stroke="#7A4E2D" strokeWidth={1.5} />
            <Rect x={x * k + 4} y={y * k + 4} width={k - 8} height={(k - 8) / 3} rx={2} fill="#FFFFFF" opacity={0.35} />
          </G>
        ))}
      </G>
    </Svg>
  );
}

const SPOTS: Record<number, [number, number][]> = {
  1: [[32, 32]], 2: [[20, 32], [44, 32]], 3: [[20, 22], [44, 22], [32, 44]], 4: [[20, 20], [44, 20], [20, 44], [44, 44]],
};

function Shape({ shape, x, y, r, fill, rot }: { shape: Tile['shape']; x: number; y: number; r: number; fill: Tile['fill']; rot: number }) {
  const ink = '#2B2433';
  const body = fill === 'solid' ? ink : fill === 'half' ? '#9C92A6' : '#FFFFFF';
  const common = { fill: body, stroke: ink, strokeWidth: 2.2 } as const;
  const dot = fill === 'half' ? <Circle cx={x} cy={y} r={r * 0.28} fill={ink} /> : null;
  let el: ReactNode;
  switch (shape) {
    case 'circle': el = <Circle cx={x} cy={y} r={r} {...common} />; break;
    case 'square': el = <Rect x={x - r} y={y - r} width={r * 2} height={r * 2} rx={2} {...common} />; break;
    case 'triangle': el = <Path d={`M${x} ${y - r} L${x + r} ${y + r * 0.8} L${x - r} ${y + r * 0.8} Z`} {...common} />; break;
    case 'diamond': el = <Path d={`M${x} ${y - r} L${x + r} ${y} L${x} ${y + r} L${x - r} ${y} Z`} {...common} />; break;
    case 'arrow': el = <Path d={`M${x} ${y - r} L${x + r} ${y} L${x + r * 0.4} ${y} L${x + r * 0.4} ${y + r} L${x - r * 0.4} ${y + r} L${x - r * 0.4} ${y} L${x - r} ${y} Z`} {...common} transform={`rotate(${rot} ${x} ${y})`} />; break;
  }
  return <G>{el}{dot}</G>;
}

/** Abstract-reasoning tile. Fill styles differ in shape (outline / dot / solid), not just colour. */
export function TileGlyph({ tile, size = 64 }: { tile: Tile | null; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Rect x={1} y={1} width={62} height={62} rx={10} fill={tile ? '#FFFBF3' : '#FCEBD2'} stroke="#C9A26B" strokeWidth={2} strokeDasharray={tile ? undefined : '5 4'} />
      {tile ? SPOTS[tile.count].map(([x, y], i) => <Shape key={i} shape={tile.shape} x={x} y={y} r={tile.count === 1 ? 17 : tile.count === 2 ? 10 : 8.5} fill={tile.fill} rot={tile.rot} />)
        : <Path d="M25 24 q0 -8 7 -8 q7 0 7 7 q0 5 -6 7 v4 M33 42 v2" stroke="#C9A26B" strokeWidth={4} strokeLinecap="round" fill="none" />}
    </Svg>
  );
}

export function describeTile(t: Tile) {
  const fill = t.fill === 'solid' ? 'filled' : t.fill === 'half' ? 'grey with a dot' : 'empty';
  return `${t.count} ${fill} ${t.shape}${t.count > 1 ? 's' : ''}${t.shape === 'arrow' ? ` pointing ${['up', 'right', 'down', 'left'][t.rot / 90]}` : ''}`;
}

export function describeCells(cells: Cell[]) {
  const rows: string[] = [];
  const h = Math.max(...cells.map((c) => c[1])) + 1;
  const w = Math.max(...cells.map((c) => c[0])) + 1;
  for (let y = 0; y < h; y++) {
    let r = '';
    for (let x = 0; x < w; x++) r += cells.some((c) => c[0] === x && c[1] === y) ? 'X' : '.';
    rows.push(r);
  }
  return `Piece with rows: ${rows.join(', ')}`;
}

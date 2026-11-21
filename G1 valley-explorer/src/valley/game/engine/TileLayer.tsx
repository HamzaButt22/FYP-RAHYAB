/** Draws the whole tile map once as a single SVG (memoised): cheap to render on low-end phones. */
import React, { memo } from 'react';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

const C = {
  grass: '#9CCB8F', grass2: '#8DC181', path: '#EAD7AE', pathEdge: '#D9C08E', water: '#76B9D8', wave: '#B9E0EF',
  tree: '#3F8A57', tree2: '#57A06B', trunk: '#8A5A3B', rock: '#9AA3AB', rock2: '#7E8790', fence: '#9C6B43',
  wall: '#B79C7A', wall2: '#9E8463', floor: '#DDBF90', floor2: '#CDAE7E', sand: '#EEDCB0',
};

function tile(ch: string, x: number, y: number, s: number, k: string) {
  const base = <Rect key={`${k}b`} x={x} y={y} width={s} height={s} fill={(x / s + y / s) % 2 ? C.grass : C.grass2} />;
  switch (ch) {
    case ',':
      return <G key={k}>{base}<Circle cx={x + s * 0.3} cy={y + s * 0.35} r={s * 0.07} fill="#F7E07A" /><Circle cx={x + s * 0.68} cy={y + s * 0.6} r={s * 0.07} fill="#F29BB5" /><Circle cx={x + s * 0.45} cy={y + s * 0.75} r={s * 0.06} fill="#FFFFFF" /></G>;
    case '=': case 'g':
      return <G key={k}><Rect x={x} y={y} width={s} height={s} fill={C.path} /><Circle cx={x + s * 0.25} cy={y + s * 0.3} r={s * 0.04} fill={C.pathEdge} /><Circle cx={x + s * 0.7} cy={y + s * 0.72} r={s * 0.05} fill={C.pathEdge} /></G>;
    case 's':
      return <Rect key={k} x={x} y={y} width={s} height={s} fill={C.sand} />;
    case 'b':
      return <G key={k}><Rect x={x} y={y} width={s} height={s} fill={C.water} /><Rect x={x} y={y + s * 0.1} width={s} height={s * 0.8} fill={C.trunk} />{[0.25, 0.5, 0.75].map((f) => <Line key={f} x1={x + s * f} y1={y + s * 0.1} x2={x + s * f} y2={y + s * 0.9} stroke="#6E4529" strokeWidth={1.5} />)}</G>;
    case '~':
      return <G key={k}><Rect x={x} y={y} width={s} height={s} fill={C.water} /><Path d={`M${x + s * 0.15} ${y + s * 0.45} q${s * 0.12} -${s * 0.1} ${s * 0.24} 0 t${s * 0.24} 0`} stroke={C.wave} strokeWidth={2} fill="none" /></G>;
    case 'T':
      return <G key={k}>{base}<Rect x={x + s * 0.44} y={y + s * 0.6} width={s * 0.12} height={s * 0.28} fill={C.trunk} /><Circle cx={x + s * 0.5} cy={y + s * 0.42} r={s * 0.36} fill={C.tree} /><Circle cx={x + s * 0.38} cy={y + s * 0.34} r={s * 0.14} fill={C.tree2} /></G>;
    case '^':
      return <G key={k}>{base}<Path d={`M${x + s * 0.08} ${y + s * 0.92} L${x + s * 0.45} ${y + s * 0.15} L${x + s * 0.92} ${y + s * 0.92}z`} fill={C.rock} /><Path d={`M${x + s * 0.45} ${y + s * 0.15} L${x + s * 0.62} ${y + s * 0.5} L${x + s * 0.5} ${y + s * 0.92} L${x + s * 0.92} ${y + s * 0.92}z`} fill={C.rock2} /></G>;
    case '#':
      return <G key={k}>{base}<Rect x={x} y={y + s * 0.38} width={s} height={s * 0.12} fill={C.fence} /><Rect x={x} y={y + s * 0.62} width={s} height={s * 0.12} fill={C.fence} /><Rect x={x + s * 0.42} y={y + s * 0.2} width={s * 0.16} height={s * 0.7} rx={2} fill={C.fence} /></G>;
    case 'G':
      return <G key={k}><Rect x={x} y={y} width={s} height={s} fill={C.path} /><Rect x={x + s * 0.06} y={y + s * 0.15} width={s * 0.88} height={s * 0.72} rx={4} fill="#B07A45" /><Line x1={x + s * 0.5} y1={y + s * 0.15} x2={x + s * 0.5} y2={y + s * 0.87} stroke="#7A4E2A" strokeWidth={2} /><Line x1={x + s * 0.06} y1={y + s * 0.5} x2={x + s * 0.94} y2={y + s * 0.5} stroke="#7A4E2A" strokeWidth={2} /></G>;
    case 'W':
      return <G key={k}><Rect x={x} y={y} width={s} height={s} fill={C.wall} /><Line x1={x} y1={y + s / 2} x2={x + s} y2={y + s / 2} stroke={C.wall2} strokeWidth={1.5} /><Line x1={x + s / 2} y1={y} x2={x + s / 2} y2={y + s / 2} stroke={C.wall2} strokeWidth={1.5} /></G>;
    case 'f':
      return <G key={k}><Rect x={x} y={y} width={s} height={s} fill={C.floor} /><Line x1={x} y1={y + s * 0.5} x2={x + s} y2={y + s * 0.5} stroke={C.floor2} strokeWidth={1} /></G>;
    default:
      return base;
  }
}

export const TileLayer = memo(function TileLayer({ rows, size }: { rows: string[]; size: number }) {
  const w = rows[0].length * size;
  const h = rows.length * size;
  return (
    <Svg width={w} height={h} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {rows.flatMap((row, y) => row.split('').map((ch, x) => tile(ch, x * size, y * size, size, `${x}-${y}`)))}
    </Svg>
  );
});

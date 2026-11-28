import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { mix, poly, shade, up, Pt } from './iso';

export function Tree({ x, y, kind = 0, season = 1 }: { x: number; y: number; kind?: number; season?: number }) {
  const leaf = season === 4 ? '#7FA36A' : season === 2 ? '#5FA84E' : season === 3 ? '#3E9A58' : '#56B060';
  if (kind === 1) {
    // tall poplar / safeda
    return (
      <G>
        <Ellipse cx={x + 3} cy={y + 2} rx={8} ry={3} fill="#000" opacity={0.14} />
        <Rect x={x - 1.5} y={y - 10} width={3} height={11} fill="#8B6A4E" />
        <Ellipse cx={x} cy={y - 24} rx={7} ry={17} fill={shade(leaf, -0.1)} />
        <Ellipse cx={x - 2} cy={y - 27} rx={4} ry={11} fill={shade(leaf, 0.15)} />
      </G>
    );
  }
  if (kind === 2) {
    // flowering tree in spring, golden in winter
    const bloom = season === 1 ? '#F7A1C4' : season === 4 ? '#E9B44C' : leaf;
    return (
      <G>
        <Ellipse cx={x + 3} cy={y + 2} rx={11} ry={4} fill="#000" opacity={0.14} />
        <Rect x={x - 2} y={y - 9} width={4} height={10} fill="#8B6A4E" />
        <Circle cx={x - 6} cy={y - 14} r={7} fill={shade(bloom, -0.12)} />
        <Circle cx={x + 6} cy={y - 14} r={7} fill={shade(bloom, -0.12)} />
        <Circle cx={x} cy={y - 19} r={9} fill={bloom} />
        <Circle cx={x - 3} cy={y - 22} r={4} fill={shade(bloom, 0.25)} />
      </G>
    );
  }
  return (
    <G>
      <Ellipse cx={x + 3} cy={y + 2} rx={12} ry={4.5} fill="#000" opacity={0.14} />
      <Rect x={x - 2} y={y - 10} width={4} height={11} fill="#8B6A4E" />
      <Circle cx={x} cy={y - 18} r={11} fill={shade(leaf, -0.12)} />
      <Circle cx={x - 3} cy={y - 21} r={7} fill={leaf} />
      <Circle cx={x - 5} cy={y - 24} r={3} fill={shade(leaf, 0.3)} />
    </G>
  );
}

const HOUSE_COLOURS = ['#F6D7A7', '#F2C0A2', '#DDE8C4', '#C9DDEE', '#F1D6E4', '#EBDDC3', '#FCE3B0'];

/** Small family home: damaged (tarp, grey) or rebuilt (colourful, with a charpai and plant). */
export function House({ x, y, variant, rebuilt }: { x: number; y: number; variant: number; rebuilt: boolean }) {
  const w = 15, d = 7.5, h = rebuilt ? 15 + (variant % 3) * 3 : 10;
  const base = HOUSE_COLOURS[variant % HOUSE_COLOURS.length];
  const wall = rebuilt ? base : mix(base, '#9C948C', 0.65);
  const L: Pt = { x: x - w, y }, R: Pt = { x: x + w, y }, T: Pt = { x, y: y - d }, B: Pt = { x, y: y + d };
  return (
    <G>
      <Ellipse cx={x + 3} cy={y + 2} rx={w + 4} ry={d + 2} fill="#000" opacity={0.12} />
      <Path d={poly([L, B, up(B, h), up(L, h)])} fill={wall} />
      <Path d={poly([B, R, up(R, h), up(B, h)])} fill={shade(wall, -0.15)} />
      <Path d={poly([up(T, h), up(R, h), up(B, h), up(L, h)])} fill={rebuilt ? shade(wall, 0.2) : '#7A8C99'} />
      {rebuilt ? (
        <G>
          <Path d={poly([up(L, h), up(B, h), up(B, h + 2.5), up(L, h + 2.5)])} fill="#FFFFFF" opacity={0.8} />
          <Rect x={x - 9} y={y - h + 6} width={4} height={4} fill="#BFE3F2" />
          <Rect x={x + 4} y={y - 9} width={4} height={8} fill={shade(wall, -0.4)} />
          {variant % 2 === 0 ? <Path d={`M${x - w - 6} ${y + 4} l6 -3 l6 3 l-6 3z`} fill="#C9A26B" stroke="#8B6A4E" strokeWidth={0.8} /> : <Circle cx={x - w + 2} cy={y + 3} r={3} fill="#3FAE6A" />}
        </G>
      ) : (
        <Path d={`M${L.x + 2} ${L.y - h + 1} L${B.x} ${B.y - h + 2} L${B.x - 4} ${B.y - h + 7} Z`} fill="#3E7CB1" opacity={0.85} />
      )}
    </G>
  );
}

export function Lamp({ x, y, on }: { x: number; y: number; on: boolean }) {
  return (
    <G>
      <Rect x={x - 0.8} y={y - 18} width={1.6} height={18} fill="#4A4262" />
      <Circle cx={x} cy={y - 19} r={2.6} fill={on ? '#FFD87A' : '#C7BDD3'} />
      {on ? <Circle cx={x} cy={y - 19} r={7} fill="#FFD87A" opacity={0.25} /> : null}
    </G>
  );
}

export function Stall({ x, y, colour }: { x: number; y: number; colour: string }) {
  return (
    <G>
      <Ellipse cx={x + 2} cy={y + 2} rx={11} ry={4} fill="#000" opacity={0.12} />
      <Path d={`M${x - 9} ${y} l9 4.5 l9 -4.5 l0 -6 l-9 4.5 l-9 -4.5z`} fill="#C9A26B" />
      <Path d={`M${x - 11} ${y - 12} l11 5.5 l11 -5.5 l-11 -5.5z`} fill={colour} />
      <Path d={`M${x - 11} ${y - 12} l11 5.5 v3 l-11 -5.5z`} fill={shade(colour, -0.2)} />
      <Path d={`M${x - 9} ${y - 6} v-5 M${x + 9} ${y - 6} v-5`} stroke="#8B6A4E" strokeWidth={1.2} />
    </G>
  );
}

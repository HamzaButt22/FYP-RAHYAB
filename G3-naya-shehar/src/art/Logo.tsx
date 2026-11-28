import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/** Naya Shehar emblem: sunrise over a small rebuilt skyline, with a canal. Original artwork. */
export function Emblem({ size = 160 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Defs>
        <LinearGradient id="em-sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFB45E" />
          <Stop offset="1" stopColor="#FFE7B8" />
        </LinearGradient>
      </Defs>
      <Circle cx={80} cy={80} r={76} fill="url(#em-sky)" stroke="#FFFFFF" strokeWidth={6} />
      <G>
        {Array.from({ length: 10 }, (_, i) => {
          const a = Math.PI + (i / 9) * Math.PI;
          return <Path key={i} d={`M${80 + Math.cos(a) * 30} ${92 + Math.sin(a) * 30} L${80 + Math.cos(a) * 46} ${92 + Math.sin(a) * 46}`} stroke="#FFF4D6" strokeWidth={5} strokeLinecap="round" />;
        })}
        <Circle cx={80} cy={92} r={24} fill="#FFD166" />
      </G>
      <Path d="M8 104 H152 V120 Q80 160 8 120 Z" fill="#3FAE6A" />
      {[[26, 84, 18, 22, '#F6D7A7'], [46, 74, 20, 32, '#F2C0A2'], [68, 88, 18, 18, '#DDE8C4'], [88, 70, 22, 36, '#C9DDEE'], [112, 82, 20, 24, '#F1D6E4']].map(([x, y, w, h, col], i) => (
        <G key={i}>
          <Rect x={x as number} y={y as number} width={w as number} height={h as number} fill={col as string} stroke="#7A4E2D" strokeWidth={2} />
          <Rect x={(x as number) - 2} y={(y as number) - 4} width={(w as number) + 4} height={5} fill="#FFFFFF" stroke="#7A4E2D" strokeWidth={1.5} />
          <Rect x={(x as number) + (w as number) / 2 - 3} y={(y as number) + 8} width={6} height={6} fill="#5B8DEF" />
        </G>
      ))}
      <Path d="M8 118 Q80 108 152 118 L148 128 Q80 118 12 128 Z" fill="#6EC6E6" />
      <Path d="M30 120 q10 -3 20 0 M90 116 q10 -3 20 0" stroke="#FFFFFF" strokeWidth={2} fill="none" />
    </Svg>
  );
}

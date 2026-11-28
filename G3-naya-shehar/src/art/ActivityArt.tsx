import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { Riasec } from '@/assessment/types';

/**
 * Activity vignettes. Every category uses the SAME background, the same
 * size, the same number of elements and the same level of detail so that no
 * option looks more exciting than its pair.
 */
export function ActivityArt({ category, size = 150, bg = '#FCEBD2' }: { category: Riasec; size?: number; bg?: string }) {
  return (
    <Svg width={size} height={size * 0.72} viewBox="0 0 160 115">
      <Rect x={0} y={0} width={160} height={115} rx={18} fill={bg} />
      <Circle cx={128} cy={24} r={12} fill="#FFD166" opacity={0.7} />
      <Path d="M0 86 Q40 74 80 82 T160 78 V115 H0 Z" fill="#B9DE8F" />
      <Ellipse cx={80} cy={96} rx={58} ry={9} fill="#000" opacity={0.1} />
      {SCENES[category]}
    </Svg>
  );
}

const SCENES: Record<Riasec, React.ReactNode> = {
  R: (
    <G>
      <Rect x={30} y={62} width={100} height={8} rx={2} fill="#A56A3A" />
      <Rect x={36} y={70} width={6} height={24} fill="#8B5A30" />
      <Rect x={118} y={70} width={6} height={24} fill="#8B5A30" />
      <G transform="translate(62 44)">
        <Circle r={15} fill="#9AA7B4" />
        {Array.from({ length: 8 }, (_, i) => <Rect key={i} x={-3.5} y={-19} width={7} height={8} fill="#9AA7B4" transform={`rotate(${i * 45})`} />)}
        <Circle r={6} fill="#5D6B78" />
      </G>
      <Path d="M92 60 l18 -24 a7 7 0 1 1 6 4 l-18 24 z" fill="#E9873A" stroke="#B5621F" strokeWidth={1.5} />
      <Rect x={40} y={54} width={14} height={8} rx={2} fill="#3E5C76" />
    </G>
  ),
  I: (
    <G>
      <Rect x={34} y={62} width={92} height={8} rx={2} fill="#7FA6C9" />
      <Rect x={40} y={70} width={6} height={24} fill="#5B84AA" />
      <Rect x={114} y={70} width={6} height={24} fill="#5B84AA" />
      <Path d="M52 60 Q44 44 56 30 Q72 34 70 52 Q66 62 52 60 Z" fill="#3FAE6A" />
      <Path d="M54 58 Q58 46 64 36" stroke="#2E8B57" strokeWidth={1.8} fill="none" />
      <Circle cx={88} cy={40} r={15} fill="#E8F4FA" stroke="#2D2A4A" strokeWidth={4} />
      <Path d="M99 51 l14 14" stroke="#2D2A4A" strokeWidth={6} strokeLinecap="round" />
      <Rect x={108} y={42} width={7} height={20} rx={3} fill="#FFFFFF" stroke="#5B84AA" strokeWidth={1.5} />
      <Rect x={109.5} y={52} width={4} height={9} rx={2} fill="#E2589B" />
    </G>
  ),
  A: (
    <G>
      <Path d="M58 94 L72 34 L86 94 M72 34 V94" stroke="#8B5E3C" strokeWidth={3} fill="none" />
      <Rect x={50} y={30} width={44} height={36} rx={3} fill="#FFFBF3" stroke="#8B5E3C" strokeWidth={2} />
      <Path d="M54 60 Q64 44 72 54 T90 46 V62 H54 Z" fill="#5B8DEF" />
      <Circle cx={82} cy={40} r={5} fill="#FFD166" />
      <Path d="M100 72 Q98 56 114 58 Q130 60 126 74 Q120 80 112 76 Q104 80 100 72 Z" fill="#F4E1C1" stroke="#C9A26B" strokeWidth={1.5} />
      {['#E2589B', '#3FAE6A', '#5B8DEF', '#F4A340'].map((c, i) => <Circle key={c} cx={106 + i * 5} cy={66 + (i % 2) * 3} r={2.6} fill={c} />)}
    </G>
  ),
  S: (
    <G>
      <Rect x={34} y={62} width={92} height={8} rx={2} fill="#C9A26B" />
      <Rect x={40} y={70} width={6} height={24} fill="#A88552" />
      <Rect x={114} y={70} width={6} height={24} fill="#A88552" />
      <G transform="translate(58 30)"><Circle r={9} fill="#C98E64" /><Path d="M-12 32 Q-12 12 0 12 Q12 12 12 32 Z" fill="#3FAE6A" /></G>
      <G transform="translate(100 34)"><Circle r={8} fill="#A8714A" /><Path d="M-11 28 Q-11 10 0 10 Q11 10 11 28 Z" fill="#5B8DEF" /></G>
      <Path d="M68 50 Q80 44 90 50" stroke="#C98E64" strokeWidth={5} strokeLinecap="round" fill="none" />
      <Path d="M80 26 c-3 -5 -10 -3 -9 3 c1 4 9 9 9 9 s8 -5 9 -9 c1 -6 -6 -8 -9 -3 z" fill="#E35D5D" />
    </G>
  ),
  E: (
    <G>
      <Path d="M40 62 L120 62 L112 94 L48 94 Z" fill="#C0392B" />
      <Rect x={40} y={58} width={80} height={6} rx={2} fill="#E3B23C" />
      <Rect x={72} y={36} width={16} height={22} rx={3} fill="#5D5468" />
      <Path d="M58 40 l14 -6 v18 l-14 -6 z" fill="#F4A340" stroke="#B5621F" strokeWidth={1.4} />
      <Path d="M112 26 V58" stroke="#5D5468" strokeWidth={2.5} />
      <Path d="M112 26 l16 5 l-16 6 z" fill="#3FAE6A" />
      {[52, 66, 94, 108].map((x, i) => <G key={x} transform={`translate(${x} ${78 + (i % 2) * 2})`}><Circle r={4.5} fill={['#C98E64', '#A8714A', '#E0AC86', '#8A5A3B'][i]} /></G>)}
    </G>
  ),
  C: (
    <G>
      <Rect x={34} y={62} width={92} height={8} rx={2} fill="#8A6FD1" />
      <Rect x={40} y={70} width={6} height={24} fill="#6E55B5" />
      <Rect x={114} y={70} width={6} height={24} fill="#6E55B5" />
      <Rect x={44} y={28} width={30} height={34} rx={3} fill="#FFFBF3" stroke="#5D5468" strokeWidth={2} />
      <Rect x={53} y={24} width={12} height={7} rx={2} fill="#5D5468" />
      {[38, 45, 52].map((y) => <Path key={y} d={`M50 ${y} l3 3 l5 -6 M61 ${y} h8`} stroke="#3FAE6A" strokeWidth={2} fill="none" />)}
      {[0, 1, 2].map((i) => <Rect key={i} x={84} y={52 - i * 9} width={34} height={9} rx={2} fill={['#F4A340', '#5B8DEF', '#E2589B'][i]} stroke="#FFFFFF" strokeWidth={1.2} />)}
      {[0, 1, 2].map((i) => <Rect key={`l${i}`} x={96} y={55 - i * 9} width={10} height={3} rx={1} fill="#FFFFFF" />)}
    </G>
  ),
};

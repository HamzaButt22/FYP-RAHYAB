/**
 * Original, lightweight vector icons (react-native-svg). No image assets, so the bundle stays small
 * and everything renders crisply on any screen density.
 */
import React from 'react';
import Svg, { Circle, G, Line, Path, Polygon, Rect } from 'react-native-svg';
import type { Glyph } from '../core/tasks';
import { colors } from './theme';

type P = { size?: number; color?: string };

const glyphs: Record<Glyph, (c: string) => React.ReactNode> = {
  wheel: (c) => (<G><Circle cx={24} cy={24} r={16} stroke={c} strokeWidth={4} fill="none" /><Circle cx={24} cy={24} r={4} fill={c} />{[0, 45, 90, 135].map((a) => (<Line key={a} x1={24} y1={24} x2={24 + 16 * Math.cos((a * Math.PI) / 180)} y2={24 + 16 * Math.sin((a * Math.PI) / 180)} stroke={c} strokeWidth={3} />))}{[0, 45, 90, 135].map((a) => (<Line key={`b${a}`} x1={24} y1={24} x2={24 - 16 * Math.cos((a * Math.PI) / 180)} y2={24 - 16 * Math.sin((a * Math.PI) / 180)} stroke={c} strokeWidth={3} />))}</G>),
  lantern: (c) => (<G><Rect x={16} y={14} width={16} height={22} rx={4} fill={c} /><Rect x={19} y={8} width={10} height={5} rx={2} fill={c} /><Path d="M24 18 q4 6 0 12 q-4 -6 0 -12z" fill="#FFF6D6" /><Rect x={14} y={36} width={20} height={4} rx={2} fill={c} /></G>),
  brush: (c) => (<G><Rect x={21} y={6} width={6} height={22} rx={3} fill={c} transform="rotate(30 24 24)" /><Path d="M14 30 q-4 8 -8 10 q10 2 14 -6z" fill={c} /></G>),
  fire: (c) => (<G><Path d="M24 8 C30 16 34 20 32 28 C31 34 27 38 24 38 C19 38 15 34 15 28 C15 22 20 20 21 14 C23 18 24 20 26 21 C26 16 25 12 24 8z" fill={c} /><Rect x={12} y={38} width={24} height={4} rx={2} fill={c} /></G>),
  coins: (c) => (<G><Circle cx={19} cy={26} r={10} fill={c} /><Circle cx={29} cy={20} r={10} fill={c} opacity={0.75} /><Path d="M27 16 v8 M31 16 v8" stroke="#FFF" strokeWidth={2} /></G>),
  ledger: (c) => (<G><Rect x={11} y={8} width={26} height={32} rx={3} fill={c} /><Line x1={16} y1={16} x2={32} y2={16} stroke="#FFF" strokeWidth={2} /><Line x1={16} y1={22} x2={32} y2={22} stroke="#FFF" strokeWidth={2} /><Line x1={16} y1={28} x2={27} y2={28} stroke="#FFF" strokeWidth={2} /></G>),
  pump: (c) => (<G><Rect x={18} y={12} width={10} height={26} rx={3} fill={c} /><Path d="M28 16 h8 v4 h-8z" fill={c} /><Path d="M22 12 l-8 -4" stroke={c} strokeWidth={4} strokeLinecap="round" /><Path d="M36 22 q2 6 0 10 q-2 -4 0 -10z" fill={colors.river} /></G>),
  flask: (c) => (<G><Path d="M20 8 h8 v10 l9 18 a3 3 0 0 1 -3 4 h-20 a3 3 0 0 1 -3 -4 l9 -18z" fill={c} /><Path d="M16 32 h16 l2 4 h-20z" fill="#FFF" opacity={0.5} /></G>),
  poster: (c) => (<G><Rect x={10} y={8} width={28} height={32} rx={3} fill={c} /><Circle cx={19} cy={18} r={4} fill="#FFF" /><Path d="M12 36 l9 -10 l6 6 l4 -4 l5 8z" fill="#FFF" opacity={0.8} /></G>),
  book: (c) => (<G><Path d="M8 12 q8 -4 16 2 v26 q-8 -6 -16 -2z" fill={c} /><Path d="M40 12 q-8 -4 -16 2 v26 q8 -6 16 -2z" fill={c} opacity={0.8} /></G>),
  stall: (c) => (<G><Path d="M8 18 l4 -8 h24 l4 8z" fill={c} /><Rect x={10} y={18} width={28} height={4} fill={c} opacity={0.7} /><Rect x={12} y={22} width={3} height={16} fill={c} /><Rect x={33} y={22} width={3} height={16} fill={c} /><Rect x={12} y={30} width={24} height={4} fill={c} /></G>),
  files: (c) => (<G><Rect x={10} y={12} width={22} height={28} rx={3} fill={c} opacity={0.6} /><Rect x={16} y={8} width={22} height={28} rx={3} fill={c} /><Line x1={20} y1={16} x2={34} y2={16} stroke="#FFF" strokeWidth={2} /><Line x1={20} y1={22} x2={34} y2={22} stroke="#FFF" strokeWidth={2} /></G>),
  wrench: (c) => (<G><Path d="M30 8 a9 9 0 0 0 -8 12 l-12 12 a3 3 0 0 0 4 4 l12 -12 a9 9 0 0 0 12 -8 l-5 3 l-4 -4z" fill={c} /></G>),
  magnifier: (c) => (<G><Circle cx={21} cy={21} r={10} stroke={c} strokeWidth={4} fill="none" /><Line x1={28} y1={28} x2={38} y2={38} stroke={c} strokeWidth={5} strokeLinecap="round" /></G>),
  palette: (c) => (<G><Path d="M24 8 a16 16 0 1 0 0 32 c3 0 4 -3 2 -5 c-2 -2 -1 -5 2 -5 h4 a8 8 0 0 0 8 -8 c0 -8 -7 -14 -16 -14z" fill={c} /><Circle cx={16} cy={20} r={3} fill="#FFF" /><Circle cx={24} cy={15} r={3} fill="#FFF" /><Circle cx={32} cy={20} r={3} fill="#FFF" /></G>),
  hands: (c) => (<G><Path d="M6 28 q6 -6 12 -2 l6 4 q2 2 0 4 l-6 -2" fill="none" stroke={c} strokeWidth={4} strokeLinecap="round" /><Path d="M42 28 q-6 -6 -12 -2 l-8 6 q-2 2 0 4 l8 -2 q6 2 12 -2" fill="none" stroke={c} strokeWidth={4} strokeLinecap="round" /><Circle cx={24} cy={14} r={5} fill={c} /></G>),
  megaphone: (c) => (<G><Path d="M10 20 h8 l16 -10 v28 l-16 -10 h-8z" fill={c} /><Rect x={14} y={28} width={5} height={10} rx={2} fill={c} /></G>),
  clipboard: (c) => (<G><Rect x={11} y={10} width={26} height={30} rx={3} fill={c} /><Rect x={18} y={7} width={12} height={6} rx={2} fill={colors.ink} /><Path d="M16 24 l4 4 l8 -8" stroke="#FFF" strokeWidth={3} fill="none" /></G>),
};

export function TaskGlyph({ glyph, size = 40, color = colors.primary }: P & { glyph: Glyph }) {
  return (<Svg width={size} height={size} viewBox="0 0 48 48" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{glyphs[glyph](color)}</Svg>);
}

export const CheckIcon = ({ size = 20, color = colors.success }: P) => (<Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M4 12.5 l5 5 L20 6.5" stroke={color} strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>);
export const LockIcon = ({ size = 18, color = colors.locked }: P) => (<Svg width={size} height={size} viewBox="0 0 24 24"><Rect x={5} y={11} width={14} height={10} rx={2} fill={color} /><Path d="M8 11 V8 a4 4 0 0 1 8 0 V11" stroke={color} strokeWidth={2.4} fill="none" /></Svg>);
export const BulbIcon = ({ size = 20, color = colors.accent }: P) => (<Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M12 3 a6 6 0 0 0 -3.5 10.9 V16 h7 v-2.1 A6 6 0 0 0 12 3z" fill={color} /><Rect x={9} y={17} width={6} height={2} rx={1} fill={color} /><Rect x={10} y={20} width={4} height={2} rx={1} fill={color} /></Svg>);
export const CoinIcon = ({ size = 18 }: P) => (<Svg width={size} height={size} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={10} fill="#E3B23C" /><Circle cx={12} cy={12} r={6.5} fill="none" stroke="#B8861B" strokeWidth={1.6} /></Svg>);
export const StarIcon = ({ size = 18, color = colors.accent }: P) => (<Svg width={size} height={size} viewBox="0 0 24 24"><Polygon points="12,2 15,9 22,9.5 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9.5 9,9" fill={color} /></Svg>);
export const BackIcon = ({ size = 22, color = colors.ink }: P) => (<Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M15 5 L8 12 L15 19" stroke={color} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>);
export const TentIcon = ({ size = 40, color = colors.mountain }: P) => (<Svg width={size} height={size} viewBox="0 0 48 48"><Path d="M6 40 L24 10 L42 40z" fill={color} /><Path d="M24 22 L18 40 h12z" fill={colors.surface} opacity={0.7} /></Svg>);

export const MATERIAL_COLORS = { wood: '#B07A45', metal: '#7D8C99', cloth: '#C25B7A' } as const;
export function MaterialIcon({ material, size = 18 }: { material: 'wood' | 'metal' | 'cloth'; size?: number }) {
  const c = MATERIAL_COLORS[material];
  if (material === 'wood') return (<Svg width={size} height={size} viewBox="0 0 24 24"><Rect x={2} y={7} width={20} height={10} rx={3} fill={c} /><Circle cx={18} cy={12} r={3} fill="#E6C49A" /></Svg>);
  if (material === 'metal') return (<Svg width={size} height={size} viewBox="0 0 24 24"><Polygon points="4,16 8,8 20,8 16,16" fill={c} /><Polygon points="4,16 16,16 16,19 4,19" fill="#5E6B76" /></Svg>);
  return (<Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M3 6 q9 -4 18 0 v12 q-9 -4 -18 0z" fill={c} /></Svg>);
}

/** Ustad Mehr — the original guide character (an elderly mapmaker). */
export function UstadMehr({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel="Ustad Mehr">
      <Circle cx={32} cy={32} r={31} fill={colors.primarySoft} />
      <Path d="M14 60 q4 -18 18 -18 q14 0 18 18z" fill={colors.primary} />
      <Circle cx={32} cy={28} r={12} fill="#C99A6E" />
      <Path d="M20 24 q12 -14 24 0 q-2 -10 -12 -10 q-10 0 -12 10z" fill="#F2F2F2" />
      <Path d="M24 33 q8 10 16 0 q-2 8 -8 9 q-6 -1 -8 -9z" fill="#F2F2F2" />
      <Circle cx={27} cy={28} r={1.6} fill={colors.ink} />
      <Circle cx={37} cy={28} r={1.6} fill={colors.ink} />
      <Rect x={24} y={25} width={6} height={5} rx={2} fill="none" stroke={colors.ink} strokeWidth={1.2} />
      <Rect x={34} y={25} width={6} height={5} rx={2} fill="none" stroke={colors.ink} strokeWidth={1.2} />
    </Svg>
  );
}

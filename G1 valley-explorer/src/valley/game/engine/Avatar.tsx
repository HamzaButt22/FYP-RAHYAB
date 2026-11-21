/** The student's traveller. Original design; 4 styles × 3 skin tones × unlockable outfit colours. */
import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { Dir } from './tilemap';

export type AvatarStyle = 'hijab' | 'braid' | 'short' | 'cap';
export interface AvatarLook { style: AvatarStyle; skin: number; outfit: string }

export const SKINS = ['#F1C9A5', '#D39B6E', '#9B6744'];
export const OUTFITS = ['#2F7F9E', '#C2563A', '#6B5BA8', '#3E8E5A', '#D19A2B', '#C24F7E'];
/** outfit colours unlock as stops are completed (cosmetic reward only) */
export const outfitsUnlocked = (stopsDone: number) => OUTFITS.slice(0, Math.min(OUTFITS.length, 2 + Math.floor(stopsDone / 2)));
export const DEFAULT_LOOK: AvatarLook = { style: 'hijab', skin: 1, outfit: OUTFITS[0] };

export function Avatar({ look, facing = 'down', size = 44 }: { look: AvatarLook; facing?: Dir; size?: number }) {
  const skin = SKINS[look.skin] ?? SKINS[1];
  const back = facing === 'up';
  const flip = facing === 'left';
  const hair = '#2B1D14';
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <G transform={flip ? 'translate(48 0) scale(-1 1)' : undefined}>
        <Ellipse cx={24} cy={45} rx={12} ry={2.5} fill="rgba(0,0,0,0.18)" />
        {/* legs */}
        <Rect x={17} y={36} width={5} height={8} rx={2} fill="#3B3B4F" />
        <Rect x={26} y={36} width={5} height={8} rx={2} fill="#3B3B4F" />
        {/* body (kameez) */}
        <Path d="M13 38 Q13 24 24 24 Q35 24 35 38z" fill={look.outfit} />
        <Rect x={11} y={27} width={5} height={9} rx={2.5} fill={look.outfit} />
        <Rect x={32} y={27} width={5} height={9} rx={2.5} fill={look.outfit} />
        <Circle cx={13.5} cy={37} r={2.4} fill={skin} />
        <Circle cx={34.5} cy={37} r={2.4} fill={skin} />
        {/* head */}
        {look.style === 'hijab' ? (
          <>
            <Path d="M12 20 Q12 6 24 6 Q36 6 36 20 Q36 28 24 29 Q12 28 12 20z" fill={look.outfit} opacity={0.85} />
            {!back ? <Ellipse cx={24} cy={18} rx={8} ry={9} fill={skin} /> : null}
          </>
        ) : (
          <>
            <Circle cx={24} cy={17} r={10} fill={back ? hair : skin} />
            {look.style === 'braid' ? <Path d="M14 16 Q14 6 24 6 Q34 6 34 16 Q30 10 24 10 Q18 10 14 16z M31 14 Q37 22 33 30" fill={hair} stroke={hair} strokeWidth={2} /> : null}
            {look.style === 'short' ? <Path d="M14 15 Q14 6 24 6 Q34 6 34 15 Q30 10 24 11 Q18 10 14 15z" fill={hair} /> : null}
            {look.style === 'cap' ? <><Path d="M13 14 Q13 5 24 5 Q35 5 35 14z" fill={look.outfit} /><Rect x={24} y={12} width={14} height={3} rx={1.5} fill={look.outfit} /></> : null}
          </>
        )}
        {!back ? (
          <>
            <Circle cx={21} cy={18} r={1.4} fill="#222" />
            <Circle cx={28} cy={18} r={1.4} fill="#222" />
            <Path d="M21.5 22 Q24.5 24 27.5 22" stroke="#8A4B36" strokeWidth={1.4} fill="none" strokeLinecap="round" />
          </>
        ) : null}
      </G>
    </Svg>
  );
}

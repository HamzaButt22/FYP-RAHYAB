/** Object sprites for the tile world (original vector art). */
import React from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { ALL_TASKS, type Glyph } from '../../core/tasks';
import { TaskGlyph, TentIcon, UstadMehr } from '../../ui/icons';

const SIGN_GLYPH: Record<string, Glyph> = { yard: 'wheel', hill: 'lantern', wall: 'brush', camp: 'fire', bazaar: 'coins', ledger: 'ledger' };
const STOP_LOOK: Record<string, { roof: string; body: string; glyph: Glyph }> = {
  crossroads_caravan: { roof: '#B5653A', body: '#F3E2C3', glyph: 'wheel' },
  workshop_orders: { roof: '#7D5A3C', body: '#EBD3AE', glyph: 'coins' },
  career_workshop: { roof: '#A8443D', body: '#F4E4CC', glyph: 'wrench' },
  map_room: { roof: '#3E6E8E', body: '#E6EEF2', glyph: 'magnifier' },
  pattern_gate: { roof: '#6F7A84', body: '#D8DDE1', glyph: 'palette' },
  park_mission: { roof: '#3E8A57', body: '#E9F3E3', glyph: 'hands' },
  vault_locks: { roof: '#5A4E6E', body: '#DCD6E6', glyph: 'clipboard' },
};

function Building({ id, s }: { id: string; s: number }) {
  const l = STOP_LOOK[id];
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48">
      <Rect x={7} y={20} width={34} height={24} rx={2} fill={l.body} stroke="#6B5844" strokeWidth={1.2} />
      <Path d="M3 22 L24 5 L45 22z" fill={l.roof} />
      <Rect x={20} y={30} width={8} height={14} rx={1.5} fill="#7A5236" />
      <G transform="translate(9 22) scale(0.3)"><TaskGlyph glyph={l.glyph} size={48} color={l.roof} /></G>
    </Svg>
  );
}

function Sign({ glyph, s }: { glyph: Glyph; s: number }) {
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48">
      <Rect x={22} y={24} width={4} height={20} fill="#8A5A3B" />
      <Rect x={6} y={6} width={36} height={22} rx={4} fill="#E8CFA2" stroke="#8A5A3B" strokeWidth={2} />
      <G transform="translate(15 8) scale(0.38)"><TaskGlyph glyph={glyph} size={48} color="#6B4A30" /></G>
    </Svg>
  );
}

function Station({ glyph, tint, s }: { glyph: Glyph; tint: string; s: number }) {
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48">
      <Rect x={4} y={26} width={40} height={16} rx={3} fill="#A57449" />
      <Rect x={8} y={42} width={4} height={5} fill="#7A5236" />
      <Rect x={36} y={42} width={4} height={5} fill="#7A5236" />
      <Circle cx={24} cy={18} r={15} fill="#FFFFFF" stroke={tint} strokeWidth={3} />
      <G transform="translate(12 6) scale(0.5)"><TaskGlyph glyph={glyph} size={48} color={tint} /></G>
    </Svg>
  );
}

function Mayor({ s }: { s: number }) {
  return (
    <Svg width={s} height={s} viewBox="0 0 64 64">
      <Circle cx={32} cy={32} r={31} fill="#FBE6D0" />
      <Path d="M14 60 q4 -18 18 -18 q14 0 18 18z" fill="#6B5BA8" />
      <Path d="M18 30 Q18 12 32 12 Q46 12 46 30 Q46 42 32 43 Q18 42 18 30z" fill="#C24F7E" />
      <Circle cx={32} cy={28} r={10} fill="#D39B6E" />
      <Circle cx={28} cy={27} r={1.6} fill="#222" />
      <Circle cx={36} cy={27} r={1.6} fill="#222" />
      <Path d="M28 32 Q32 35 36 32" stroke="#8A4B36" strokeWidth={1.6} fill="none" />
    </Svg>
  );
}

function Door({ s }: { s: number }) {
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48">
      <Rect x={10} y={4} width={28} height={42} rx={3} fill="#8A5A3B" />
      <Rect x={14} y={8} width={20} height={34} rx={2} fill="#A57449" />
      <Circle cx={30} cy={26} r={2.2} fill="#E3B23C" />
    </Svg>
  );
}

export function Sprite({ sprite, size, tint }: { sprite: string; size: number; tint?: string }) {
  if (sprite === 'mehr') return <UstadMehr size={size} />;
  if (sprite === 'mayor') return <Mayor s={size} />;
  if (sprite === 'tent') return <TentIcon size={size} color="#C9874B" />;
  if (sprite === 'door') return <Door s={size} />;
  if (sprite === 'gate') return null; // drawn by the tile layer
  if (sprite.startsWith('sign:')) return <Sign glyph={SIGN_GLYPH[sprite.slice(5)] ?? 'ledger'} s={size} />;
  if (sprite.startsWith('stop:')) return <Building id={sprite.slice(5)} s={size} />;
  if (sprite.startsWith('task:')) {
    const t = ALL_TASKS[sprite.slice(5)];
    return t ? <Station glyph={t.glyph} tint={tint ?? t.tint} s={size} /> : null;
  }
  return null;
}

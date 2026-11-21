/** Small original item icons used inside mini-games. */
import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

export type ItemKey =
  | 'part' | 'oil' | 'sampleA' | 'sampleB' | 'sampleC' | 'food' | 'map' | 'log' | 'coins' | 'crates' | 'stamp' | 'label' | 'pencil' | 'flyer';

export function ItemIcon({ item, size = 48 }: { item: ItemKey; size?: number }) {
  const body = (() => {
    switch (item) {
      case 'part': return <G><Circle cx={24} cy={24} r={13} fill="#8C9AA8" /><Circle cx={24} cy={24} r={5} fill="#5E6B76" />{[0, 60, 120, 180, 240, 300].map((a) => <Rect key={a} x={22} y={6} width={4} height={8} fill="#8C9AA8" transform={`rotate(${a} 24 24)`} />)}</G>;
      case 'oil': return <G><Rect x={12} y={20} width={20} height={20} rx={4} fill="#C9874B" /><Path d="M32 24 L42 16 L44 19 L34 28z" fill="#C9874B" /><Rect x={18} y={14} width={8} height={6} rx={2} fill="#7A5236" /></G>;
      case 'sampleA': case 'sampleB': case 'sampleC': {
        const c = { sampleA: '#E3B23C', sampleB: '#5B8BC9', sampleC: '#C24F7E' }[item];
        return <G><Rect x={18} y={6} width={12} height={6} rx={2} fill="#7A5236" /><Path d="M16 12 h16 v24 a8 8 0 0 1 -16 0z" fill="#EAF4F7" stroke="#8C9AA8" strokeWidth={2} /><Path d="M17 26 h14 v10 a7 7 0 0 1 -14 0z" fill={c} /></G>;
      }
      case 'food': return <G><Ellipse cx={24} cy={30} rx={16} ry={7} fill="#C9874B" /><Ellipse cx={24} cy={26} rx={13} ry={6} fill="#F3E2C3" /><Circle cx={19} cy={24} r={3} fill="#E08A3C" /><Circle cx={27} cy={23} r={3} fill="#5E9B6E" /></G>;
      case 'map': return <G><Path d="M8 12 L18 8 L30 12 L40 8 V36 L30 40 L18 36 L8 40z" fill="#F3E2C3" stroke="#8A5A3B" strokeWidth={2} /><Path d="M14 30 Q22 18 34 20" stroke="#D2607F" strokeWidth={2} strokeDasharray="3 3" fill="none" /></G>;
      case 'log': return <G><Rect x={8} y={18} width={32} height={12} rx={6} fill="#8A5A3B" /><Circle cx={36} cy={24} r={5} fill="#D9B98A" /></G>;
      case 'coins': return <G><Ellipse cx={24} cy={34} rx={13} ry={5} fill="#B8861B" /><Ellipse cx={24} cy={28} rx={13} ry={5} fill="#E3B23C" /><Ellipse cx={24} cy={22} rx={13} ry={5} fill="#F3C34D" /></G>;
      case 'crates': return <G><Rect x={8} y={20} width={16} height={16} fill="#B07A45" stroke="#7A5236" strokeWidth={2} /><Rect x={24} y={20} width={16} height={16} fill="#C9874B" stroke="#7A5236" strokeWidth={2} /><Rect x={16} y={6} width={16} height={14} fill="#A57449" stroke="#7A5236" strokeWidth={2} /></G>;
      case 'stamp': return <G><Rect x={18} y={8} width={12} height={16} rx={4} fill="#5E9C8E" /><Rect x={10} y={24} width={28} height={8} rx={2} fill="#2F5E54" /><Rect x={12} y={34} width={24} height={4} rx={1} fill="#C24F7E" /></G>;
      case 'label': return <G><Path d="M8 14 H32 L40 24 L32 34 H8z" fill="#F3E2C3" stroke="#8A5A3B" strokeWidth={2} /><Circle cx={33} cy={24} r={2.5} fill="#8A5A3B" /></G>;
      case 'pencil': return <G><Rect x={10} y={20} width={26} height={8} fill="#E3B23C" transform="rotate(-30 24 24)" /><Path d="M36 14 L42 10 L40 18z" fill="#2F3E46" /></G>;
      case 'flyer': return <G><Rect x={12} y={6} width={24} height={34} rx={2} fill="#FFFFFF" stroke="#C2A23A" strokeWidth={2} /><Rect x={16} y={12} width={16} height={8} fill="#C2A23A" /><Rect x={16} y={24} width={16} height={3} fill="#C8C8C8" /><Rect x={16} y={30} width={10} height={3} fill="#C8C8C8" /></G>;
    }
  })();
  return <Svg width={size} height={size} viewBox="0 0 48 48">{body}</Svg>;
}

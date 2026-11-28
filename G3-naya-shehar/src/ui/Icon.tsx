import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'pause' | 'play' | 'speaker' | 'speaking' | 'home' | 'smile' | 'balance' | 'coin' | 'lock' | 'check' | 'star'
  | 'back' | 'close' | 'gear' | 'map' | 'flask' | 'brush' | 'hands' | 'stall' | 'ledger' | 'wrench' | 'search'
  | 'megaphone' | 'clipboard' | 'heart' | 'letter' | 'trophy' | 'calendar' | 'person' | 'up' | 'down' | 'undo'
  | 'bus' | 'hammer' | 'eye' | 'sparkle' | 'access' | 'arrow';

const P = (d: string, c: string, w = 2.4) => <Path d={d} stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />;

/** Original bold-line icon set, 24×24 grid. Always paired with a text label somewhere nearby. */
export function Icon({ name, size = 24, color = '#2B2433', fill }: { name: IconName; size?: number; color?: string; fill?: string }) {
  const f = fill ?? 'none';
  const body = (() => {
    switch (name) {
      case 'pause': return <G><Rect x={6} y={5} width={4} height={14} rx={1.5} fill={color} /><Rect x={14} y={5} width={4} height={14} rx={1.5} fill={color} /></G>;
      case 'play': return <Path d="M8 5.5v13l11-6.5z" fill={color} />;
      case 'speaker': return <G>{P('M4 9.5h3.5L12 6v12l-4.5-3.5H4z', color)}{P('M15.5 9a4 4 0 0 1 0 6', color)}</G>;
      case 'speaking': return <G>{P('M4 9.5h3.5L12 6v12l-4.5-3.5H4z', color)}{P('M15.5 9a4 4 0 0 1 0 6', color)}{P('M18 6.5a7.5 7.5 0 0 1 0 11', color)}</G>;
      case 'home': return <G>{P('M4 11.5 12 5l8 6.5', color)}<Path d="M6.5 10v9h11v-9" stroke={color} strokeWidth={2.4} strokeLinejoin="round" fill={f} />{P('M10.5 19v-4.5h3V19', color)}</G>;
      case 'smile': return <G><Circle cx={12} cy={12} r={8} stroke={color} strokeWidth={2.4} fill={f} />{P('M8.5 13.5a4 4 0 0 0 7 0', color)}<Circle cx={9.3} cy={10} r={1.2} fill={color} /><Circle cx={14.7} cy={10} r={1.2} fill={color} /></G>;
      case 'balance': return <G>{P('M12 4v16M7 20h10M5 8h14', color)}{P('M5 8l-2.5 5h5zM19 8l-2.5 5h5z', color, 2)}</G>;
      case 'coin': return <G><Circle cx={12} cy={12} r={8} stroke={color} strokeWidth={2.4} fill={f} />{P('M12 8v8M9.5 10.2c0-1.2 1.1-1.7 2.5-1.7s2.5.6 2.5 1.6-1 1.4-2.5 1.8-2.5.8-2.5 1.9 1.1 1.7 2.5 1.7 2.5-.5 2.5-1.7', color, 1.8)}</G>;
      case 'lock': return <G><Rect x={5.5} y={10.5} width={13} height={9} rx={2.5} stroke={color} strokeWidth={2.4} fill={f} />{P('M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5', color)}<Circle cx={12} cy={15} r={1.4} fill={color} /></G>;
      case 'check': return P('M5 12.5l4.5 4.5L19 7.5', color, 3);
      case 'star': return <Path d="M12 3.8l2.5 5.2 5.6.7-4.1 3.9 1 5.6-5-2.7-5 2.7 1-5.6-4.1-3.9 5.6-.7z" stroke={color} strokeWidth={2} strokeLinejoin="round" fill={fill ?? color} />;
      case 'back': return P('M15 5l-7 7 7 7', color, 2.8);
      case 'arrow': return P('M5 12h13M13 6l6 6-6 6', color, 2.6);
      case 'close': return P('M6 6l12 12M18 6 6 18', color, 2.8);
      case 'gear': return <G><Circle cx={12} cy={12} r={3.2} stroke={color} strokeWidth={2.2} fill="none" />{P('M12 3.5v2.5M12 18v2.5M3.5 12H6M18 12h2.5M6 6l1.8 1.8M16.2 16.2 18 18M6 18l1.8-1.8M16.2 7.8 18 6', color, 2.2)}</G>;
      case 'map': return <G><Path d="M3.5 6.5 9 4.5l6 2 5.5-2v13l-5.5 2-6-2-5.5 2z" stroke={color} strokeWidth={2.2} strokeLinejoin="round" fill={f} />{P('M9 4.5v13M15 6.5v13', color, 2)}</G>;
      case 'flask': return <G><Path d="M9.5 3.5h5M10.5 3.5v5.5L5.5 18a1.8 1.8 0 0 0 1.6 2.6h9.8a1.8 1.8 0 0 0 1.6-2.6L13.5 9V3.5" stroke={color} strokeWidth={2.2} strokeLinejoin="round" fill={f} />{P('M8 15h8', color, 2)}</G>;
      case 'brush': return <G>{P('M14.5 4.5l5 5-7 7-5-5z', color)}<Path d="M7.5 11.5 5 14c-1.5 1.5-1 3.5-2 5 2 .5 4-.2 5.5-1.7l2.5-2.8" stroke={color} strokeWidth={2.2} strokeLinejoin="round" fill={f} /></G>;
      case 'hands': return <G><Path d="M12 20s-7-4.3-7-9.2A3.8 3.8 0 0 1 12 9a3.8 3.8 0 0 1 7 1.8C19 15.7 12 20 12 20z" stroke={color} strokeWidth={2.2} strokeLinejoin="round" fill={f} /></G>;
      case 'heart': return <Path d="M12 20s-7-4.3-7-9.2A3.8 3.8 0 0 1 12 9a3.8 3.8 0 0 1 7 1.8C19 15.7 12 20 12 20z" fill={fill ?? color} stroke={color} strokeWidth={1.5} />;
      case 'stall': return <G>{P('M4 9.5 5.5 5h13L20 9.5', color)}<Path d="M4 9.5c0 1.4 1.1 2.3 2.7 2.3s2.6-.9 2.6-2.3c0 1.4 1.1 2.3 2.7 2.3s2.7-.9 2.7-2.3c0 1.4 1 2.3 2.6 2.3S20 10.9 20 9.5" stroke={color} strokeWidth={2.2} fill={f} />{P('M6 12v7.5h12V12', color)}</G>;
      case 'ledger': return <G><Rect x={5} y={3.5} width={14} height={17} rx={2} stroke={color} strokeWidth={2.2} fill={f} />{P('M9 8h6M9 12h6M9 16h4', color, 2)}</G>;
      case 'wrench': return <Path d="M14.5 4a5 5 0 0 0-4.6 6.8L4.5 16.2a1.9 1.9 0 0 0 2.7 2.7l5.4-5.4A5 5 0 0 0 19.4 9l-3 .8-1.8-1.8.8-3z" stroke={color} strokeWidth={2.2} strokeLinejoin="round" fill={f} />;
      case 'search': return <G><Circle cx={10.5} cy={10.5} r={6} stroke={color} strokeWidth={2.4} fill={f} />{P('M15 15l5 5', color, 2.8)}</G>;
      case 'megaphone': return <G><Path d="M4 10v4h3l9 4.5v-13L7 10z" stroke={color} strokeWidth={2.2} strokeLinejoin="round" fill={f} />{P('M7.5 14l1.5 5h2.5l-1-4', color, 2)}{P('M19 10v4', color)}</G>;
      case 'clipboard': return <G><Rect x={5.5} y={5} width={13} height={15.5} rx={2} stroke={color} strokeWidth={2.2} fill={f} /><Rect x={9} y={3} width={6} height={4} rx={1.2} fill={color} />{P('M9 11.5l2 2 4-4', color, 2)}</G>;
      case 'letter': return <G><Rect x={3.5} y={6} width={17} height={12} rx={2} stroke={color} strokeWidth={2.2} fill={f} />{P('M4 7l8 6 8-6', color, 2)}</G>;
      case 'trophy': return <G><Path d="M8 4h8v5a4 4 0 0 1-8 0z" stroke={color} strokeWidth={2.2} fill={f} />{P('M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v3M8.5 20h7M10 16h4v4h-4z', color, 2)}</G>;
      case 'calendar': return <G><Rect x={4} y={5.5} width={16} height={14.5} rx={2.5} stroke={color} strokeWidth={2.2} fill={f} />{P('M4 10h16M8.5 3.5v4M15.5 3.5v4', color, 2.2)}</G>;
      case 'person': return <G><Circle cx={12} cy={8} r={3.8} stroke={color} strokeWidth={2.2} fill={f} />{P('M4.5 20a7.5 7.5 0 0 1 15 0', color)}</G>;
      case 'up': return P('M6 15l6-6 6 6', color, 2.8);
      case 'down': return P('M6 9l6 6 6-6', color, 2.8);
      case 'undo': return P('M9 7 4.5 11.5 9 16M5 11.5h9a5 5 0 0 1 0 10h-2', color, 2.4);
      case 'bus': return <G><Rect x={4.5} y={4} width={15} height={13} rx={3} stroke={color} strokeWidth={2.2} fill={f} />{P('M4.5 11h15M8 20v-3M16 20v-3', color, 2.2)}<Circle cx={8} cy={14} r={1.1} fill={color} /><Circle cx={16} cy={14} r={1.1} fill={color} /></G>;
      case 'hammer': return <G>{P('M13 8 5 16a1.8 1.8 0 0 0 2.6 2.6l8-8', color)}<Path d="M11.5 5.5 14 3l6.5 6.5-2.5 2.5z" stroke={color} strokeWidth={2.2} strokeLinejoin="round" fill={f} /></G>;
      case 'eye': return <G><Path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" stroke={color} strokeWidth={2.2} fill={f} /><Circle cx={12} cy={12} r={2.8} fill={color} /></G>;
      case 'sparkle': return <Path d="M12 3l1.8 5.4L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.6zM18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" fill={color} />;
      case 'access': return <G><Circle cx={12} cy={4.8} r={1.8} fill={color} />{P('M5 8.5l7 1.5 7-1.5M12 10v4.5l-3 5.5M12 14.5l3 5.5', color, 2.4)}</G>;
    }
  })();
  return <Svg width={size} height={size} viewBox="0 0 24 24">{body}</Svg>;
}

export const DISTRICT_ICON: Record<string, IconName> = { gear: 'wrench', flask: 'flask', brush: 'brush', hands: 'hands', stall: 'stall', ledger: 'ledger' };

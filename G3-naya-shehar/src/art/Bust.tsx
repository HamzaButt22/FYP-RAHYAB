import { useEffect } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Expression, CHARACTERS, CharacterId } from '@/game/characters/characters';
import { Avatar } from '@/game/avatar';
import { shade } from './iso';

export interface BustLook {
  skin: string;
  face: 'round' | 'oval' | 'square';
  hair: 'short' | 'curly' | 'ponytail' | 'long' | 'bun' | 'dupatta' | 'cap' | 'beanie' | 'grey_short';
  hairColour: string;
  outfit: 'kurta' | 'kameez' | 'hoodie' | 'uniform' | 'waistcoat' | 'coat';
  outfitColour: string;
  accent: string;
  glasses?: boolean;
  beard?: 'white' | 'dark';
  scarf?: boolean;
  badge?: boolean;
  backpack?: boolean;
}

export const lookFromAvatar = (a: Avatar): BustLook => ({
  skin: a.skin, face: a.face, hair: a.hair, hairColour: a.hairColour, outfit: a.outfit, outfitColour: a.outfitColour,
  accent: shade(a.outfitColour, 0.55), glasses: a.accessory === 'glasses', scarf: a.accessory === 'scarf', badge: a.accessory === 'badge', backpack: a.accessory === 'backpack',
});

export function lookForCharacter(id: CharacterId): BustLook {
  const l = CHARACTERS[id].look;
  const hair = l.hairStyle === 'grey_short' ? 'grey_short' : (l.hairStyle as BustLook['hair']);
  const outfit: BustLook['outfit'] = id === 'hina' ? 'coat' : id === 'rafiq' ? 'waistcoat' : id === 'bilal' ? 'hoodie' : id === 'kamran' ? 'kurta' : 'kameez';
  return { skin: l.skin, face: id === 'rafiq' || id === 'kamran' ? 'square' : id === 'zoya' || id === 'hina' ? 'oval' : 'round', hair, hairColour: l.hair, outfit, outfitColour: l.outfit, accent: l.outfitAccent, glasses: l.glasses, beard: l.beard };
}

/** Head-and-shoulders portrait. Original design, drawn in a 120×120 box. */
export function BustArt({ look, expression = 'happy', size = 120 }: { look: BustLook; expression?: Expression; size?: number }) {
  const skinShade = shade(look.skin, -0.15);
  const hairC = look.hair === 'grey_short' ? '#D6D6D6' : look.hairColour;
  const headR = look.face === 'oval' ? { rx: 21, ry: 25 } : { rx: 23, ry: 24 };
  const cx = 60, cy = 56;
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {/* hair & things behind the head */}
      {look.hair === 'long' ? <Path d={`M34 50 Q32 100 44 108 L76 108 Q88 100 86 50 Z`} fill={hairC} /> : null}
      {look.hair === 'ponytail' ? <Path d="M78 46 Q100 56 92 86 Q88 70 76 64 Z" fill={hairC} /> : null}
      {look.hair === 'dupatta' ? <Path d="M28 60 Q26 28 60 24 Q94 28 92 60 L100 112 L20 112 Z" fill={look.accent} /> : null}
      {look.outfit === 'hoodie' ? <Path d="M30 96 Q30 74 60 74 Q90 74 90 96 Z" fill={shade(look.outfitColour, -0.2)} /> : null}
      {look.backpack ? <G><Rect x={22} y={88} width={14} height={28} rx={5} fill="#5D5468" /><Rect x={84} y={88} width={14} height={28} rx={5} fill="#5D5468" /></G> : null}

      {/* body */}
      <Path d="M16 120 Q18 92 44 86 L76 86 Q102 92 104 120 Z" fill={look.outfit === 'coat' ? '#FFFFFF' : look.outfitColour} />
      <Outfit look={look} />
      {/* neck */}
      <Rect x={52} y={74} width={16} height={14} rx={6} fill={skinShade} />
      {/* ears */}
      <Ellipse cx={cx - headR.rx + 1} cy={cy + 2} rx={4} ry={6} fill={skinShade} />
      <Ellipse cx={cx + headR.rx - 1} cy={cy + 2} rx={4} ry={6} fill={skinShade} />
      {/* head */}
      {look.face === 'square'
        ? <Rect x={cx - 22} y={cy - 24} width={44} height={50} rx={17} fill={look.skin} />
        : <Ellipse cx={cx} cy={cy} rx={headR.rx} ry={headR.ry} fill={look.skin} />}
      <Ellipse cx={cx - 12} cy={cy + 9} rx={5} ry={3} fill="#E58C8C" opacity={0.35} />
      <Ellipse cx={cx + 12} cy={cy + 9} rx={5} ry={3} fill="#E58C8C" opacity={0.35} />
      {look.beard ? <Path d={`M${cx - 20} ${cy + 2} Q${cx - 18} ${cy + 30} ${cx} ${cy + 31} Q${cx + 18} ${cy + 30} ${cx + 20} ${cy + 2} Q${cx + 12} ${cy + 16} ${cx} ${cy + 16} Q${cx - 12} ${cy + 16} ${cx - 20} ${cy + 2} Z`} fill={look.beard === 'white' ? '#E8E8E8' : '#2A1E17'} /> : null}
      <Face expression={expression} cx={cx} cy={cy} beard={!!look.beard} />
      <Hair look={look} hairC={hairC} cx={cx} cy={cy} />
      {look.glasses ? (
        <G>
          <Circle cx={cx - 9} cy={cy - 1} r={7} stroke="#3B3048" strokeWidth={2.2} fill="#FFFFFF" fillOpacity={0.15} />
          <Circle cx={cx + 9} cy={cy - 1} r={7} stroke="#3B3048" strokeWidth={2.2} fill="#FFFFFF" fillOpacity={0.15} />
          <Path d={`M${cx - 2} ${cy - 1} h4`} stroke="#3B3048" strokeWidth={2} />
        </G>
      ) : null}
      {look.scarf ? <Path d="M40 84 Q60 96 80 84 L82 92 Q60 104 38 92 Z" fill={look.accent} stroke={shade(look.accent, -0.2)} strokeWidth={1} /> : null}
      {look.badge ? <G><Circle cx={78} cy={102} r={7} fill="#FFD166" stroke="#D9822B" strokeWidth={2} /><Path d="M74.5 102 l2.5 2.5 l4.5 -5" stroke="#2B2433" strokeWidth={1.8} fill="none" /></G> : null}
    </Svg>
  );
}

function Outfit({ look }: { look: BustLook }) {
  const c = look.outfitColour, dk = shade(c, -0.22);
  switch (look.outfit) {
    case 'kurta':
      return <G><Path d="M60 86 L54 104 L60 112 L66 104 Z" fill={dk} /><Path d="M60 90 V118" stroke={look.accent} strokeWidth={2} />{[96, 104, 112].map((y) => <Circle key={y} cx={60} cy={y} r={1.6} fill={look.accent} />)}</G>;
    case 'kameez':
      return <G><Path d="M46 86 Q60 98 74 86" stroke={look.accent} strokeWidth={3} fill="none" /><Path d="M28 104 Q40 96 54 112" stroke={look.accent} strokeWidth={5} fill="none" opacity={0.85} /></G>;
    case 'hoodie':
      return <G><Path d="M48 86 Q60 96 72 86" stroke={dk} strokeWidth={4} fill="none" /><Path d="M54 92 v12 M66 92 v12" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" /><Rect x={46} y={108} width={28} height={8} rx={3} fill={dk} /></G>;
    case 'uniform':
      return <G><Path d="M44 86 L60 100 L76 86 L74 120 L46 120 Z" fill="#FFFFFF" /><Path d="M44 86 L52 96 L60 88 L68 96 L76 86" stroke="#D9DEE4" strokeWidth={2} fill="none" /><Path d="M16 120 Q18 92 44 86 L50 120 Z M104 120 Q102 92 76 86 L70 120 Z" fill={c} /></G>;
    case 'waistcoat':
      return <G><Path d="M40 88 L58 120 L36 120 Q26 102 40 88 Z M80 88 L62 120 L84 120 Q94 102 80 88 Z" fill={look.accent} /><Circle cx={52} cy={106} r={1.6} fill="#FFFFFF" /><Circle cx={68} cy={106} r={1.6} fill="#FFFFFF" /></G>;
    case 'coat':
      return <G><Path d="M48 86 L60 102 L72 86 L76 120 L44 120 Z" fill={c} /><Path d="M48 86 L56 120 M72 86 L64 120" stroke="#D9DEE4" strokeWidth={2} /><Path d="M40 96 Q36 112 48 116" stroke="#4E9F9A" strokeWidth={2.6} fill="none" /><Circle cx={48} cy={116} r={3} fill="#4E9F9A" /></G>;
  }
}

function Hair({ look, hairC, cx, cy }: { look: BustLook; hairC: string; cx: number; cy: number }) {
  const top = cy - 24;
  switch (look.hair) {
    case 'short': return <Path d={`M${cx - 23} ${cy - 2} Q${cx - 26} ${top - 6} ${cx} ${top - 4} Q${cx + 26} ${top - 6} ${cx + 23} ${cy - 2} Q${cx + 16} ${top + 6} ${cx - 2} ${top + 8} Q${cx - 16} ${top + 10} ${cx - 23} ${cy - 2} Z`} fill={hairC} />;
    case 'grey_short': return <Path d={`M${cx - 23} ${cy - 4} Q${cx - 22} ${top - 2} ${cx - 8} ${top} Q${cx - 18} ${top + 8} ${cx - 23} ${cy - 4} Z M${cx + 23} ${cy - 4} Q${cx + 22} ${top - 2} ${cx + 8} ${top} Q${cx + 18} ${top + 8} ${cx + 23} ${cy - 4} Z`} fill={hairC} />;
    case 'curly': return <G>{[-20, -11, -2, 7, 16].map((o, i) => <Circle key={o} cx={cx + o + 2} cy={top + 2 + (i % 2) * 3} r={9} fill={hairC} />)}<Circle cx={cx - 21} cy={cy - 8} r={6} fill={hairC} /><Circle cx={cx + 21} cy={cy - 8} r={6} fill={hairC} /></G>;
    case 'ponytail':
    case 'long':
      return <Path d={`M${cx - 24} ${cy + 4} Q${cx - 27} ${top - 8} ${cx} ${top - 5} Q${cx + 27} ${top - 8} ${cx + 24} ${cy + 4} Q${cx + 20} ${top + 10} ${cx + 4} ${top + 6} Q${cx - 14} ${top + 14} ${cx - 24} ${cy + 4} Z`} fill={hairC} />;
    case 'bun': return <G><Circle cx={cx} cy={top - 8} r={10} fill={hairC} /><Path d={`M${cx - 23} ${cy - 2} Q${cx - 25} ${top - 4} ${cx} ${top - 3} Q${cx + 25} ${top - 4} ${cx + 23} ${cy - 2} Q${cx + 12} ${top + 8} ${cx} ${top + 6} Q${cx - 12} ${top + 8} ${cx - 23} ${cy - 2} Z`} fill={hairC} /></G>;
    case 'dupatta': return <G><Path d={`M${cx - 16} ${top + 6} Q${cx} ${top - 2} ${cx + 16} ${top + 6} Q${cx} ${top + 2} ${cx - 16} ${top + 6} Z`} fill={hairC} /><Path d={`M${cx - 28} ${cy + 10} Q${cx - 30} ${top - 10} ${cx} ${top - 9} Q${cx + 30} ${top - 10} ${cx + 28} ${cy + 10} Q${cx + 24} ${top + 2} ${cx} ${top + 1} Q${cx - 24} ${top + 2} ${cx - 28} ${cy + 10} Z`} fill={look.accent} /><Path d={`M${cx - 26} ${top + 10} Q${cx} ${top - 4} ${cx + 26} ${top + 10}`} stroke={shade(look.accent, -0.25)} strokeWidth={2} fill="none" /></G>;
    case 'cap': return <G><Path d={`M${cx - 23} ${cy - 6} Q${cx - 24} ${top - 8} ${cx} ${top - 7} Q${cx + 24} ${top - 8} ${cx + 23} ${cy - 6} Z`} fill={look.outfitColour} /><Path d={`M${cx - 4} ${cy - 8} Q${cx + 20} ${cy - 14} ${cx + 38} ${cy - 6} Q${cx + 20} ${cy - 4} ${cx - 4} ${cy - 4} Z`} fill={shade(look.outfitColour, -0.25)} /><Circle cx={cx} cy={top - 6} r={2.5} fill={shade(look.outfitColour, -0.3)} /></G>;
    case 'beanie': return <G><Path d={`M${cx - 24} ${cy - 4} Q${cx - 25} ${top - 12} ${cx} ${top - 11} Q${cx + 25} ${top - 12} ${cx + 24} ${cy - 4} Z`} fill={look.accent} /><Rect x={cx - 25} y={cy - 10} width={50} height={8} rx={4} fill={shade(look.accent, -0.2)} /><Circle cx={cx} cy={top - 12} r={5} fill={shade(look.accent, 0.3)} /></G>;
  }
}

function Face({ expression, cx, cy, beard }: { expression: Expression; cx: number; cy: number; beard: boolean }) {
  const ink = '#2B2433';
  const eyeY = cy - 1;
  const eyes = (() => {
    switch (expression) {
      case 'proud': return <G>{[-9, 9].map((o) => <Path key={o} d={`M${cx + o - 4} ${eyeY + 1} q4 -5 8 0`} stroke={ink} strokeWidth={2.4} fill="none" strokeLinecap="round" />)}</G>;
      case 'surprised': return <G>{[-9, 9].map((o) => <G key={o}><Circle cx={cx + o} cy={eyeY} r={4} fill="#FFFFFF" /><Circle cx={cx + o} cy={eyeY} r={2.4} fill={ink} /></G>)}</G>;
      case 'think': return <G>{[-9, 9].map((o) => <G key={o}><Ellipse cx={cx + o} cy={eyeY} rx={3} ry={3.4} fill={ink} /><Circle cx={cx + o + 1} cy={eyeY - 1.5} r={1} fill="#FFFFFF" /></G>)}</G>;
      default: return <G>{[-9, 9].map((o) => <G key={o}><Ellipse cx={cx + o} cy={eyeY} rx={3} ry={3.6} fill={ink} /><Circle cx={cx + o + 1} cy={eyeY - 1.5} r={1.1} fill="#FFFFFF" /></G>)}</G>;
    }
  })();
  const brows = expression === 'think'
    ? <G><Path d={`M${cx - 13} ${cy - 10} l8 -2`} stroke={ink} strokeWidth={2.2} strokeLinecap="round" /><Path d={`M${cx + 5} ${cy - 12} l8 1`} stroke={ink} strokeWidth={2.2} strokeLinecap="round" /></G>
    : expression === 'surprised'
      ? <G><Path d={`M${cx - 13} ${cy - 12} q4 -3 8 0`} stroke={ink} strokeWidth={2.2} fill="none" strokeLinecap="round" /><Path d={`M${cx + 5} ${cy - 12} q4 -3 8 0`} stroke={ink} strokeWidth={2.2} fill="none" strokeLinecap="round" /></G>
      : <G><Path d={`M${cx - 13} ${cy - 9} q4 -2 8 0`} stroke={ink} strokeWidth={2} fill="none" strokeLinecap="round" /><Path d={`M${cx + 5} ${cy - 9} q4 -2 8 0`} stroke={ink} strokeWidth={2} fill="none" strokeLinecap="round" /></G>;
  const my = cy + 12;
  const mouth = (() => {
    switch (expression) {
      case 'talk': return <Ellipse cx={cx} cy={my} rx={5} ry={4} fill="#8E3B46" />;
      case 'surprised': return <Ellipse cx={cx} cy={my + 1} rx={3.5} ry={4.5} fill="#8E3B46" />;
      case 'think': return <Path d={`M${cx - 4} ${my + 1} q5 -2 9 1`} stroke={ink} strokeWidth={2.2} fill="none" strokeLinecap="round" />;
      case 'proud': return <Path d={`M${cx - 8} ${my - 2} q8 10 16 0 z`} fill="#8E3B46" stroke={ink} strokeWidth={1.2} />;
      default: return <Path d={`M${cx - 7} ${my - 1} q7 7 14 0`} stroke={ink} strokeWidth={2.4} fill="none" strokeLinecap="round" />;
    }
  })();
  return <G>{eyes}{brows}{beard && expression !== 'talk' ? null : null}{mouth}<Path d={`M${cx - 1} ${cy + 3} q1.5 3 3 0`} stroke={shade('#C98E64', -0.3)} strokeWidth={1.4} fill="none" /></G>;
}

/** Portrait with a gentle idle "breathing" bob (disabled with reduced motion). */
export function Portrait({ look, expression, size = 120, reducedMotion, ring }: { look: BustLook; expression?: Expression; size?: number; reducedMotion?: boolean; ring?: string }) {
  const v = useSharedValue(0);
  useEffect(() => {
    if (reducedMotion) return;
    v.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(v);
  }, [reducedMotion, v]);
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: -v.value * 2 }, { scale: 1 + v.value * 0.012 }] }));
  return (
    <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: ring ?? '#FCE3B0' }, st]}>
      <BustArt look={look} expression={expression} size={size} />
    </Animated.View>
  );
}

import React, { memo, useEffect, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { BUILDINGS, BuildingId, STAGES, stageOf } from '@/game/world/buildings';
import { DISTRICTS, DistrictId, isDistrictUnlocked } from '@/game/world/districts';
import { TownState } from '@/game/progression/town';
import { Week } from '@/assessment/types';
import { Building } from './Building';
import { House, Lamp, Stall, Tree } from './Scenery';
import { GRID_H, GRID_W, LAYOUT, Cell } from './townLayout';
import { HH, HW, diamond, mix, shade, tileCenter } from './iso';

export const PAD = 36;
export const OX = GRID_H * HW + PAD;
export const OY = 90;
export const MAP_W = (GRID_W + GRID_H) * HW + PAD * 2;
export const MAP_H = (GRID_W + GRID_H) * HH + OY + 40;

export const buildingScreenPos = (id: BuildingId) => {
  const b = BUILDINGS.find((x) => x.id === id)!;
  return tileCenter(b.gx, b.gy, OX, OY);
};
export const districtCenter = (id: DistrictId) => {
  const z = DISTRICTS.find((d) => d.id === id)!.zone;
  return tileCenter((z.x0 + z.x1) / 2, (z.y0 + z.y1) / 2, OX, OY);
};

const SEASON_GRASS: Record<number, string> = { 0: '#A6D57E', 1: '#A6D57E', 2: '#C3D671', 3: '#8CC57A', 4: '#B4CE97' };

interface StaticProps { town: TownState; week: Week; season: number; festive: boolean; night: boolean }

/** The static (non-animated) layer. Memoised: only re-renders when the town actually changes. */
const StaticTown = memo(function StaticTown({ town, week, season, festive, night }: StaticProps) {
  const grass = SEASON_GRASS[season] ?? SEASON_GRASS[1];
  const groundTiles: React.ReactNode[] = [];
  const objects: { depth: number; node: React.ReactNode }[] = [];
  const bridgeStage = stageOf(town.progress.bridge);
  const canalClean = stageOf(town.progress.pump_station) >= 3;

  for (const cell of LAYOUT) {
    const p = tileCenter(cell.gx, cell.gy, OX, OY);
    const key = `${cell.gx}-${cell.gy}`;
    const tint = cell.district ? DISTRICTS.find((d) => d.id === cell.district)!.accent : null;
    groundTiles.push(<GroundTile key={key} cell={cell} x={p.x} y={p.y} grass={grass} tint={tint} season={season} canalClean={canalClean} bridgeStage={bridgeStage} />);
    const depth = cell.gx + cell.gy;
    const d = cell.decor;
    if (d?.kind === 'tree') objects.push({ depth, node: <Tree key={`t${key}`} x={p.x + ((cell.gx * 5) % 9) - 4} y={p.y + 4} kind={d.v} season={season} /> });
    if (d?.kind === 'house') objects.push({ depth, node: <House key={`h${key}`} x={p.x} y={p.y + 2} variant={d.v} rebuilt={d.index < town.homes} /> });
    if (d?.kind === 'stall' && week >= 3) objects.push({ depth, node: <Stall key={`s${key}`} x={p.x} y={p.y + 4} colour={['#E2589B', '#F4A340', '#5B8DEF', '#3FAE6A'][d.v]} /> });
    if (d?.kind === 'lamp') objects.push({ depth, node: <Lamp key={`l${key}`} x={p.x + 18} y={p.y - 2} on={night || festive} /> });
  }
  for (const b of BUILDINGS) {
    const p = tileCenter(b.gx, b.gy, OX, OY);
    objects.push({ depth: b.gx + b.gy + 0.5, node: <Building key={b.id} def={b} stage={stageOf(town.progress[b.id])} cx={p.x} cy={p.y + 2} night={night} /> });
  }
  objects.sort((a, b) => a.depth - b.depth);

  const fog = DISTRICTS.filter((d) => !isDistrictUnlocked(d.id, week)).map((d) => {
    const z = d.zone;
    const tiles = [];
    for (let gx = z.x0; gx <= z.x1; gx++) for (let gy = z.y0; gy <= z.y1; gy++) {
      const p = tileCenter(gx, gy, OX, OY);
      tiles.push(<Path key={`${gx}-${gy}`} d={diamond(p.x, p.y, HW + 1, HH + 0.5)} fill="#F4EEF7" opacity={0.62} />);
    }
    return <G key={d.id}>{tiles}</G>;
  });

  return (
    <Svg width={MAP_W} height={MAP_H}>
      <Defs>
        <LinearGradient id="water" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={canalClean ? '#6EC6E6' : '#9C8B64'} />
          <Stop offset="1" stopColor={canalClean ? '#3E9CC8' : '#7E6E4C'} />
        </LinearGradient>
      </Defs>
      {/* island base */}
      <Path d={`M${OX} ${OY - 6} L${OX + GRID_W * HW + 6} ${OY + GRID_W * HH} L${OX + (GRID_W - GRID_H) * HW} ${OY + (GRID_W + GRID_H) * HH + 6} L${OX - GRID_H * HW - 6} ${OY + GRID_H * HH} Z`} fill={shade(grass, -0.35)} transform="translate(0 10)" />
      <G>{groundTiles}</G>
      {festive ? <Bunting /> : null}
      <G>{objects.map((o) => o.node)}</G>
      <G>{fog}</G>
    </Svg>
  );
});

function GroundTile({ cell, x, y, grass, tint, season, canalClean, bridgeStage }: { cell: Cell; x: number; y: number; grass: string; tint: string | null; season: number; canalClean: boolean; bridgeStage: number }) {
  const base = tint ? mix(grass, tint, 0.12) : grass;
  const alt = (cell.gx + cell.gy) % 2 ? shade(base, 0.05) : base;
  switch (cell.ground) {
    case 'road': {
      const vertical = cell.gx === 5 || cell.gx === 10;
      const horizontal = cell.gy === 5 || cell.gy === 11;
      const dash = vertical && !horizontal
        ? <Path d={`M${x + 6} ${y - 3} L${x - 6} ${y + 3}`} stroke="#F7EEDB" strokeWidth={2} strokeLinecap="round" />
        : horizontal && !vertical ? <Path d={`M${x - 6} ${y - 3} L${x + 6} ${y + 3}`} stroke="#F7EEDB" strokeWidth={2} strokeLinecap="round" /> : null;
      return <G><Path d={diamond(x, y)} fill="#CDBB9C" /><Path d={diamond(x, y, HW - 5, HH - 2.5)} fill="#A89C8C" />{dash}{season === 3 && (cell.gx + cell.gy) % 4 === 0 ? <Path d={diamond(x + 6, y + 2, 9, 4)} fill="#8FB8D6" opacity={0.8} /> : null}</G>;
    }
    case 'plaza':
      return <G><Path d={diamond(x, y)} fill={tint ? mix('#F1E4CC', tint, 0.18) : '#F1E4CC'} /><Path d={diamond(x, y, HW - 3, HH - 1.5)} fill="none" stroke="#00000010" strokeWidth={1} /></G>;
    case 'canal':
      return <G><Path d={diamond(x, y)} fill="url(#water)" /><Path d={`M${x - 14} ${y - 1} q7 -3 14 0 t14 0`} stroke="#FFFFFF" strokeOpacity={canalClean ? 0.55 : 0.2} strokeWidth={1.4} fill="none" /></G>;
    case 'bridge':
      return (
        <G>
          <Path d={diamond(x, y)} fill="url(#water)" />
          {bridgeStage >= 2 || cell.gx === 10 ? (
            <G><Path d={diamond(x, y - 4, HW - 8, HH - 4)} fill="#C9A26B" /><Path d={`M${x - HW + 8} ${y - 4} L${x} ${y + HH - 8} L${x} ${y + HH - 4} L${x - HW + 8} ${y}`} fill="#8B6A4E" /></G>
          ) : (
            <G><Path d={diamond(x - 8, y - 6, 9, 4.5)} fill="#9C948C" /><Path d={diamond(x + 9, y + 5, 8, 4)} fill="#9C948C" /></G>
          )}
        </G>
      );
    case 'field': {
      const crop = season === 1 ? '#7DBB4A' : season === 2 ? '#D9B84A' : season === 3 ? '#6FAE55' : '#C7A86A';
      return <G><Path d={diamond(x, y)} fill="#B88B5A" />{[-8, 0, 8].map((o) => <Path key={o} d={`M${x - 20 + o} ${y + o * 0.5 - 4} L${x + o} ${y + 6 + o * 0.5}`} stroke={crop} strokeWidth={4} strokeLinecap="round" />)}</G>;
    }
    default:
      return <Path d={diamond(x, y)} fill={alt} />;
  }
}

function Bunting() {
  const a = tileCenter(10, 0, OX, OY), b = tileCenter(10, 11, OX, OY);
  const c = tileCenter(0, 5, OX, OY), d = tileCenter(14, 5, OX, OY);
  const flags = (p: typeof a, q: typeof a, n: number) => Array.from({ length: n }, (_, i) => {
    const t = (i + 0.5) / n;
    const x = p.x + (q.x - p.x) * t, y = p.y + (q.y - p.y) * t - 26 + Math.sin(t * Math.PI * n) * 3;
    return <Path key={i} d={`M${x - 3} ${y} l6 0 l-3 6z`} fill={['#E2589B', '#FFD166', '#3FAE6A', '#5B8DEF', '#F4A340'][i % 5]} />;
  });
  return <G><Path d={`M${a.x} ${a.y - 26} L${b.x} ${b.y - 26}`} stroke="#5D5468" strokeWidth={0.8} />{flags(a, b, 26)}<Path d={`M${c.x} ${c.y - 26} L${d.x} ${d.y - 26}`} stroke="#5D5468" strokeWidth={0.8} />{flags(c, d, 30)}</G>;
}

// ───────────────────────── animated layer ─────────────────────────

function useLoop(duration: number, delay = 0, reverse = false) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, reverse));
    return () => cancelAnimation(v);
  }, [duration, delay, reverse, v]);
  return v;
}

function Cloud({ y, duration, delay, scale }: { y: number; duration: number; delay: number; scale: number }) {
  const v = useLoop(duration, delay);
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: -160 + v.value * (MAP_W + 220) }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: y, left: 0 }, st]}>
      <Svg width={140 * scale} height={50 * scale} viewBox="0 0 140 50">
        <Path d="M20 40 Q5 40 10 28 Q12 16 30 20 Q38 4 60 10 Q78 0 92 14 Q118 8 120 28 Q136 30 128 40 Z" fill="#FFFFFF" opacity={0.85} />
      </Svg>
    </Animated.View>
  );
}

function Walker({ from, to, duration, delay, colour, headwear }: { from: [number, number]; to: [number, number]; duration: number; delay: number; colour: string; headwear: string }) {
  const a = tileCenter(from[0], from[1], OX, OY), b = tileCenter(to[0], to[1], OX, OY);
  const v = useLoop(duration, delay, true);
  const bob = useLoop(420, 0, true);
  const st = useAnimatedStyle(() => ({
    transform: [{ translateX: a.x - 6 + (b.x - a.x) * v.value }, { translateY: a.y - 18 + (b.y - a.y) * v.value - bob.value * 1.5 }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0 }, st]}>
      <Svg width={12} height={20} viewBox="0 0 12 20">
        <Rect x={3} y={8} width={6} height={9} rx={2.5} fill={colour} />
        <Rect x={3.6} y={16} width={1.8} height={4} fill="#4A4262" />
        <Rect x={6.6} y={16} width={1.8} height={4} fill="#4A4262" />
        <Circle cx={6} cy={5} r={3.2} fill="#B98256" />
        <Path d="M2.8 4.8a3.2 3.2 0 0 1 6.4 0z" fill={headwear} />
      </Svg>
    </Animated.View>
  );
}

function Rickshaw() {
  const a = tileCenter(0, 11, OX, OY), b = tileCenter(14, 11, OX, OY);
  const v = useLoop(26000, 0, true);
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: a.x - 12 + (b.x - a.x) * v.value }, { translateY: a.y - 20 + (b.y - a.y) * v.value }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0 }, st]}>
      <Svg width={26} height={22} viewBox="0 0 26 22">
        <Path d="M3 14 L13 19 L23 14 L23 8 L13 3 L3 8 Z" fill="#2E8B57" />
        <Path d="M3 8 L13 13 L23 8 L13 3 Z" fill="#FFD166" />
        <Path d="M3 8 V14 L13 19 V13 Z" fill="#3FAE6A" />
        <Circle cx={6} cy={17} r={2.4} fill="#2B2433" />
        <Circle cx={18} cy={19} r={2.4} fill="#2B2433" />
      </Svg>
    </Animated.View>
  );
}

function Smoke({ x, y, delay }: { x: number; y: number; delay: number }) {
  const v = useLoop(3200, delay);
  const st = useAnimatedStyle(() => ({ opacity: 0.6 * (1 - v.value), transform: [{ translateX: x - 6 + v.value * 6 }, { translateY: y - 16 - v.value * 22 }, { scale: 0.6 + v.value * 0.9 }] }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFFFFF' }, st]} />;
}

function Birds() {
  const v = useLoop(30000, 4000);
  const flap = useLoop(300, 0, true);
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: MAP_W - v.value * (MAP_W + 120) }, { translateY: 40 + Math.sin(v.value * 6) * 12 }] }));
  const w = useAnimatedStyle(() => ({ transform: [{ scaleY: 0.6 + flap.value * 0.5 }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0 }, st]}>
      <Animated.View style={w}>
        <Svg width={60} height={24} viewBox="0 0 60 24">
          {[[6, 12], [22, 6], [38, 14], [50, 8]].map(([x, y], i) => <Path key={i} d={`M${x - 5} ${y} q5 -4 5 0 q0 -4 5 0`} stroke="#4A4262" strokeWidth={1.6} fill="none" />)}
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

function Rain() {
  const v = useLoop(900);
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: v.value * 40 - 40 }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: MAP_W, height: MAP_H + 40 }, st]}>
      <Svg width={MAP_W} height={MAP_H + 40}>
        {Array.from({ length: 90 }, (_, i) => {
          const x = (i * 97) % MAP_W, y = (i * 53) % (MAP_H + 40);
          return <Path key={i} d={`M${x} ${y} l-4 12`} stroke="#5D7A9C" strokeOpacity={0.35} strokeWidth={1.2} />;
        })}
      </Svg>
    </Animated.View>
  );
}

function Busy({ x, y }: { x: number; y: number }) {
  const v = useLoop(700, 0, true);
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: x - 10 }, { translateY: y - v.value * 5 }, { rotate: `${-20 + v.value * 40}deg` }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0 }, st]}>
      <Svg width={20} height={20} viewBox="0 0 24 24"><Path d="M13 8 5 16a1.8 1.8 0 0 0 2.6 2.6l8-8" stroke="#5D5468" strokeWidth={2.4} fill="none" /><Path d="M11.5 5.5 14 3l6.5 6.5-2.5 2.5z" fill="#F4A340" stroke="#5D5468" strokeWidth={1.6} /></Svg>
    </Animated.View>
  );
}

function Bounce({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withRepeat(withSequence(withTiming(1, { duration: 450, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 450, easing: Easing.in(Easing.quad) })), -1);
    return () => cancelAnimation(v);
  }, [v]);
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: x }, { translateY: y - v.value * 8 }] }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0 }, st]}>{children}</Animated.View>;
}

export function Marker({ kind }: { kind: 'new' | 'lock' }) {
  return (
    <Svg width={30} height={36} viewBox="0 0 30 36">
      <Path d="M15 35 C15 35 3 22 3 14 a12 12 0 0 1 24 0 c0 8 -12 21 -12 21z" fill={kind === 'new' ? '#F4A340' : '#7D7390'} stroke="#FFFFFF" strokeWidth={2.5} />
      {kind === 'new' ? <Path d="M15 7 v9 M15 20 v1.5" stroke="#FFFFFF" strokeWidth={3.5} strokeLinecap="round" /> : <G><Rect x={9.5} y={13} width={11} height={8} rx={2} fill="#FFFFFF" /><Path d="M11.5 13 v-2.5 a3.5 3.5 0 0 1 7 0 V13" stroke="#FFFFFF" strokeWidth={2} fill="none" /></G>}
    </Svg>
  );
}

const WALKERS: { from: [number, number]; to: [number, number]; colour: string; head: string }[] = [
  { from: [5, 0], to: [5, 11], colour: '#E2589B', head: '#2B1B14' },
  { from: [0, 5], to: [14, 5], colour: '#5B8DEF', head: '#F4D35E' },
  { from: [10, 11], to: [10, 1], colour: '#3FAE6A', head: '#2B1B14' },
  { from: [14, 11], to: [3, 11], colour: '#E9873A', head: '#FFFFFF' },
  { from: [12, 5], to: [2, 5], colour: '#8A6FD1', head: '#2E8B57' },
  { from: [10, 3], to: [10, 9], colour: '#C0392B', head: '#1E140E' },
];

export interface TownMapProps {
  town: TownState;
  week: Week;
  season?: number;
  reducedMotion: boolean;
  festive?: boolean;
  night?: boolean;
  highlight?: BuildingId[];
  onPressBuilding?: (id: BuildingId) => void;
  onPressDistrict?: (id: DistrictId) => void;
  /** Optional overlay rendered in map coordinates (e.g. player avatar). */
  children?: React.ReactNode;
}

/** Full interactive town. Wrap in scroll views to pan. */
export function TownMap({ town, week, season = Math.max(1, week), reducedMotion, festive = false, night = false, highlight = [], onPressBuilding, onPressDistrict, children }: TownMapProps) {
  const smokeSpots = useMemo(() => BUILDINGS.filter((b) => b.details.includes('chimney') && stageOf(town.progress[b.id]) === 4).map((b) => {
    const p = tileCenter(b.gx, b.gy, OX, OY);
    return { id: b.id, x: p.x + 14, y: p.y - b.height - 8 };
  }), [town.progress]);
  const busy = useMemo(() => BUILDINGS.filter((b) => { const s = stageOf(town.progress[b.id]); return s >= 1 && s <= 3; }).map((b) => {
    const p = tileCenter(b.gx, b.gy, OX, OY);
    return { id: b.id, x: p.x, y: p.y - b.height - 22 };
  }), [town.progress]);

  return (
    <View style={{ width: MAP_W, height: MAP_H }}>
      <StaticTown town={town} week={week} season={season} festive={festive} night={night} />
      {!reducedMotion ? (
        <>
          {WALKERS.map((w, i) => <Walker key={i} from={w.from} to={w.to} colour={w.colour} headwear={w.head} duration={16000 + i * 2300} delay={i * 700} />)}
          <Rickshaw />
          {smokeSpots.map((s, i) => [0, 1].map((k) => <Smoke key={`${s.id}${k}`} x={s.x} y={s.y} delay={i * 400 + k * 1600} />))}
          {busy.map((b) => <Busy key={b.id} x={b.x} y={b.y} />)}
          {season === 3 ? <Rain /> : null}
          <Birds />
          <Cloud y={10} duration={52000} delay={0} scale={1} />
          <Cloud y={60} duration={70000} delay={9000} scale={0.7} />
          <Cloud y={150} duration={64000} delay={22000} scale={0.85} />
        </>
      ) : null}
      {highlight.map((id) => {
        const p = buildingScreenPos(id);
        const b = BUILDINGS.find((x) => x.id === id)!;
        return reducedMotion
          ? <View key={id} pointerEvents="none" style={{ position: 'absolute', left: p.x - 15, top: p.y - b.height - 62 }}><Marker kind="new" /></View>
          : <Bounce key={id} x={p.x - 15} y={p.y - b.height - 62}><Marker kind="new" /></Bounce>;
      })}
      {DISTRICTS.filter((d) => !isDistrictUnlocked(d.id, week)).map((d) => {
        const p = districtCenter(d.id);
        return (
          <Pressable key={d.id} accessibilityRole="button" accessibilityLabel={`${d.name}, locked. Opens in week ${d.unlockWeek}.`} onPress={() => onPressDistrict?.(d.id)}
            style={{ position: 'absolute', left: p.x - 24, top: p.y - 40, width: 48, height: 56, alignItems: 'center' }}>
            <Marker kind="lock" />
          </Pressable>
        );
      })}
      {onPressBuilding ? BUILDINGS.filter((b) => isDistrictUnlocked(b.district, week)).map((b) => {
        const p = tileCenter(b.gx, b.gy, OX, OY);
        const st = stageOf(town.progress[b.id]);
        return (
          <Pressable key={b.id} accessibilityRole="button" accessibilityLabel={`${b.name}. ${STAGES[st]}.`} onPress={() => onPressBuilding(b.id)}
            style={{ position: 'absolute', left: p.x - 30, top: p.y - b.height - 14, width: 60, height: b.height + 30 }} />
        );
      }) : null}
      {children}
    </View>
  );
}

/** Static world drawings for levels 1-4 (ports of each level's draw_world). */
import React from 'react';
import { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Polygon, Polyline, Rect as SvgRect, Stop } from 'react-native-svg';
import * as L1 from '../../levels/level1-exploration';
import * as L2 from '../../levels/level2-planning';
import * as L3 from '../../levels/level3-social';
import * as L4 from '../../levels/level4-pressure';
import { c, GridLines, Shadow, T, TEXT, TEXT_DIM } from './svgKit';

const GOLD = 'rgb(250,204,21)';
const ACCENT = 'rgb(96,165,250)';
const ACCENT2 = 'rgb(52,211,153)';

export function Gradient({ id, top, bottom }: { id: string; top: readonly number[]; bottom: readonly number[] }) {
  return (
    <>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={c(top)} />
          <Stop offset="1" stopColor={c(bottom)} />
        </LinearGradient>
      </Defs>
      <SvgRect x={0} y={0} width={1100} height={604} fill={`url(#${id})`} />
    </>
  );
}

// ------------------------------------------------------------------------------------------------ level 1
export function Level1Scene({ level }: { level: L1.ExplorationLevel }) {
  const road = L1.ROAD.map((p) => p.join(',')).join(' ');
  const deck = L1.BRIDGE_DECK;
  return (
    <G>
      <Gradient id="g1" top={[88, 160, 96]} bottom={[62, 128, 80]} />
      <Polyline points={road} fill="none" stroke="rgb(176,140,92)" strokeWidth={46} strokeLinejoin="round" strokeLinecap="round" />
      <Polyline points={road} fill="none" stroke="rgb(196,162,112)" strokeWidth={36} strokeLinejoin="round" strokeLinecap="round" />
      {L1.ZONES.map((z) => {
        const r = z.rect;
        const lighter = z.color.map((v) => Math.min(255, v + 30));
        return (
          <G key={z.id}>
            <SvgRect x={r.x} y={r.y} width={r.w} height={r.h} rx={18} fill={c(z.color, 46 / 255)} stroke={c(lighter)} strokeWidth={2} />
            <T x={r.centerx} y={r.y + 12} size={22} anchor="midtop" color="rgb(240,245,255)">
              {level.visitedOptional.has(z.id) ? z.name : '?'}
            </T>
          </G>
        );
      })}
      {level.decor.map(([x, y, rad, col], i) => (
        <G key={i}>
          <Circle cx={x + 3} cy={y + 5} r={rad} fill="rgb(20,70,44)" />
          <Circle cx={x} cy={y} r={rad} fill={c(col)} />
        </G>
      ))}
      <SvgRect x={L1.LAKE.x} y={L1.LAKE.y} width={L1.LAKE.w} height={L1.LAKE.h} rx={26} fill="rgb(58,110,190)" />
      <SvgRect x={L1.LAKE.x + 9} y={L1.LAKE.y + 9} width={L1.LAKE.w - 18} height={L1.LAKE.h - 18} rx={22} fill="none" stroke="rgb(110,160,230)" strokeWidth={2} />
      {L1.RAVINE.map((rv, i) => (
        <SvgRect key={i} x={rv.x} y={rv.y} width={rv.w} height={rv.h} fill="rgb(30,26,34)" stroke="rgb(80,66,70)" strokeWidth={3} />
      ))}
      {level.bridgeOpen ? (
        <G>
          <SvgRect x={deck.x} y={deck.y} width={deck.w} height={deck.h} fill="rgb(156,110,66)" />
          {[0, 1, 2, 3, 4].map((i) => (
            <Line key={i} x1={deck.x + 6 + i * 12} y1={deck.y} x2={deck.x + 6 + i * 12} y2={deck.bottom} stroke="rgb(112,76,44)" strokeWidth={3} />
          ))}
        </G>
      ) : (
        <SvgRect x={deck.x} y={deck.y} width={deck.w} height={deck.h} fill="rgb(30,26,34)" />
      )}
      {L1.ROCKS.map((r, i) => (
        <G key={i}>
          <Ellipse cx={r.centerx} cy={r.centery} rx={r.w / 2} ry={r.h / 2} fill="rgb(110,112,124)" />
          <Ellipse cx={r.centerx} cy={r.centery} rx={r.w / 2 - 7} ry={r.h / 2 - 7} fill="rgb(150,152,164)" />
        </G>
      ))}
      {L1.COINS.map((p, i) =>
        level.coinTaken.has(i) ? null : (
          <G key={i}>
            <Circle cx={p[0]} cy={p[1]} r={9} fill={GOLD} />
            <Circle cx={p[0]} cy={p[1]} r={5} fill="rgb(255,236,150)" />
          </G>
        ),
      )}
      {L1.OBJECTS.map((o) => (
        <G key={o.id}>
          <Circle cx={o.pos[0]} cy={o.pos[1]} r={15} fill="none" stroke="rgb(200,170,255)" strokeWidth={2} />
          <Circle cx={o.pos[0]} cy={o.pos[1]} r={8} fill="rgb(235,225,255)" />
        </G>
      ))}
      {!level.chestUsed ? (
        <G>
          <SvgRect x={L1.CHEST_POS[0] - 19} y={L1.CHEST_POS[1] - 14} width={38} height={28} rx={4} fill="rgb(140,90,40)" stroke={GOLD} strokeWidth={3} />
          <SvgRect x={L1.CHEST_POS[0] - 4} y={L1.CHEST_POS[1] - 6} width={8} height={10} fill={GOLD} />
        </G>
      ) : null}
      <Exit rect={L1.EXIT_RECT} top="VALLEY" bottom="GATE" fill="rgb(70,70,96)" stroke={ACCENT} />
      <T x={60} y={262} size={24} color="rgb(255,250,230)">
        Follow the road →
      </T>
    </G>
  );
}

function Exit({ rect, top, bottom, fill, stroke }: { rect: L1.Zone['rect']; top: string; bottom: string; fill: string; stroke: string }) {
  return (
    <G>
      <SvgRect x={rect.x} y={rect.y} width={rect.w} height={rect.h} rx={8} fill={fill} stroke={stroke} strokeWidth={3} />
      <T x={rect.centerx} y={rect.centery} size={20} anchor="midbottom">
        {top}
      </T>
      <T x={rect.centerx} y={rect.centery} size={20} anchor="midtop">
        {bottom}
      </T>
    </G>
  );
}

// ------------------------------------------------------------------------------------------------ level 2
const L2_COLORS: Record<string, [number, number, number]> = {
  shelf: [96, 70, 50],
  board: [60, 90, 70],
  planner: [70, 80, 130],
  bench: [148, 110, 60],
  counter: [130, 70, 70],
  reset: [90, 90, 100],
};

export function Level2Scene({ level }: { level: L2.PlanningLevel }) {
  const planks: React.ReactElement[] = [];
  for (let y = 0; y < 604; y += 38) planks.push(<SvgRect key={`h${y}`} x={0} y={y} width={1100} height={2} fill="rgb(104,74,52)" />);
  for (let x = 0; x < 1100; x += 150) {
    for (let y = 0; y < 604; y += 76) {
      const off = (Math.floor(y / 76) % 2) * 75;
      planks.push(<SvgRect key={`v${x}-${y}`} x={x + off} y={y} width={2} height={38} fill="rgb(104,74,52)" />);
    }
  }
  const shelf = L2.STATIONS.shelf;
  const reset = L2.STATIONS.reset;
  const bench = L2.STATIONS.bench;
  return (
    <G>
      <SvgRect x={0} y={0} width={1100} height={604} fill="rgb(120,88,62)" />
      {planks}
      {Object.entries(L2.STATIONS).map(([k, r]) => (
        <G key={k}>
          <Shadow x={r.centerx} y={r.bottom - 4} r={r.w / 6} />
          <SvgRect x={r.x} y={r.y} width={r.w} height={r.h} rx={10} fill={c(L2_COLORS[k])} stroke="rgb(30,24,20)" strokeWidth={3} />
          <T x={r.centerx} y={r.centery} size={24} anchor="center" bold>
            {L2.STATION_NAMES[k]}
          </T>
        </G>
      ))}
      {[0, 1, 2].map((i) => (
        <SvgRect key={i} x={shelf.x + 10 + i * 54} y={shelf.y + 8} width={44} height={18} rx={3} fill="rgb(170,130,80)" />
      ))}
      <SvgRect x={reset.centerx - 5} y={reset.y + 8} width={10} height={30} rx={4} fill="rgb(200,70,70)" />
      <Circle cx={reset.centerx} cy={reset.y + 8} r={9} fill="rgb(248,113,113)" />
      {level.built.map((oid, i) => (
        <SvgRect key={oid} x={bench.x + 10 + i * 28} y={bench.y - 22} width={22} height={18} rx={4} fill={ACCENT2} />
      ))}
    </G>
  );
}

// ------------------------------------------------------------------------------------------------ level 3
export function Level3Scene({ level }: { level: L3.SocialLevel }) {
  const dashes: React.ReactElement[] = [];
  for (let x = 0; x < 1100; x += 44) dashes.push(<SvgRect key={x} x={x} y={268} width={24} height={4} fill="rgb(160,136,100)" />);
  const waves: React.ReactElement[] = [];
  for (let i = 0; i < 8; i++) {
    const x = 1010 + (i % 2) * 30;
    const y = 30 + i * 70;
    waves.push(<Path key={i} d={`M ${x} ${y + 10} A 25 10 0 0 1 ${x + 50} ${y + 10}`} stroke="rgb(180,220,250)" strokeWidth={2} fill="none" />);
  }
  return (
    <G>
      <Gradient id="g3" top={[226, 198, 150]} bottom={[196, 168, 124]} />
      <SvgRect x={0} y={270} width={1100} height={70} fill="rgb(176,150,112)" />
      {dashes}
      <SvgRect x={1000} y={0} width={100} height={604} fill="rgb(60,130,200)" />
      {waves}
      {L3.HOUSES.map((h, i) => (
        <G key={i}>
          <Shadow x={h.centerx} y={h.bottom - 2} r={h.w / 6} />
          <SvgRect x={h.x} y={h.y} width={h.w} height={h.h} rx={6} fill="rgb(206,180,150)" />
          <Polygon points={`${h.x - 8},${h.y + 18} ${h.centerx},${h.y - 26} ${h.right + 8},${h.y + 18}`} fill="rgb(170,80,70)" />
          <SvgRect x={h.centerx - 10} y={h.bottom - 34} width={20} height={34} rx={3} fill="rgb(120,84,60)" />
        </G>
      ))}
      <SvgRect x={L3.FERRY.x} y={L3.FERRY.y} width={L3.FERRY.w} height={L3.FERRY.h} rx={6} fill="rgb(130,100,70)" stroke={ACCENT} strokeWidth={3} />
      <T x={L3.FERRY.centerx} y={L3.FERRY.centery} size={20} anchor="midbottom">
        FERRY
      </T>
      <T x={L3.FERRY.centerx} y={L3.FERRY.centery} size={20} anchor="midtop">
        DOCK
      </T>
      {L3.NPCS.map((n) => {
        const [x, y] = n.pos;
        const met = level.met.has(n.id);
        return (
          <G key={n.id}>
            <Shadow x={x} y={y + 8} r={14} />
            <Circle cx={x} cy={y} r={16} fill="rgb(50,50,70)" />
            <Circle cx={x} cy={y} r={14} fill={c(n.color)} />
            <Circle cx={x} cy={y - 16} r={8} fill="rgb(255,224,190)" />
            <T x={x} y={y + 26} size={20} anchor="midtop" color="rgb(60,40,30)">
              {n.name}
            </T>
            {!met ? (
              <T x={x + 18} y={y - 30} size={30} anchor="center" bold color={n.mode === 'npc' ? 'rgb(248,113,113)' : 'rgb(90,90,120)'}>
                {n.mode === 'npc' ? '!' : '...'}
              </T>
            ) : null}
          </G>
        );
      })}
    </G>
  );
}

// ------------------------------------------------------------------------------------------------ level 4
export function Level4Scene({ level }: { level: L4.PressureLevel }) {
  return (
    <G>
      <Gradient id="g4" top={[34, 38, 56]} bottom={[20, 22, 34]} />
      <GridLines step={55} color="rgb(42,46,66)" />
      {[L4.CORRIDOR_TOP, L4.CORRIDOR_BOTTOM].map((r, i) => (
        <SvgRect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill="rgb(64,68,92)" stroke="rgb(110,114,150)" strokeWidth={3} />
      ))}
      {[0, 1, 2].map((i) => {
        const [top, bottom, door] = L4.gateRects(i);
        const open = level.gateOpen[i];
        return (
          <G key={i}>
            {[top, bottom].map((r, k) => (
              <SvgRect key={k} x={r.x} y={r.y} width={r.w} height={r.h} fill="rgb(64,68,92)" stroke="rgb(110,114,150)" strokeWidth={3} />
            ))}
            {!open ? (
              <G>
                <SvgRect x={door.x} y={door.y} width={door.w} height={door.h} fill="rgb(190,60,70)" stroke="rgb(255,140,140)" strokeWidth={2} />
                <T x={door.centerx} y={door.y - 14} size={22} anchor="midbottom" bold>{`GATE ${i + 1}`}</T>
              </G>
            ) : (
              <SvgRect x={door.x + 6} y={door.y} width={door.w - 12} height={door.h} fill="rgb(52,160,110)" />
            )}
          </G>
        );
      })}
      <SvgRect x={L4.EXIT_RECT.x} y={L4.EXIT_RECT.y} width={L4.EXIT_RECT.w} height={L4.EXIT_RECT.h} rx={8} fill="rgb(70,140,100)" stroke={ACCENT2} strokeWidth={3} />
      <T x={L4.EXIT_RECT.centerx} y={L4.EXIT_RECT.centery} size={24} anchor="center" bold>
        EXIT
      </T>
      {!level.chestUsed ? (
        <SvgRect x={L4.CHEST_POS[0] - 20} y={L4.CHEST_POS[1] - 15} width={40} height={30} rx={4} fill="rgb(110,80,40)" stroke={GOLD} strokeWidth={3} />
      ) : null}
      <T x={550} y={38} size={20} anchor="midtop" color={TEXT_DIM}>
        VAULT COLLAPSE
      </T>
      <SvgRect x={260} y={10} width={580} height={18} rx={6} fill="rgb(36,42,62)" />
    </G>
  );
}

export { TEXT };

/** Static world drawings for levels 5-8 (ports of each level's draw_world). */
import React from 'react';
import { Circle, G, Line, Rect as SvgRect } from 'react-native-svg';
import * as L5 from '../../levels/level5-expedition';
import * as L6 from '../../levels/level6-crisis';
import * as L7 from '../../levels/level7-workshop';
import * as L8 from '../../levels/level8-mission';
import { capitalize } from '../../game-engine/pymath';
import { Gradient } from './scenesA';
import { c, GridLines, Station, T, TEXT_DIM, WBar } from './svgKit';

const GOLD = 'rgb(250,204,21)';
const WARN = 'rgb(251,191,36)';
const ACCENT = 'rgb(96,165,250)';
const ACCENT2 = 'rgb(52,211,153)';

// ------------------------------------------------------------------------------------------------ level 5
const BAND_COLOR: Record<string, [number, number, number]> = { north: [110, 120, 128], central: [60, 100, 62], south: [70, 110, 130] };

export function Level5Scene({ level }: { level: L5.ExpeditionLevel }) {
  return (
    <G>
      <SvgRect x={0} y={0} width={1100} height={604} fill="rgb(46,70,58)" />
      {L5.SOLIDS.map((r, i) => (
        <SvgRect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill="rgb(84,80,88)" stroke="rgb(60,58,66)" strokeWidth={3} />
      ))}
      {L5.ROUTE_KEYS.map((k) => {
        const [lo, hi] = L5.BAND[k];
        return (
          <G key={k}>
            <SvgRect x={215} y={lo} width={665} height={hi - lo} fill={c(BAND_COLOR[k])} />
            <T x={223} y={lo + 4} size={22} bold>
              {L5.ROUTES[k].name}
            </T>
          </G>
        );
      })}
      <SvgRect x={0} y={0} width={215} height={604} fill="rgb(84,96,70)" />
      <SvgRect x={880} y={0} width={95} height={604} fill="rgb(80,100,80)" />
      <SvgRect x={1005} y={0} width={95} height={604} fill="rgb(74,64,80)" />
      <T x={12} y={8} size={24} bold>
        BASE CAMP
      </T>
      <T x={890} y={8} size={22} bold>
        JUNCTION
      </T>
      {L5.LEG_ZONES.map(([r, i, z]) => (
        <SvgRect key={`${r}${i}`} x={z.x} y={z.y} width={z.w} height={z.h} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={1} />
      ))}
      {L5.FORK_ZONES.map(([r, z]) => (
        <SvgRect key={r} x={z.x} y={z.y} width={z.w} height={z.h} fill="none" stroke="rgb(200,160,80)" strokeWidth={1} />
      ))}
      {L5.CROSSLINKS.map(([k, z]) => (
        <G key={k}>
          <SvgRect x={z.x} y={z.y} width={z.w} height={z.h} fill="none" stroke="rgb(220,200,120)" strokeWidth={2} />
          <T x={z.centerx} y={z.centery} size={20} anchor="center">
            link
          </T>
        </G>
      ))}
      {L5.DISCOVERIES.map(([k, d]) => (
        <G key={k}>
          <SvgRect x={d.rect.x} y={d.rect.y} width={d.rect.w} height={d.rect.h} rx={8} fill={level.discovered.has(k) ? 'rgb(90,80,110)' : 'rgb(150,120,190)'} />
          <T x={d.rect.centerx} y={d.rect.centery} size={18} anchor="center">
            {d.name}
          </T>
        </G>
      ))}
      {L5.ASCENT_ZONES.map(([k, z]) => (
        <SvgRect key={k} x={z.x} y={z.y} width={z.w} height={z.h} fill="none" stroke={k === 'steep' ? 'rgb(170,90,80)' : 'rgb(90,150,170)'} strokeWidth={2} />
      ))}
      <T x={976} y={110} size={18}>
        STEEP
      </T>
      <T x={968} y={580} size={16}>
        SWITCHBACKS
      </T>
      <SvgRect x={L5.OBSERVATORY.x} y={L5.OBSERVATORY.y} width={L5.OBSERVATORY.w} height={L5.OBSERVATORY.h} rx={8} fill="rgb(220,200,90)" />
      <T x={L5.OBSERVATORY.centerx - 6} y={L5.OBSERVATORY.bottom + 2} size={18} anchor="midtop" bold>
        Observatory
      </T>
      {Object.entries(L5.STATIONS).map(([k, r]) => (
        <Station key={k} rect={r} label={L5.STATION_LABEL[k]} color={L5.STATION_COLOR[k]} size={20} />
      ))}
    </G>
  );
}

// ------------------------------------------------------------------------------------------------ level 6
export function Level6Scene({ level }: { level: L6.CrisisLevel }) {
  const lvl = level.maxRisk();
  return (
    <G>
      <Gradient id="g6" top={[40, 54, 80]} bottom={[24, 32, 50]} />
      <GridLines step={55} color="rgb(46,62,90)" />
      <T x={550} y={30} size={34} anchor="center" bold color={TEXT_DIM}>
        OPERATIONS ROOM
      </T>
      <T x={550} y={396} size={24} anchor="center" color={TEXT_DIM}>
        People you can talk to
      </T>
      {Object.entries(L6.STATIONS).map(([k, r]) => (
        <G key={k}>
          <Station rect={r} label={L6.LABEL[k]} color={L6.COLOR[k]} size={22} />
          {k in level.requests && level.requests[k] ? (
            <G>
              <Circle cx={r.right - 8} cy={r.y + 8} r={11} fill={WARN} />
              <T x={r.right - 8} y={r.y + 8} size={22} anchor="center" bold color="rgb(18,22,36)">
                !
              </T>
            </G>
          ) : null}
        </G>
      ))}
      <WBar x={300} y={540} w={500} h={18} frac={lvl / 6.0} color={ACCENT} />
      <T x={550} y={566} size={22} anchor="center" color={TEXT_DIM}>{`River risk this stage: up to ${lvl}`}</T>
    </G>
  );
}

// ------------------------------------------------------------------------------------------------ level 7
const L7_COLORS: Record<string, [number, number, number]> = {
  pump: [150, 100, 70],
  lab: [70, 130, 100],
  studio: [150, 90, 140],
  learn: [90, 120, 170],
  event: [170, 120, 70],
  records: [100, 110, 130],
  board: [70, 90, 110],
  mentor: [110, 130, 90],
  door: [60, 140, 110],
};
const L7_LABELS: Record<string, string> = {
  pump: 'Repair Bay',
  lab: 'Garden Lab',
  studio: 'Design Studio',
  learn: 'Learning Corner',
  event: 'Event Desk',
  records: 'Records Office',
  board: 'Day Board',
  mentor: 'Mentor Priya',
  door: 'EXIT',
};

export function Level7Scene({ level }: { level: L7.WorkshopLevel }) {
  return (
    <G>
      <SvgRect x={0} y={0} width={1100} height={604} fill="rgb(88,84,96)" />
      <GridLines step={60} color="rgb(80,76,88)" />
      <T x={470} y={30} size={32} anchor="center" bold color={TEXT_DIM}>
        COMMUNITY MAKERSPACE - OPEN DAY
      </T>
      {Object.entries(L7.STATIONS).map(([k, r]) => {
        const task = L7.TASKS[k];
        return (
          <G key={k}>
            <Station rect={r} label={L7_LABELS[k]} color={L7_COLORS[k]} size={24} />
            {task ? (
              <T x={r.centerx} y={r.bottom + 4} size={20} anchor="midtop" color={TEXT_DIM}>{`rounds ${level.rounds[task]}/${L7.MAX_ROUNDS}`}</T>
            ) : null}
          </G>
        );
      })}
    </G>
  );
}

// ------------------------------------------------------------------------------------------------ level 8
export function Level8Scene({ level }: { level: L8.MissionLevel }) {
  const need = level.needs();
  return (
    <G>
      <Gradient id="g8" top={[70, 96, 78]} bottom={[44, 62, 52]} />
      <T x={550} y={30} size={32} anchor="center" bold color={TEXT_DIM}>
        RIVERSIDE PARK - PROJECT HQ
      </T>
      <T x={450} y={396} size={22} anchor="center" color={TEXT_DIM}>
        Teammates
      </T>
      {Object.entries(L8.SITES).map(([k, r]) => (
        <G key={k}>
          <Station rect={r} label={L8.SITE_LABEL[k]} color={L8.SITE_COLOR[k]} size={22} />
          {k in L8.ROLE && level.role === k ? <Circle cx={r.right - 10} cy={r.y + 10} r={9} fill={GOLD} /> : null}
        </G>
      ))}
      {L8.METERS.map((k, i) => {
        const x = 120 + i * 220;
        const tx = x + Math.trunc((190 * need[k]) / 100);
        return (
          <G key={k}>
            <T x={x} y={262} size={22} bold>
              {capitalize(k)}
            </T>
            <WBar x={x} y={288} w={190} h={16} frac={level.m[k] / 100} color={level.m[k] >= need[k] ? ACCENT2 : ACCENT} radius={5} />
            <Line x1={tx} y1={282} x2={tx} y2={310} stroke={WARN} strokeWidth={3} />
          </G>
        );
      })}
    </G>
  );
}

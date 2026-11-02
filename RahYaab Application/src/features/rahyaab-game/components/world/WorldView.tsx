/**
 * The game world: a memoised static SVG scene (re-drawn only when the level's visible state changes) plus a thin
 * dynamic layer (player, lasers, countdown, interaction marker) driven by Animated values that the game loop updates
 * every frame without React re-renders. Keeps 60 fps on ordinary Android phones.
 */
import React, { memo, useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { Level } from '../../game-engine/level-base';
import { PLAYER_RADIUS, WORLD_H, WORLD_W } from '../../game-engine/settings';
import { GameRunner } from '../../game-engine/runner';
import { nearestStation } from '../../levels/common';
import * as L1 from '../../levels/level1-exploration';
import * as L2 from '../../levels/level2-planning';
import * as L3 from '../../levels/level3-social';
import * as L4 from '../../levels/level4-pressure';
import * as L5 from '../../levels/level5-expedition';
import * as L6 from '../../levels/level6-crisis';
import * as L7 from '../../levels/level7-workshop';
import * as L8 from '../../levels/level8-mission';
import { Level1Scene, Level2Scene, Level3Scene, Level4Scene } from './scenesA';
import { Level5Scene, Level6Scene, Level7Scene, Level8Scene } from './scenesB';

export interface WorldDynamics {
  player: Animated.ValueXY;
  facing: Animated.ValueXY;
  beams: Animated.Value[];
  timeFrac: Animated.Value;
  shake: Animated.ValueXY;
  vignette: Animated.Value;
  marker: Animated.ValueXY;
  markerOpacity: Animated.Value;
}

export function createDynamics(): WorldDynamics {
  return {
    player: new Animated.ValueXY({ x: 0, y: 0 }),
    facing: new Animated.ValueXY({ x: 0, y: 0 }),
    beams: [new Animated.Value(-100), new Animated.Value(-100), new Animated.Value(-100)],
    timeFrac: new Animated.Value(1),
    shake: new Animated.ValueXY({ x: 0, y: 0 }),
    vignette: new Animated.Value(0),
    marker: new Animated.ValueXY({ x: -100, y: -100 }),
    markerOpacity: new Animated.Value(0),
  };
}

const STATIONS_OF: Record<number, Record<string, L1.Zone['rect']>> = {
  2: L2.STATIONS,
  5: L5.STATIONS,
  6: L6.STATIONS,
  7: L7.STATIONS,
  8: L8.SITES,
};

/** World position of the thing the action button would use right now (desktop: the floating "E" key hint). */
export function interactPoint(level: Level): [number, number] | null {
  if (level.modal) return null;
  if (level instanceof L1.ExplorationLevel) {
    const hit = level.nearest();
    if (!hit) return null;
    return hit.kind === 'chest' ? L1.CHEST_POS : hit.o.pos;
  }
  if (level instanceof L3.SocialLevel) {
    for (const n of L3.NPCS) if (n.mode === 'player' && !level.met.has(n.id) && level.distTo(n.pos) < 70) return n.pos;
    return null;
  }
  if (level instanceof L4.PressureLevel) return !level.chestUsed && level.distTo(L4.CHEST_POS) < 55 ? L4.CHEST_POS : null;
  const st = STATIONS_OF[level.levelId];
  if (!st) return null;
  const k = nearestStation(level.player, st);
  return k ? [st[k].centerx, st[k].y] : null;
}

/** Called by the game loop after every rendered frame. */
export function updateDynamics(d: WorldDynamics, runner: GameRunner, scale: number, reducedMotion: boolean): void {
  const lvl = runner.level;
  if (!lvl) return;
  const p = lvl.player;
  d.player.setValue({ x: p.x * scale, y: p.y * scale });
  d.facing.setValue({ x: p.facing[0] * 5 * scale, y: (p.facing[1] * 5 - 1) * scale });
  const ip = interactPoint(lvl);
  if (ip) {
    d.marker.setValue({ x: ip[0] * scale, y: (ip[1] - 30) * scale });
    d.markerOpacity.setValue(1);
  } else d.markerOpacity.setValue(0);
  if (lvl instanceof L4.PressureLevel) {
    lvl.beamRects().forEach((b, i) => d.beams[i].setValue(b.y * scale));
    d.timeFrac.setValue(Math.max(0, lvl.timeLeft / L4.TIME_LIMIT_S));
    if (!reducedMotion && lvl.shakeMs > 0) d.shake.setValue({ x: (Math.random() * 14 - 7) * scale, y: (Math.random() * 14 - 7) * scale });
    else d.shake.setValue({ x: 0, y: 0 });
    const low = lvl.timeLeft < 20 && lvl.status === 'running';
    d.vignette.setValue(low ? (reducedMotion ? 0.35 : (40 + 40 * Math.sin(lvl.levelMs / 120)) / 255 + 0.1) : 0);
  }
}

const StaticScene = memo(
  function StaticScene({ level, scale }: { level: Level; version: number; scale: number }) {
    let scene: React.ReactNode = null;
    if (level instanceof L1.ExplorationLevel) scene = <Level1Scene level={level} />;
    else if (level instanceof L2.PlanningLevel) scene = <Level2Scene level={level} />;
    else if (level instanceof L3.SocialLevel) scene = <Level3Scene level={level} />;
    else if (level instanceof L4.PressureLevel) scene = <Level4Scene level={level} />;
    else if (level instanceof L5.ExpeditionLevel) scene = <Level5Scene level={level} />;
    else if (level instanceof L6.CrisisLevel) scene = <Level6Scene level={level} />;
    else if (level instanceof L7.WorkshopLevel) scene = <Level7Scene level={level} />;
    else if (level instanceof L8.MissionLevel) scene = <Level8Scene level={level} />;
    return (
      <Svg width={WORLD_W * scale} height={WORLD_H * scale} viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}>
        {scene}
      </Svg>
    );
  },
  (a, b) => a.level === b.level && a.version === b.version && a.scale === b.scale,
);

export function WorldView({ level, scale, dyn, frozen }: { level: Level; scale: number; dyn: WorldDynamics; frozen: boolean }) {
  const r = PLAYER_RADIUS * scale;
  const w = WORLD_W * scale;
  const h = WORLD_H * scale;
  const isVault = level instanceof L4.PressureLevel;
  const barColor = useMemo(
    () =>
      dyn.timeFrac.interpolate({
        inputRange: [0, 0.17, 0.1701, 0.4, 0.4001, 1],
        outputRange: ['rgb(248,113,113)', 'rgb(248,113,113)', 'rgb(251,191,36)', 'rgb(251,191,36)', 'rgb(52,211,153)', 'rgb(52,211,153)'],
      }),
    [dyn],
  );
  return (
    <Animated.View
      style={{ width: w, height: h, overflow: 'hidden', transform: dyn.shake.getTranslateTransform() }}
      accessible
      accessibilityLabel={`${level.name} map`}
      accessibilityHint="Move with the joystick or arrow buttons"
    >
      <StaticScene level={level} version={level.visualVersion} scale={scale} />
      {isVault ? (
        <>
          {L4.BEAMS.map(([slot, bw], i) => (
            <Animated.View
              key={i}
              pointerEvents="none"
              style={[
                styles.beam,
                { left: slot * scale, width: bw * scale, height: 12 * scale, borderRadius: 5 * scale, transform: [{ translateY: dyn.beams[i] }] },
              ]}
            />
          ))}
          <View pointerEvents="none" style={{ position: 'absolute', left: 260 * scale, top: 10 * scale, width: 580 * scale, height: 18 * scale, borderRadius: 6 * scale, overflow: 'hidden' }}>
            <Animated.View
              style={{
                height: '100%',
                backgroundColor: barColor,
                width: dyn.timeFrac.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              }}
            />
          </View>
        </>
      ) : null}
      <Animated.View
        pointerEvents="none"
        style={[styles.marker, { width: 22 * scale + 8, height: 22 * scale + 8, borderRadius: 11 * scale + 4, opacity: dyn.markerOpacity, transform: [...dyn.marker.getTranslateTransform(), { translateX: -(11 * scale + 4) }, { translateY: -(11 * scale + 4) }] }]}
      />
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: -r - 2 * scale,
          top: -r - 2 * scale,
          width: 2 * (r + 2 * scale),
          height: 2 * (r + 2 * scale),
          borderRadius: r + 2 * scale,
          backgroundColor: 'rgb(60,110,220)',
          alignItems: 'center',
          justifyContent: 'center',
          transform: dyn.player.getTranslateTransform(),
        }}
      >
        <View style={{ width: 2 * (r - scale), height: 2 * (r - scale), borderRadius: r, backgroundColor: frozen ? 'rgb(160,170,200)' : 'rgb(250,250,255)' }} />
        <Animated.View
          style={{ position: 'absolute', width: 6 * scale, height: 6 * scale, borderRadius: 3 * scale, backgroundColor: 'rgb(40,60,120)', transform: dyn.facing.getTranslateTransform() }}
        />
      </Animated.View>
      {isVault ? <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.vignette, { opacity: dyn.vignette }]} /> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  beam: { position: 'absolute', top: 0, backgroundColor: 'rgb(255,70,70)', borderWidth: 2, borderColor: 'rgb(255,200,200)' },
  marker: { position: 'absolute', left: 0, top: 0, borderWidth: 2, borderColor: 'rgb(250,204,21)', backgroundColor: 'rgba(250,204,21,0.18)' },
  vignette: { borderWidth: 14, borderColor: 'rgb(255,40,40)' },
});

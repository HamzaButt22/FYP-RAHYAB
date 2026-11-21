/**
 * The valley: Level 1 (Valley Gate) and the journey hub in one walkable world.
 * Level 1 evidence is unchanged: reading signs = EXPLORATION (context, unscored); opening the gate = LEVEL_COMPLETE.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { JOURNEY, type LevelDef } from '../core/journey';
import { valleyGate, VALLEY_AREAS, type GateState } from '../core/levels/interestLevels';
import { LevelRunner } from '../core/levels/runner';
import type { GameSession } from '../services/session';
import type { AvatarLook } from './engine/Avatar';
import type { Dir, Pos, WorldObject } from './engine/tilemap';
import { World, type WorldMessage } from './engine/World';
import { Hud, HudButton } from './Hud';
import { valleyMap } from './maps';
import { useLandscape } from '../ui/theme';

export function ValleyWorld({ session, look, coins, start, startFacing, onMove, onEnterStop, onReflection, onExit, onWardrobe, onRotate, storageWarning, welcome }: {
  welcome?: string | null; onRotate?: () => void;
  session: GameSession; look: AvatarLook; coins: number; start: Pos; startFacing: Dir; onMove: (p: Pos, f: Dir) => void;
  onEnterStop: (l: LevelDef) => void; onReflection: () => void; onExit: () => void; onWardrobe: () => void; storageWarning: boolean;
}) {
  const landscape = useLandscape();
  const j = session.journey;
  const gateOpen = j.completed.includes('valley_gate');
  const runner = useRef<LevelRunner<GateState, any> | null>(null);
  const [gate, setGate] = useState<GateState>({ visited: [] });
  const [message, setMessage] = useState<WorldMessage | null>(welcome ? { speaker: 'mehr', text: welcome } : null);
  const [, force] = useState(0);
  const after = useRef<(() => void) | null>(null);

  // Level 1 runs while the gate is still closed
  useEffect(() => {
    if (gateOpen) return;
    const r = new LevelRunner<GateState, any>(session, valleyGate);
    runner.current = r;
    let alive = true;
    r.open().then(({ state, resumed }) => {
      if (!alive) return;
      setGate(state);
      if (!resumed) setMessage({ speaker: 'mehr', text: 'Assalam-o-alaikum, traveller! I am Ustad Mehr. Tap anywhere to walk there, or slide the round joystick. Tap a sign to read it. When you are ready, tap the big gate to open it.' });
    });
    return () => { alive = false; };
  }, [gateOpen, session]);

  const map = useMemo(() => valleyMap(j, gate.visited), [j, gate.visited]);
  const done = j.completed.length;
  const next = JOURNEY.find((l) => l.index === j.currentIndex);

  const say = (text: string, speaker: WorldMessage['speaker'] = 'none', then?: () => void) => { after.current = then ?? null; setMessage({ text, speaker }); };

  const onAction = (o: WorldObject) => {
    if (o.id === 'mehr') {
      if (done === JOURNEY.length) return say('You have visited every place in the valley! Come, tell me what you enjoyed.', 'mehr', onReflection);
      if (!gateOpen) return say('Read the signs to see what is ahead — or go straight to the gate. Nothing here is scored.', 'mehr');
      return say(`Your next stop is ${next?.title}. Tap the orange arrow at the edge of the screen, or the building with the “!”, and you will walk there.`, 'mehr');
    }
    if (o.id.startsWith('sign:') && runner.current) {
      const area = VALLEY_AREAS.find((a) => a.id === o.id.slice(5))!;
      const r = runner.current.dispatch({ type: 'VISIT', area: area.id });
      setGate(r.state);
      return say(`${area.title}: ${area.text}`);
    }
    if (o.id === 'gate' && runner.current) {
      const r = runner.current.dispatch({ type: 'ENTER' });
      void r.done.then(() => force((n) => n + 1));
      return say('The gate creaks open! Your first stop is up the path — tap the orange arrow to walk there.', 'mehr');
    }
    if (o.id.startsWith('stop:')) {
      const l = JOURNEY.find((x) => x.id === o.id.slice(5))!;
      if (o.done) return say(`You have finished ${l.title}. ★`);
      if (o.locked) return say(`${l.title} is locked. Finish stop ${j.currentIndex} first.`);
      return onEnterStop(l);
    }
  };

  return (
    <World map={map} start={start} startFacing={startFacing} look={look} onAction={onAction} onMove={onMove} message={message}
      onDismiss={() => { setMessage(null); const f = after.current; after.current = null; f?.(); }}
      hud={<Hud title="Valley" sub={storageWarning ? 'Progress could not be saved — free some space' : gateOpen ? `Next: ${next?.title ?? 'see Ustad Mehr'}` : 'Stop 1: The Valley Gate'}
        coins={coins} stamps={`${done}/8`} onBack={onExit} backLabel="Leave the game (progress is saved)" right={<>{onRotate ? <HudButton label={landscape ? '⟳ Rotate' : '⟳'} onPress={onRotate} testID="hud-rotate" /> : null}<HudButton label="Look" onPress={onWardrobe} testID="hud-wardrobe" /></>} />} />
  );
}

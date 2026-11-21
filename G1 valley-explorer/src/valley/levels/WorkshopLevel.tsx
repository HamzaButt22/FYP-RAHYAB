/** Level 4 — The Makers' Workshop. Walk around the room; spend 10 time blocks at the benches you like. */
import React, { useMemo, useRef, useState } from 'react';
import { Text } from 'react-native';
import { canCloseDay, canPick, careerWorkshop, totalRounds, WORKSHOP_BLOCKS, WORKSHOP_MAX_ROUNDS, WORKSHOP_MIN_ROUNDS } from '../core/levels/interestLevels';
import { ALL_TASKS } from '../core/tasks';
import type { Dir, Pos } from '../game/engine/tilemap';
import { World, type WorldMessage } from '../game/engine/World';
import { Hud } from '../game/Hud';
import { workshopMap, WORKSHOP_START } from '../game/maps';
import { MiniGameStage } from '../game/minigames/MiniGameStage';
import { Button, Sheet } from '../ui/components';
import { type } from '../ui/theme';
import { useLevel } from '../ui/useLevel';
import type { LevelProps } from './types';

export function WorkshopLevel({ session, onComplete, onBack, look, coins }: LevelProps) {
  const { state, dispatch, resumed } = useLevel(session, careerWorkshop, onComplete);
  const [message, setMessage] = useState<WorldMessage | null | undefined>(undefined);
  const last = useRef<{ p: Pos; f: Dir }>({ p: WORKSHOP_START, f: 'up' });
  const [spawn, setSpawn] = useState<{ p: Pos; k: number }>({ p: WORKSHOP_START, k: 0 });
  const setStart = (p: Pos) => setSpawn((sp) => ({ p, k: sp.k + 1 }));
  const map = useMemo(() => state ? workshopMap(state.rounds, (id) => canPick(state, id), canCloseDay(state)) : null, [state]);
  if (!state || !map) return null;
  const blocks = `${'●'.repeat(state.blocks)}${'○'.repeat(WORKSHOP_BLOCKS - state.blocks)}`;

  if (state.job) {
    return (
      <>
        <MiniGameStage task={ALL_TASKS[state.job.taskId]} job={state.job} sub={`Time left: ${blocks}`} coins={coins}
          onStep={(id) => dispatch({ type: 'STEP', stepId: id })} onFinish={() => { dispatch({ type: 'FINISH_JOB' }); setStart({ ...last.current.p }); }}
          onLeave={() => { dispatch({ type: 'LEAVE_JOB' }); setStart({ ...last.current.p }); }} finishLabel="Finish (1 time block)" />
        <Sheet visible={state.bonusOffer} title="Great work!" actions={<>
          <Button label="Yes, a bonus round (1 block)" variant="accent" onPress={() => { dispatch({ type: 'BONUS', take: true }); setStart({ ...last.current.p }); }} testID="bonus-yes" />
          <Button label="No thanks" variant="secondary" onPress={() => { dispatch({ type: 'BONUS', take: false }); setStart({ ...last.current.p }); }} testID="bonus-no" />
        </>}>
          <Text style={type.body}>Want to spend one more time block making it even better? It is completely up to you.</Text>
        </Sheet>
      </>
    );
  }

  const intro: WorldMessage | null = message === undefined && totalRounds(state) === 0 && !resumed
    ? { speaker: 'mehr', text: `Open day at the workshop! Tap any bench to walk there and work. You have ${WORKSHOP_BLOCKS} time blocks. Come back to a bench up to ${WORKSHOP_MAX_ROUNDS} times. Tap the door when you are done.` }
    : message ?? null;

  return (
    <World key={`spawn-${spawn.k}`} map={map} start={spawn.p} look={look} message={intro} onDismiss={() => setMessage(null)}
      onMove={(p, f) => { last.current = { p, f }; }}
      onAction={(o) => {
        if (o.id === 'door') {
          if (canCloseDay(state)) dispatch({ type: 'CLOSE_DAY' });
          else setMessage({ text: `Try at least ${WORKSHOP_MIN_ROUNDS} activities before you leave (${totalRounds(state)} so far).` });
          return;
        }
        const id = o.id.slice('bench:'.length);
        if (canPick(state, id)) dispatch({ type: 'PICK', taskId: id });
        else setMessage({ text: state.blocks < 2 ? 'You are out of time blocks. Head for the door!' : `You have already worked here ${WORKSHOP_MAX_ROUNDS} times. Try another bench!` });
      }}
      hud={<Hud title="The Makers’ Workshop" sub={`Time left: ${blocks}`} coins={coins} onBack={onBack} backLabel="Back to the valley (progress saved)" />} />
  );
}

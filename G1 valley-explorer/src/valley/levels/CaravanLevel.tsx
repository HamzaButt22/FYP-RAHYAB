/** Level 2 — Crossroads Caravan. Walk down the road you like at each of 10 forks, or make camp. */
import React, { useMemo, useState } from 'react';
import { CARAVAN_STOPS } from '../core/caravan';
import { caravan, caravanRoute } from '../core/levels/interestLevels';
import { ALL_TASKS } from '../core/tasks';
import { World, type WorldMessage } from '../game/engine/World';
import { Hud } from '../game/Hud';
import { forkMap, FORK_START } from '../game/maps';
import { MiniGameStage } from '../game/minigames/MiniGameStage';
import { useLevel } from '../ui/useLevel';
import type { LevelProps } from './types';

export function CaravanLevel({ session, onComplete, onBack, look, coins }: LevelProps) {
  const { state, dispatch, resumed } = useLevel(session, caravan, onComplete);
  const [message, setMessage] = useState<WorldMessage | null | undefined>(undefined);
  const stop = Math.min(state?.stop ?? 0, CARAVAN_STOPS - 1);
  const offered = useMemo(() => caravanRoute(session.seed)[stop], [session.seed, stop]);
  const map = useMemo(() => forkMap(offered), [offered]);
  if (!state) return null;

  if (state.job) {
    return <MiniGameStage task={ALL_TASKS[state.job.taskId]} job={state.job} sub={`Fork ${stop + 1} of ${CARAVAN_STOPS}`} coins={coins}
      onStep={(id) => dispatch({ type: 'STEP', stepId: id })} onFinish={() => dispatch({ type: 'FINISH_JOB' })} onLeave={() => dispatch({ type: 'LEAVE_JOB' })}
      finishLabel="Done — back on the road" />;
  }

  const intro: WorldMessage | null = message === undefined && state.stop === 0 && !resumed
    ? { speaker: 'mehr', text: 'The road splits three ways! Tap the road you would most like to take (or walk up it). No road is wrong — or rest at the tent.' }
    : message ?? null;

  return (
    <World key={`fork-${stop}`} map={map} start={FORK_START} look={look} message={intro} onDismiss={() => setMessage(null)}
      onTrigger={(o) => { if (o.id.startsWith('road:')) dispatch({ type: 'CHOOSE', position: Number(o.id.slice(5)) as 0 | 1 | 2 }); }}
      onAction={(o) => { if (o.id === 'camp') { dispatch({ type: 'CHOOSE', position: 3 }); setMessage({ text: 'You rest by the tent for a while, then the caravan rolls on to the next fork.' }); } }}
      hud={<Hud title="Crossroads Caravan" sub={`Fork ${stop + 1} of ${CARAVAN_STOPS} · walk up a road`} coins={coins} onBack={onBack} backLabel="Back to the valley (progress saved)" />} />
  );
}

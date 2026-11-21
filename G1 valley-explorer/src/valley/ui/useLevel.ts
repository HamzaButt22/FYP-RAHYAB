import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LevelRunner } from '../core/levels/runner';
import type { LevelMachine } from '../core/levels/machine';
import type { GameSession } from '../services/session';

/**
 * Connects a level screen to its pure machine. Screens get `state` and `dispatch` only.
 * Safe under React StrictMode (the second mount finds the saved state and does not re-emit LEVEL_START).
 */
export function useLevel<S, A>(session: GameSession, machine: LevelMachine<S, A>, onComplete: () => void) {
  const runner = useMemo(() => new LevelRunner<S, A>(session, machine), [session, machine]);
  const [state, setState] = useState<S | null>(null);
  const [resumed, setResumed] = useState(false);
  const completeRef = useRef(onComplete);
  useEffect(() => { completeRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    let alive = true;
    runner.open().then((r) => { if (alive) { setState(r.state); setResumed(r.resumed); } });
    return () => { alive = false; };
  }, [runner]);

  const dispatch = useCallback((a: A) => {
    const r = runner.dispatch(a);
    if (r.changed) setState(r.state);
    if (r.complete) r.done.then(() => completeRef.current());
    return r.changed;
  }, [runner]);

  return { state, dispatch, resumed };
}

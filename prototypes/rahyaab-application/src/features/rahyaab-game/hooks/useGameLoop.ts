/**
 * The frame loop: real time -> fixed engine steps (1/60 s), journaled input, persistence, background sync, and the
 * app-lifecycle rules:
 *   * going to the background pauses an active level immediately (logged GAME_PAUSED, like pressing P) and saves;
 *   * coming back never fast-forwards the game (the accumulator is reset);
 *   * Android's back button pauses / resumes instead of leaving the assessment by accident.
 */
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, BackHandler } from 'react-native';
import { makeInput } from '../game-engine/input';
import { AssessmentSession, FIXED_DT } from '../services/assessmentSession';
import { InputController } from '../utils/inputController';
import { inputTarget, uiSignature } from '../utils/uiState';

const MAX_STEPS_PER_FRAME = 4; // like the desktop's dt cap: a very slow device runs in slow motion, never skips logic
const SYNC_EVERY_MS = 15000;

export interface LoopCallbacks {
  /** React state setter: called only when something visible changed. */
  onSignature: (sig: string) => void;
  /** Per-frame hook for Animated values (no React re-render). */
  onFrame: () => void;
  onOver: (state: 'finished' | 'abandoned') => void;
}

export function useGameLoop(session: AssessmentSession, input: InputController, cb: LoopCallbacks): void {
  const cbRef = useRef(cb);
  cbRef.current = cb;

  useEffect(() => {
    const runner = session.runner;
    let raf: number | null = null;
    let last: number | null = null;
    let acc = 0;
    let sig = '';
    let lastSync = Date.now();
    let alive = true;
    let reported = false;

    const tick = (t: number) => {
      if (!alive) return;
      if (last === null) last = t;
      acc += Math.min((t - last) / 1000, 0.25);
      last = t;
      let steps = 0;
      while (acc >= FIXED_DT && steps < MAX_STEPS_PER_FRAME && !runner.isOver) {
        session.step(input.next(inputTarget(runner)));
        acc -= FIXED_DT;
        steps += 1;
      }
      if (steps === MAX_STEPS_PER_FRAME) acc = 0;
      cbRef.current.onFrame();
      session.persistIfDue();
      const s = uiSignature(runner);
      if (s !== sig) {
        sig = s;
        cbRef.current.onSignature(s);
      }
      const now = Date.now();
      if (now - lastSync > SYNC_EVERY_MS) {
        lastSync = now;
        session.sync().catch(() => undefined);
      }
      if (runner.isOver) {
        if (!reported) {
          reported = true;
          input.reset();
          session.persist().catch(() => undefined);
          cbRef.current.onOver(runner.state === 'finished' ? 'finished' : 'abandoned');
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onAppState = (st: AppStateStatus) => {
      if (st === 'active') {
        last = null; // do not count the time spent away
        acc = 0;
        return;
      }
      if (runner.state === 'play') {
        input.reset();
        session.step(makeInput({ pause: true })); // journaled like any input -> deterministic on restore
      }
      session.persist().catch(() => undefined);
      session.sync().catch(() => undefined);
    };
    const appSub = AppState.addEventListener('change', onAppState);

    const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (runner.state === 'play' || runner.state === 'paused') input.press({ pause: true }, inputTarget(runner));
      return true; // never leave the assessment through the back gesture
    });

    return () => {
      alive = false;
      if (raf !== null) cancelAnimationFrame(raf);
      appSub.remove();
      backSub.remove();
      session.persist().catch(() => undefined);
    };
  }, [session, input]);
}

/**
 * Input journal: a run-length encoded record of every engine frame (input + teleports).
 *
 * The engine is deterministic for (seed, plan, input sequence, dt sequence), so the journal is all that is needed to
 * rebuild an interrupted session exactly - including open dialogs, timers and RNG state - after the app was killed.
 * The same format is used by the desktop parity fixtures (tools/record_parity_traces.py).
 */
import { decodeInput, encodeInput, InputState } from './input';
import type { GameRunner } from './runner';

/** [count, encodedInput] or [1, encodedInput, teleports] (desktop bots only). */
export type JournalFrame = [number, Record<string, unknown>] | [number, Record<string, unknown>, [number, number][]];

const sameEnc = (a: Record<string, unknown>, b: Record<string, unknown>) => {
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (a[k] !== b[k]) return false;
  return true;
};

export class InputJournal {
  frames: JournalFrame[] = [];
  count = 0;

  record(inp: InputState): void {
    const enc = encodeInput(inp) as Record<string, unknown>;
    const last = this.frames[this.frames.length - 1];
    if (last && last.length === 2 && sameEnc(last[1], enc)) last[0] += 1;
    else this.frames.push([1, enc]);
    this.count += 1;
  }

  static from(frames: JournalFrame[]): InputJournal {
    const j = new InputJournal();
    j.frames = frames.map((f) => (f.length === 3 ? [f[0], { ...f[1] }, f[2].map((t) => [t[0], t[1]] as [number, number])] : [f[0], { ...f[1] }]));
    j.count = frames.reduce((s, f) => s + f[0], 0);
    return j;
  }
}

/**
 * Feed recorded frames into a runner. `onFrame` (optional) is called after every step.
 * Returns the number of frames stepped.
 */
export function replayFrames(
  runner: GameRunner,
  frames: JournalFrame[],
  dt: number,
  onFrame?: (runner: GameRunner, frameNo: number) => void,
): number {
  let n = 0;
  for (const f of frames) {
    const inp = decodeInput(f[1]);
    for (let i = 0; i < f[0]; i++) {
      if (f.length === 3 && i === 0 && runner.level) {
        for (const [x, y] of f[2]) runner.level.player.teleport(x, y);
      }
      runner.step(inp, dt);
      n += 1;
      if (onFrame) onFrame(runner, n);
    }
  }
  return n;
}

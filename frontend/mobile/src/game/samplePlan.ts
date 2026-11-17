// The sample week plan, used until the game's real content exists (Zahid's scenes, planner and tasks).
// The prologue (week 0) is the sample Ink story (design/game/story/sample.ink), played through the story host.
// Every scored step is the sample module showing one forced-choice pair, in the order of the target schedule in
// design/game/frameworks/pairs.json (30 choices over 4 weeks: 8, 8, 7, 7). weekLoop.test.ts checks that it
// still matches that file. The prologue (week 0) is practice and never scored (FR-14).
// Generated from pairs.json on 15 Nov 2026; regenerate when the schedule changes.

import type { WeekPlan } from './weekLoop.ts';

const SAMPLE = 'sample-pick-one';

function pick(week: number, slot: number, left: string, right: string) {
  return { id: `w${week}s${slot}`, module: SAMPLE, params: { left, right, item: 'sample_pick_one' } };
}

export const SAMPLE_PLAN: WeekPlan = {
  id: 'sample-2026.11.0',
  minutesPerStep: 1,
  weeks: [
    {
      week: 0,
      practice: true,
      steps: [{ id: 'w0s1', module: 'ink-story', params: { story: 'sample', knot: 'prologue' } }],
    },
    {
      week: 1,
      practice: false,
      steps: [
        pick(1, 1, 'E', 'S'),
        pick(1, 2, 'C', 'A'),
        pick(1, 3, 'R', 'I'),
        pick(1, 4, 'I', 'E'),
        pick(1, 5, 'C', 'R'),
        pick(1, 6, 'R', 'E'),
        pick(1, 7, 'A', 'R'),
        pick(1, 8, 'A', 'I'),
      ],
    },
    {
      week: 2,
      practice: false,
      steps: [
        pick(2, 1, 'S', 'I'),
        pick(2, 2, 'I', 'R'),
        pick(2, 3, 'S', 'A'),
        pick(2, 4, 'C', 'S'),
        pick(2, 5, 'S', 'R'),
        pick(2, 6, 'I', 'C'),
        pick(2, 7, 'S', 'E'),
        pick(2, 8, 'E', 'I'),
      ],
    },
    {
      week: 3,
      practice: false,
      steps: [
        pick(3, 1, 'I', 'S'),
        pick(3, 2, 'I', 'A'),
        pick(3, 3, 'S', 'C'),
        pick(3, 4, 'A', 'E'),
        pick(3, 5, 'C', 'E'),
        pick(3, 6, 'R', 'S'),
        pick(3, 7, 'R', 'C'),
      ],
    },
    {
      week: 4,
      practice: false,
      steps: [
        pick(4, 1, 'C', 'I'),
        pick(4, 2, 'A', 'C'),
        pick(4, 3, 'E', 'R'),
        pick(4, 4, 'R', 'A'),
        pick(4, 5, 'E', 'C'),
        pick(4, 6, 'E', 'A'),
        pick(4, 7, 'A', 'S'),
      ],
    },
  ],
};

import { GameEngine } from '@/game/engine/GameEngine';
import { Week } from '@/assessment/types';
import { SEASONS } from '@/game/story/dialogue';

export interface NextAction {
  route: '/welcome' | '/avatar' | '/join' | '/play' | '/locked' | '/reveal' | '/results';
  label: string;
  detail: string;
  week: Week | null;
  kind: 'onboard' | 'continue' | 'start' | 'locked' | 'finished';
}

export const weekTitle = (w: Week) => (w === 0 ? 'Prologue · Welcome to Naya Shehar' : `Week ${w} · ${SEASONS[w].name}: ${SEASONS[w].theme}`);

/** Single source of truth for "what should the player do next?" */
export function nextAction(e: GameEngine): NextAction {
  const s = e.state;
  if (!s.introSeen) return { route: '/welcome', label: 'Start', detail: 'Begin your adventure', week: null, kind: 'onboard' };
  if (!s.avatar) return { route: '/avatar', label: 'Create your volunteer', detail: 'Choose how you look', week: null, kind: 'onboard' };
  if (!s.joinAsked) return { route: '/join', label: 'Join your class', detail: 'Add your class code (optional)', week: null, kind: 'onboard' };
  if (s.session) return { route: '/play', label: `Continue week ${s.session.week === 0 ? 'prologue' : s.session.week}`, detail: weekTitle(s.session.week), week: s.session.week, kind: 'continue' };
  const w = e.currentWeek();
  if (w === null) return { route: e.isFinished() && !s.student ? '/reveal' : '/results', label: 'See your results', detail: 'Your town is complete!', week: null, kind: 'finished' };
  const st = e.weekStatus(w);
  if (st === 'available') return { route: '/play', label: w === 0 ? 'Start the prologue' : `Start week ${w}`, detail: weekTitle(w), week: w, kind: 'start' };
  return { route: '/locked', label: `Week ${w} is on its way`, detail: weekTitle(w), week: w, kind: 'locked' };
}

export function timeUntil(ms: number): string {
  if (ms <= 0) return 'now';
  const m = Math.ceil(ms / 60000);
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'}`;
  const h = Math.ceil(m / 60);
  if (h < 48) return `${h} hour${h === 1 ? '' : 's'}`;
  const d = Math.ceil(h / 24);
  return `${d} day${d === 1 ? '' : 's'}`;
}

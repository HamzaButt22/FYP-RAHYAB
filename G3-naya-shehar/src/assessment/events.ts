import { ABILITY_FAMILIES, AssessmentEvent, EVENT_TYPES, RIASEC, Riasec } from './types';

const isCat = (x: unknown): x is Riasec => typeof x === 'string' && (RIASEC as readonly string[]).includes(x);

/** Returns a list of problems; an empty list means the event is valid. */
export function validateEvent(e: AssessmentEvent): string[] {
  const p: string[] = [];
  if (!EVENT_TYPES.includes(e.type)) p.push(`unknown type ${String((e as { type: unknown }).type)}`);
  if (!e.itemId || typeof e.itemId !== 'string') p.push('missing itemId');
  if (![0, 1, 2, 3, 4].includes(e.week)) p.push('bad week');
  switch (e.type) {
    case 'choice_made':
      if (!isCat(e.presented[0]) || !isCat(e.presented[1])) p.push('bad presented');
      if (e.presented[0] === e.presented[1]) p.push('pair must compare two different categories');
      if (!e.presented.includes(e.chosen)) p.push('chosen not in presented');
      break;
    case 'plan_committed':
      if (e.offered.length !== 6 || new Set(e.offered).size !== 6 || !e.offered.every(isCat)) p.push('planner must offer all six categories');
      if (e.ranked.length !== 3 || new Set(e.ranked).size !== 3) p.push('planner must rank exactly three distinct picks');
      if (!e.ranked.every((c) => e.offered.includes(c))) p.push('ranked pick not offered');
      break;
    case 'reaction':
      if (!isCat(e.category)) p.push('bad category');
      if (!['meh', 'okay', 'loved'].includes(e.value)) p.push('bad reaction value');
      break;
    case 'task_result':
      if (!ABILITY_FAMILIES.includes(e.family)) p.push('bad family');
      if (![1, 2, 3, 4].includes(e.level)) p.push('bad level');
      if (typeof e.firstAttemptCorrect !== 'boolean') p.push('firstAttemptCorrect must be boolean');
      if (!(e.attempts >= 1)) p.push('attempts must be ≥ 1');
      if (!e.itemId.startsWith(e.family) && !e.itemId.startsWith('PRAC-')) p.push('itemId does not match family');
      break;
  }
  // Privacy guard: no timing or free-text fields may ride along on an event.
  const forbidden = ['rt', 'reactionTime', 'latency', 'hesitation', 'durationMs', 'name', 'text', 'phone', 'email'];
  for (const k of Object.keys(e)) if (forbidden.includes(k)) p.push(`forbidden field ${k}`);
  return p;
}

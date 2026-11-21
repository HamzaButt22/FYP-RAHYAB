/**
 * Raw events → per-activity "units" for one interest level (port of analytics/riasec_features.level_units).
 * Independent of the RIASEC mapping: it only summarises what the student did per activity.
 *
 * Robustness rules (needed because a crash can replay part of a level):
 *  - events are processed in `seq` order;
 *  - choice events with the same opportunity_id are de-duplicated (last one wins);
 *  - ACTIVITY_END is keyed by (task_id, round), so a replayed round overwrites rather than adds.
 */
import type { AssessmentEvent } from '../../contract/events';

export interface Round {
  outcome: 'completed' | 'abandoned';
  engaged_ms: number | null;
  expected_ms: number | null;
  optional_taken: number | null;
  optional_total: number | null;
  hints: number;
  bonus_taken: boolean;
  performance: number | null;
  required_done: number | null;
  required_total: number | null;
}

export interface Unit {
  task_id: string;
  selected_n: number;
  declined_n: number;
  optional_flag: boolean;
  via: string | null;
  revisit_n: number;
  looked: boolean;
  rounds: Record<number, Round>;
  bonus_taken: boolean;
}

export interface LevelUnits {
  level_id: string;
  units: Record<string, Unit>;
  role_votes: string[];
  completed: boolean;
  n_selections: number;
  opportunities: string[];
  sequence: string[];
  descriptive: Record<string, unknown>;
}

const newUnit = (task_id: string): Unit => ({ task_id, selected_n: 0, declined_n: 0, optional_flag: false, via: null, revisit_n: 0, looked: false, rounds: {}, bonus_taken: false });

function dedupeChoices(events: AssessmentEvent[]): AssessmentEvent[] {
  const lastByOpp = new Map<string, number>();
  events.forEach((e, i) => {
    if ((e.event_type === 'ACTIVITY_CHOICE' || e.event_type === 'ROUTE_CHOICE' || e.event_type === 'ROLE_SELECTED' || e.event_type === 'ROLE_CHANGED') && e.opportunity_id)
      lastByOpp.set(`${e.event_type}:${e.opportunity_id}`, i);
  });
  return events.filter((e, i) => {
    if (!e.opportunity_id) return true;
    const k = `${e.event_type}:${e.opportunity_id}`;
    return !lastByOpp.has(k) || lastByOpp.get(k) === i;
  });
}

export function levelUnits(all: AssessmentEvent[], levelId: string): LevelUnits | null {
  const evs = dedupeChoices(all.filter((e) => e.level_id === levelId).sort((a, b) => a.seq - b.seq));
  if (!evs.some((e) => e.event_type === 'LEVEL_START')) return null;
  const units: Record<string, Unit> = {};
  const unit = (t: string) => (units[t] ??= newUnit(t));
  const roleVotes: string[] = [];
  const seq: string[] = [];
  let opportunities: string[] = [];
  for (const e of evs) {
    const d = e.event_data as Record<string, any>;
    switch (e.event_type) {
      case 'LEVEL_START':
        opportunities = Array.isArray(d.tasks) ? d.tasks.slice() : opportunities;
        break;
      case 'ACTIVITY_CHOICE': {
        const tid = d.task_id as string;
        if (!tid) break;
        if (d.selected) {
          const u = unit(tid);
          u.selected_n += 1;
          u.optional_flag = Boolean(d.optional) || u.optional_flag;
          u.via = (d.via as string) ?? u.via;
          if (d.revisit) u.revisit_n += 1;
          seq.push(tid);
        } else unit(tid).declined_n += 1;
        break;
      }
      case 'ACTIVITY_END': {
        const tid = d.task_id as string;
        if (!tid || d.outcome === 'declined') break;
        unit(tid).rounds[Number(d.round ?? 0)] = {
          outcome: d.outcome === 'abandoned' ? 'abandoned' : 'completed', engaged_ms: d.engaged_ms ?? null, expected_ms: d.expected_ms ?? null,
          optional_taken: d.optional_taken ?? null, optional_total: d.optional_total ?? null, hints: Number(d.hints ?? 0), bonus_taken: Boolean(d.bonus_taken),
          performance: d.performance ?? null, required_done: d.required_done ?? null, required_total: d.required_total ?? null,
        };
        break;
      }
      case 'ACTIVITY_STEP':
        if (d.step_id === 'bonus_offer' && d.taken) unit(d.task_id as string).bonus_taken = true;
        break;
      case 'ROLE_SELECTED':
      case 'ROLE_CHANGED':
        if (d.role) roleVotes.push(d.role as string);
        break;
    }
  }
  const routeChoices = evs.filter((e) => e.event_type === 'ROUTE_CHOICE');
  const position: Record<string, number> = { '0': 0, '1': 0, '2': 0 };
  let rests = 0;
  for (const r of routeChoices) {
    const d = r.event_data as Record<string, any>;
    if (d.chosen === null) rests += 1;
    else if (d.position !== null && d.position !== undefined) position[String(d.position)] += 1;
  }
  const rounds = Object.values(units).flatMap((u) => Object.values(u.rounds));
  const descriptive: Record<string, unknown> = {
    rounds_ended: rounds.length,
    abandoned_rounds: rounds.filter((r) => r.outcome === 'abandoned').length,
    unique_activities: new Set(seq).size,
    task_switches: seq.slice(1).filter((t, i) => t !== seq[i]).length,
    ...(routeChoices.length ? { stops_seen: routeChoices.length, rests, road_position_counts: position } : {}),
  };
  return {
    level_id: levelId, units, role_votes: roleVotes,
    completed: evs.some((e) => e.event_type === 'LEVEL_COMPLETE'),
    n_selections: Object.values(units).reduce((s, u) => s + u.selected_n, 0),
    opportunities, sequence: seq, descriptive,
  };
}

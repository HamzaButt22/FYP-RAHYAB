import { AbilityFamily, AssessmentEvent, ReactionValue, Riasec, ScoredWeek, StoredEvent, Week } from '@/assessment/types';
import { validateEvent } from '@/assessment/events';
import { nextLevel, pickPuzzle } from '@/assessment/abilities/staircase';
import { Puzzle } from '@/assessment/abilities/puzzleTypes';
import { scoreInterests } from '@/assessment/scoring/riasec';
import { scoreAbilities } from '@/assessment/scoring/abilities';
import { recommend, StudentContext } from '@/assessment/recommendations/engine';
import { Store } from '@/database/store';
import {
  DEV_INTERVAL_MS, WEEK_INTERVAL_MS, availableAt, completeWeek, observeClock, startWeek, weekStatus, currentWeek, reachedWeek,
} from '@/services/scheduling';
import { Avatar } from '../avatar';
import { CHOICE_SCENARIOS, PRACTICE_CHOICE } from '../content/choices';
import { plannerForWeek } from '../content/planner';
import { BuildingId } from '../world/buildings';
import { REWARD, SEASON_PROJECT, addGrant, addProgress, completeProject, fund } from '../progression/town';
import { Step, buildWeekPlan } from '../progression/sessionPlan';
import { ClassLink, KEYS, SaveGame, SaveKey, Session, Settings, newSave } from './saveGame';

export type Clock = () => number;
const randomId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
  const r = Math.floor(Math.random() * 16);
  return (ch === 'x' ? r : (r & 3) | 8).toString(16);
});
let counter = 0;
const newId = (now: number) => `S-${now.toString(36)}-${(counter++).toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;

/**
 * The single owner of the save game. Every public method:
 *  1. computes the new state purely,
 *  2. validates any assessment events,
 *  3. writes state + events in ONE transaction,
 *  4. returns the new state.
 * If the app is killed at any point, the save is either fully before or fully after an action.
 */
export class GameEngine {
  private s: SaveGame;
  constructor(private store: Store, private clock: Clock = () => Date.now(), private devBuild = false, idGen: () => string = randomId) {
    const base = newSave();
    const loaded = Object.fromEntries(KEYS.map((k) => [k, store.getKV(k) ?? base[k]])) as unknown as SaveGame;
    loaded.settings = { ...base.settings, ...loaded.settings };
    this.s = loaded;
    if (!this.s.deviceId) this.save({ deviceId: idGen() });
    this.tickClock();
  }

  get state(): SaveGame { return this.s; }

  private interval() { return this.devBuild && this.s.settings.devFastWeeks ? DEV_INTERVAL_MS : WEEK_INTERVAL_MS; }

  private save(patch: Partial<SaveGame>, events: AssessmentEvent[] = [], measured = false) {
    for (const e of events) {
      const problems = validateEvent(e);
      if (problems.length) throw new Error(`invalid event ${e.itemId}: ${problems.join(', ')}`);
    }
    const next = { ...this.s, ...patch };
    const kv: Record<string, unknown> = {};
    for (const k of Object.keys(patch) as SaveKey[]) kv[k] = next[k];
    const sessionId = next.session?.sessionId ?? this.s.session?.sessionId ?? 'none';
    const recordedAt = new Date(this.clock()).toISOString();
    const stored: Omit<StoredEvent, 'seq'>[] = events.map((event) => ({ event, measured, sessionId, recordedAt }));
    this.store.commit(kv, stored);
    this.s = next;
    return this.s;
  }

  /** Safe "now" that never goes backwards. Persists the high-water mark. */
  now(): number { return this.tickClock(); }
  private tickClock(): number {
    const r = observeClock(this.s.schedule, this.clock());
    if (r.state !== this.s.schedule) this.save({ schedule: r.state });
    return r.now;
  }

  // ───────── onboarding & settings ─────────
  markIntroSeen() { return this.save({ introSeen: true }); }
  setAvatar(a: Avatar) { return this.save({ avatar: a }); }
  updateSettings(p: Partial<Settings>) {
    const settings = { ...this.s.settings, ...p };
    if (!this.devBuild) settings.devFastWeeks = false;
    const patch: Partial<SaveGame> = { settings };
    // Turning accessible mode ON mid-week makes the WHOLE current session unmeasured,
    // including events already saved. Turning it OFF never re-measures a session.
    const se = this.s.session;
    if (p.accessibleMode && se && se.measured && se.week > 0) {
      patch.session = { ...se, measured: false };
      patch.unmeasuredSessions = [...this.s.unmeasuredSessions, se.sessionId];
      patch.unmeasuredWeeks = [...this.s.unmeasuredWeeks, se.week];
    }
    return this.save(patch);
  }
  setStudent(c: StudentContext) { return this.save({ student: c }); }

  // ───────── class link & dashboard sync ─────────
  setLink(classCode: string, roll: number, className?: string) {
    if (!/^\d{6}$/.test(classCode)) throw new Error('class code must be 6 digits');
    if (!Number.isInteger(roll) || roll < 1 || roll > 9999) throw new Error('roll number must be 1–9999');
    const link: ClassLink = { classCode, roll, linkedAt: this.now(), className };
    // A new class means the server must receive the full history again.
    const changed = !this.s.link || this.s.link.classCode !== classCode || this.s.link.roll !== roll;
    return this.save({ link, joinAsked: true, sync: changed ? { ackSeq: 0, token: this.s.sync.token } : this.s.sync });
  }
  skipJoin() { return this.save({ joinAsked: true }); }
  unlink() { return this.save({ link: null, sync: { ackSeq: 0, token: this.s.sync.token } }); }
  recordSyncSuccess(ackSeq: number, token?: string, className?: string) {
    const link = this.s.link && className ? { ...this.s.link, className } : this.s.link;
    return this.save({ link, sync: { ackSeq: Math.max(this.s.sync.ackSeq, ackSeq), lastSentAt: this.clock(), token: token ?? this.s.sync.token } });
  }
  recordSyncError(message: string) { return this.save({ sync: { ...this.s.sync, lastError: message } }); }

  // ───────── weeks ─────────
  weekStatus(w: Week) { return weekStatus(this.s.schedule, w, this.now(), this.interval()); }
  currentWeek() { return currentWeek(this.s.schedule); }
  reachedWeek(): Week { return reachedWeek(this.s.schedule); }
  unlockTime(w: Week) { return availableAt(this.s.schedule, w, this.interval()); }

  startOrResume(week: Week): Session {
    if (this.s.session && this.s.session.week === week) return this.s.session;
    if (this.s.session) throw new Error('another week is in progress');
    const now = this.now();
    const schedule = startWeek(this.s.schedule, week, now, this.interval());
    const measured = week > 0 && !this.s.settings.accessibleMode;
    const session: Session = { week, sessionId: newId(now), stepIndex: 0, measured, ranked: null };
    const unmeasuredWeeks = week > 0 && !measured ? [...this.s.unmeasuredWeeks, week] : this.s.unmeasuredWeeks;
    this.save({ schedule, session, unmeasuredWeeks });
    return session;
  }

  plan(): Step[] { return this.s.session ? buildWeekPlan(this.s.session.week) : []; }
  currentStep(): Step | null { return this.s.session ? this.plan()[this.s.session.stepIndex] ?? null : null; }

  advance() {
    const se = this.requireSession();
    return this.save({ session: { ...se, stepIndex: Math.min(se.stepIndex + 1, this.plan().length - 1), stepState: {} } });
  }

  private requireSession(): Session {
    if (!this.s.session) throw new Error('no session');
    return this.s.session;
  }

  // ───────── interests ─────────
  /** Player picked one side of a forced choice. Both sides get identical rewards. */
  recordChoice(scenarioId: string, presented: [Riasec, Riasec], chosen: Riasec) {
    const se = this.requireSession();
    if (se.stepState?.chosen) return this.s; // already recorded for this step (e.g. app was restarted)
    const practice = scenarioId === PRACTICE_CHOICE.id;
    const sc = practice ? PRACTICE_CHOICE : CHOICE_SCENARIOS.find((c) => c.id === scenarioId);
    if (!sc) throw new Error(`unknown scenario ${scenarioId}`);
    const opt = sc.options.find((o) => o.category === chosen)!;
    let town = addProgress(this.s.town, sc.building, REWARD.choice.progress).town;
    town = addGrant(town, REWARD.choice.grant);
    const history = [...this.s.history, { week: se.week, kind: 'choice' as const, label: opt.title }];
    const events: AssessmentEvent[] = practice ? [] : [{ type: 'choice_made', itemId: scenarioId, week: se.week, presented, chosen }];
    return this.save({ town, history, session: { ...se, stepState: { ...se.stepState, chosen } } }, events, se.measured);
  }

  commitPlan(ranked: Riasec[]) {
    const se = this.requireSession();
    if (se.ranked) return this.s;
    const set = plannerForWeek(se.week as ScoredWeek);
    const offered = set.activities.map((a) => a.category);
    return this.save(
      { session: { ...se, ranked } },
      [{ type: 'plan_committed', itemId: set.id, week: se.week, offered, ranked }],
      se.measured,
    );
  }

  completePlanned(rank: 0 | 1 | 2) {
    const se = this.requireSession();
    const set = plannerForWeek(se.week as ScoredWeek);
    const cat = se.ranked?.[rank];
    const act = set.activities.find((a) => a.category === cat);
    if (!act) throw new Error('planned activity missing');
    if (se.stepState?.done) return this.s;
    let town = addProgress(this.s.town, act.building, REWARD.planned.progress).town;
    town = addGrant(town, REWARD.planned.grant);
    return this.save({ town, history: [...this.s.history, { week: se.week, kind: 'planned', label: act.title }], session: { ...se, stepState: { ...se.stepState, done: true } } });
  }

  /** Optional. Skipping a reaction records nothing. */
  recordReaction(itemId: string, category: Riasec, value: ReactionValue) {
    const se = this.requireSession();
    if (se.week === 0 || se.stepState?.reacted) return this.s;
    return this.save({ session: { ...se, stepState: { ...se.stepState, reacted: true } } }, [{ type: 'reaction', itemId, week: se.week, category, value }], se.measured);
  }

  // ───────── abilities ─────────
  nextPuzzle(family: AbilityFamily): Puzzle | null {
    const st = this.s.stairs[family];
    return pickPuzzle(family, st.level, new Set(st.seen));
  }

  recordPuzzle(p: Puzzle, firstAttemptCorrect: boolean, solved: boolean, attempts: number) {
    const se = this.requireSession();
    if (se.stepState?.done) return this.s;
    const doneSession = { ...se, stepState: { ...se.stepState, done: true } };
    const town = addGrant(this.s.town, REWARD.puzzle.grant);
    if (p.practice) return this.save({ town, session: doneSession, history: [...this.s.history, { week: se.week, kind: 'puzzle', label: p.id }] });
    const st = this.s.stairs[p.family];
    const stairs = { ...this.s.stairs, [p.family]: { level: nextLevel(p.level, firstAttemptCorrect), seen: [...st.seen, p.id] } };
    const history = [...this.s.history, { week: se.week, kind: 'puzzle' as const, label: p.id }];
    return this.save(
      { town, stairs, history, session: doneSession },
      [{ type: 'task_result', itemId: p.id, week: se.week, family: p.family, level: p.level, firstAttemptCorrect, solved, attempts }],
      se.measured,
    );
  }

  // ───────── town ─────────
  fundBuilding(id: BuildingId) {
    const r = fund(this.s.town, id, this.reachedWeek());
    if (!r.ok) return { state: this.s, stagedUp: false, ok: false };
    const state = this.save({ town: r.town, history: [...this.s.history, { week: this.reachedWeek(), kind: 'fund', label: id }] });
    return { state, stagedUp: r.stagedUp, ok: true };
  }

  finishSeasonProject() {
    const se = this.requireSession();
    const id = SEASON_PROJECT[se.week];
    return this.save({ town: completeProject(this.s.town, id), history: [...this.s.history, { week: se.week, kind: 'build', label: id }] });
  }

  completeSession() {
    const se = this.requireSession();
    const schedule = completeWeek(this.s.schedule, se.week, this.now());
    return this.save({ schedule, session: null });
  }

  // ───────── results ─────────
  /** All stored events, with sessions later switched to accessible mode marked not measured. */
  events(): StoredEvent[] {
    const off = new Set(this.s.unmeasuredSessions);
    return this.store.listEvents().map((e) => (off.has(e.sessionId) ? { ...e, measured: false } : e));
  }
  interestProfile() { return scoreInterests(this.events()); }
  abilityProfile() { return scoreAbilities(this.events()); }
  recommendation() {
    if (!this.s.student) return null;
    return recommend(this.interestProfile(), this.abilityProfile(), this.s.student);
  }
  isFinished() { return this.s.schedule.completedAt[4] !== undefined; }
  measuredWeeks(): number { return [1, 2, 3, 4].filter((w) => this.s.schedule.completedAt[w as Week] !== undefined && !this.s.unmeasuredWeeks.includes(w as Week)).length; }

  resetAll() {
    this.store.reset();
    this.s = newSave();
  }
}


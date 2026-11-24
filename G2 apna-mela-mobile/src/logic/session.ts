/**
 * Game session: progress pointer + response recording. Port of the desktop src/systems/session.py.
 *
 * Rules (ASSESSMENT_DESIGN.md / GAME_FLOW.md):
 * - Only explicitly confirmed selections are recorded. No timing, hesitation, taps or answer changes are stored.
 * - RIASEC responses -> "riasec" record; Big Five responses -> "bigfive" record (only with research consent).
 * - The response record is written before the progress pointer; reconcile() repairs an interruption in between.
 * - Lights depend only on answering, never on which answer was given.
 */
import { Content, Step, topType } from './content';
import { seededShuffle } from './rng';
import { SCHEMAS, Saves } from './storage';

export const GAME_VERSION = '1.0.0-mobile';
export const PHASES = ['story', 'morning', 'map', 'visit', 'diary', 'summary', 'finale', 'results', 'done'] as const;
export type Phase = (typeof PHASES)[number];

export interface Progress {
  day: number; phase: Phase; visit: number; step: number; sub: 'what' | 'loved'; stall: string | null;
  arrived: boolean; stalls_today: string[]; diary_index: number; last_stall?: string | null;
}
export interface BoardEntry { day: number; stall: string; buddy: string }
export interface Profile {
  schema: number; game_version: string; created: string; seed: number; avatar: number; nickname: string;
  consent: { research: boolean; asked: boolean; updated: string };
  progress: Progress; lights: number; board: BoardEntry[]; completed: boolean; completed_at?: string;
}
export interface RiasecRecord {
  schema: number; game_version: string;
  stall_choices: { day: number; visit: number; stall: string; type: string; available: string[] }[];
  what: { id: string; day: number; stall: string | null; shown_order: string[]; chosen_key: string; chosen_type: string }[];
  loved: { id: string; what_id: string; type: string; hearts: number }[];
}
export interface BigFiveRecord {
  schema: number; game_version: string; instrument_id: string | null;
  how: { id: string; day: number; domain: string; shown_left: string; chosen: string }[];
  diary: { id: string; day: number; response: number; scale_points: number }[];
}

const now = () => new Date().toISOString().slice(0, 19);
const freshProgress = (): Progress => ({
  day: 1, phase: 'story', visit: 0, step: 0, sub: 'what', stall: null, arrived: false, stalls_today: [], diary_index: 0,
});

export class Session {
  profile: Profile | null = null;
  riasec: RiasecRecord | null = null;
  bigfive: BigFiveRecord | null = null;

  constructor(public content: Content, public saves: Saves) {}

  // ------------------------------------------------------------------ lifecycle
  get active() {
    return this.profile !== null;
  }

  hasSave() {
    return this.saves.exists('profile');
  }

  newGame(avatar: number, nickname: string, researchConsent: boolean) {
    this.saves.deleteGame();
    const nick = (nickname || '').trim().slice(0, 12);
    this.profile = {
      schema: SCHEMAS.profile, game_version: GAME_VERSION, created: now(),
      seed: 1 + Math.floor(Math.random() * 1e9), avatar: Math.trunc(avatar), nickname: nick,
      consent: { research: !!researchConsent, asked: true, updated: now() },
      progress: freshProgress(), lights: 0, board: [], completed: false,
    };
    this.riasec = { schema: SCHEMAS.riasec, game_version: GAME_VERSION, stall_choices: [], what: [], loved: [] };
    this.bigfive = {
      schema: SCHEMAS.bigfive, game_version: GAME_VERSION,
      instrument_id: this.content.diary._meta.instrument_id ?? null, how: [], diary: [],
    };
    this.saveRiasec();
    if (this.consent) this.saveBigfive();
    this.saveProfile();
  }

  /** Load an existing game. Throws SaveCorrupt if a record is unreadable. */
  load(): boolean {
    this.profile = this.saves.load<Profile>('profile');
    if (!this.profile) return false;
    this.riasec = this.saves.load<RiasecRecord>('riasec') ?? {
      schema: SCHEMAS.riasec, game_version: GAME_VERSION, stall_choices: [], what: [], loved: [],
    };
    this.bigfive = this.saves.load<BigFiveRecord>('bigfive') ?? {
      schema: SCHEMAS.bigfive, game_version: GAME_VERSION, instrument_id: null, how: [], diary: [],
    };
    this.sanitize();
    this.reconcile();
    return true;
  }

  close() {
    this.profile = this.riasec = this.bigfive = null;
  }

  private sanitize() {
    const p = this.profile as Profile;
    const pr = (p.progress = { ...freshProgress(), ...(p.progress || {}) });
    if (!(PHASES as readonly string[]).includes(pr.phase)) pr.phase = 'map';
    pr.day = Math.min(5, Math.max(1, Math.trunc(Number(pr.day) || 1)));
    pr.visit = Math.min(2, Math.max(0, Math.trunc(Number(pr.visit) || 0)));
    if (!pr.stall || !this.content.stallById[pr.stall]) {
      pr.stall = null;
      if (pr.phase === 'visit') pr.phase = 'map';
    }
    p.lights ??= 0;
    p.board ??= [];
    p.consent ??= { research: false, asked: true, updated: now() };
    p.avatar ??= 0;
    p.nickname ??= '';
    const r = this.riasec as RiasecRecord;
    r.stall_choices ??= []; r.what ??= []; r.loved ??= [];
    const b = this.bigfive as BigFiveRecord;
    b.how ??= []; b.diary ??= [];
  }

  // ------------------------------------------------------------------ persistence
  private saveProfile() { this.saves.save('profile', this.profile); }
  private saveRiasec() { this.saves.save('riasec', this.riasec); }
  private saveBigfive() { if (this.consent) this.saves.save('bigfive', this.bigfive); }

  // ------------------------------------------------------------------ accessors
  get progress(): Progress { return (this.profile as Profile).progress; }
  get phase(): Phase { return this.progress.phase; }
  get day(): number { return this.progress.day; }
  get consent(): boolean { return !!(this.profile && this.profile.consent.research); }
  get name(): string { return (this.profile && this.profile.nickname) || 'Volunteer'; }

  setPhase(phase: Phase) {
    this.progress.phase = phase;
    this.saveProfile();
  }

  visitSteps(day?: number, visit?: number): Step[] {
    return this.content.schedule[day ?? this.day][visit ?? this.progress.visit];
  }

  /** ['what'|'loved'|'how', cardId] for the current visit position, or null. */
  currentStep(): ['what' | 'loved' | 'how', string] | null {
    if (this.phase !== 'visit') return null;
    const steps = this.visitSteps();
    const i = this.progress.step;
    if (i >= steps.length) return null;
    const [kind, cid] = steps[i];
    if (kind === 'what' && this.progress.sub === 'loved') return ['loved', cid];
    return [kind, cid];
  }

  availableStalls(): string[] {
    const done = new Set(this.progress.stalls_today);
    return this.content.stalls.filter((s) => !done.has(s.id)).map((s) => s.id);
  }

  optionOrder(cardId: string, n: number) {
    return seededShuffle(n, `${(this.profile as Profile).seed}-${cardId}`);
  }

  // ------------------------------------------------------------------ flow actions
  storyDone() { if (this.phase === 'story') this.setPhase('morning'); }
  morningDone() { if (this.phase === 'morning') this.setPhase('map'); }

  chooseStall(stallId: string): boolean {
    if (this.phase !== 'map' || !this.availableStalls().includes(stallId)) return false;
    const st = this.content.stallById[stallId];
    (this.riasec as RiasecRecord).stall_choices.push({
      day: this.day, visit: this.progress.visit + 1, stall: stallId, type: st.riasec, available: this.availableStalls(),
    });
    this.saveRiasec();
    Object.assign(this.progress, { phase: 'visit', stall: stallId, step: 0, sub: 'what', arrived: false });
    this.saveProfile();
    return true;
  }

  arrive() {
    this.progress.arrived = true;
    this.saveProfile();
  }

  recordWhat(cardId: string, shownKeys: string[], chosenKey: string): boolean {
    const step = this.currentStep();
    if (!step || step[0] !== 'what' || step[1] !== cardId) return false;
    const card = this.content.whatById[cardId];
    const opt = card.options.find((o) => o.key === chosenKey);
    if (!opt) return false;
    const r = this.riasec as RiasecRecord;
    if (!r.what.some((x) => x.id === cardId)) {
      r.what.push({ id: cardId, day: this.day, stall: this.progress.stall, shown_order: [...shownKeys], chosen_key: chosenKey, chosen_type: topType(opt.weights) });
      this.saveRiasec();
    }
    this.progress.sub = 'loved';
    (this.profile as Profile).lights += 1;
    this.saveProfile();
    return true;
  }

  recordLoved(cardId: string, hearts: number): boolean {
    const step = this.currentStep();
    if (!step || step[0] !== 'loved' || step[1] !== cardId || !(hearts >= 1 && hearts <= 5)) return false;
    const r = this.riasec as RiasecRecord;
    const w = r.what.find((x) => x.id === cardId);
    const lid = 'L' + cardId.slice(1);
    if (w && !r.loved.some((x) => x.id === lid)) {
      r.loved.push({ id: lid, what_id: cardId, type: w.chosen_type, hearts: Math.trunc(hearts) });
      this.saveRiasec();
    }
    (this.profile as Profile).lights += 1;
    this.advanceStep();
    return true;
  }

  recordHow(cardId: string, shownLeftPole: string, chosenPole: string): boolean {
    const step = this.currentStep();
    if (!step || step[0] !== 'how' || step[1] !== cardId || (chosenPole !== 'H' && chosenPole !== 'L')) return false;
    const card = this.content.howById[cardId];
    const b = this.bigfive as BigFiveRecord;
    if (this.consent && !b.how.some((x) => x.id === cardId)) {
      b.how.push({ id: cardId, day: this.day, domain: card.domain, shown_left: shownLeftPole, chosen: chosenPole });
      this.saveBigfive();
    }
    (this.profile as Profile).lights += 1;
    this.advanceStep();
    return true;
  }

  private advanceStep() {
    const pr = this.progress;
    pr.step += 1;
    pr.sub = 'what';
    if (pr.step >= this.visitSteps().length) {
      pr.stalls_today.push(pr.stall as string);
      (this.profile as Profile).board.push({ day: this.day, stall: pr.stall as string, buddy: this.content.buddy(this.day) });
      pr.visit = Math.min(2, pr.stalls_today.length);
      pr.step = 0;
      pr.arrived = false;
      pr.phase = pr.stalls_today.length >= 3 ? 'diary' : 'map';
      pr.last_stall = pr.stall;
      pr.stall = null;
    }
    this.saveProfile();
  }

  diaryItem() {
    if (this.phase !== 'diary') return null;
    const items = this.content.diaryForDay(this.day);
    const i = this.progress.diary_index;
    return i < items.length ? items[i] : null;
  }

  recordDiary(itemId: string, response: number): boolean {
    const item = this.diaryItem();
    const n = this.content.diary.scale.length;
    if (!item || item.id !== itemId || !(response >= 1 && response <= n)) return false;
    const b = this.bigfive as BigFiveRecord;
    if (this.consent && !b.diary.some((x) => x.id === itemId)) {
      b.diary.push({ id: itemId, day: this.day, response: Math.trunc(response), scale_points: n });
      this.saveBigfive();
    }
    const p = this.profile as Profile;
    p.lights += 1;
    this.progress.diary_index += 1;
    if (this.progress.diary_index >= this.content.diaryForDay(this.day).length) {
      this.progress.phase = 'summary';
      p.lights += this.content.assessment.lights.per_day_complete;
    }
    this.saveProfile();
    return true;
  }

  summaryDone() {
    if (this.phase !== 'summary') return;
    const pr = this.progress;
    if (pr.day >= 5) pr.phase = 'finale';
    else Object.assign(pr, { ...freshProgress(), day: pr.day + 1, phase: 'morning' });
    this.saveProfile();
  }

  finaleDone() {
    if (this.phase === 'finale') {
      const p = this.profile as Profile;
      p.completed = true;
      p.completed_at = now();
      this.setPhase('results');
    }
  }

  resultsSeen() {
    if (this.phase === 'results') this.setPhase('done');
  }

  // ------------------------------------------------------------------ consent
  /** Changing consent to false deletes all stored research (Big Five) data. */
  setConsent(value: boolean) {
    const p = this.profile as Profile;
    p.consent = { ...p.consent, research: !!value, updated: now() };
    const b = this.bigfive as BigFiveRecord;
    if (!value) {
      b.how = [];
      b.diary = [];
      this.saves.delete('bigfive');
    } else {
      this.saveBigfive();
    }
    this.saveProfile();
  }

  // ------------------------------------------------------------------ crash repair
  /** If a response was saved but the pointer was not (app killed between writes), move the pointer on. */
  reconcile() {
    let changed = false;
    const r = this.riasec as RiasecRecord;
    const b = this.bigfive as BigFiveRecord;
    for (let k = 0; k < 10; k++) {
      const pr = this.progress;
      if (pr.phase === 'map') {
        const done = r.stall_choices.filter((c) => c.day === pr.day);
        if (done.length > pr.stalls_today.length) {
          const last = done[done.length - 1].stall;
          if (!pr.stalls_today.includes(last)) {
            Object.assign(pr, { phase: 'visit', stall: last, step: 0, sub: 'what', arrived: true });
            changed = true;
            continue;
          }
        }
      }
      const step = this.currentStep();
      if (step && step[0] === 'what' && r.what.some((x) => x.id === step[1])) {
        pr.sub = 'loved';
        pr.arrived = true;
        changed = true;
        continue;
      }
      if (step && step[0] === 'loved' && r.loved.some((x) => x.what_id === step[1])) {
        this.advanceStep();
        changed = true;
        continue;
      }
      if (step && step[0] === 'how' && this.consent && b.how.some((x) => x.id === step[1])) {
        this.advanceStep();
        changed = true;
        continue;
      }
      break;
    }
    if (changed) this.saveProfile();
  }
}

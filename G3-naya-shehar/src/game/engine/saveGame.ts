import { ABILITY_FAMILIES, AbilityFamily, Level, Riasec, Week } from '@/assessment/types';
import { StudentContext } from '@/assessment/recommendations/engine';
import { STARTING_LEVEL } from '@/assessment/abilities/staircase';
import { Avatar } from '../avatar';
import { TownState, initialTown } from '../progression/town';
import { ScheduleState, initialSchedule } from '@/services/scheduling';

export interface Settings {
  sound: boolean;
  haptics: boolean;
  /** 'system' follows the phone's accessibility setting. */
  reducedMotion: 'system' | 'on' | 'off';
  readAloudAuto: boolean;
  speechRate: number;
  /** Accessible task mode: play normally, sessions are recorded as NOT measured. */
  accessibleMode: boolean;
  textScale: 1 | 1.15 | 1.3;
  theme: 'system' | 'light' | 'dark';
  /** Development builds only — shortens the week gap to 2 minutes. */
  devFastWeeks: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  sound: true, haptics: true, reducedMotion: 'system', readAloudAuto: false, speechRate: 0.95,
  accessibleMode: false, textScale: 1, theme: 'system', devFastWeeks: false,
};

export interface Session {
  week: Week;
  sessionId: string;
  stepIndex: number;
  measured: boolean;
  /** Planner result for this week, most preferred first. */
  ranked: Riasec[] | null;
  /** Progress inside the current step, so a resumed step never records twice. */
  stepState?: { chosen?: Riasec; reacted?: boolean; done?: boolean };
}

export interface StairState { level: Level; seen: string[] }

export interface HistoryItem { week: Week; kind: 'choice' | 'planned' | 'puzzle' | 'build' | 'fund'; label: string }

/** Link to a teacher's class on the results dashboard. No names are stored. */
export interface ClassLink { classCode: string; roll: number; linkedAt: number; className?: string }

export interface SyncState {
  /** Highest event seq the server has confirmed. */
  ackSeq: number;
  lastSentAt?: number;
  lastError?: string;
  /** Secret issued by the server on first upload; proves later uploads come from this phone. */
  token?: string;
}

export interface SaveGame {
  introSeen: boolean;
  /** Random id for this installation (not linked to the phone or the person). */
  deviceId: string;
  link: ClassLink | null;
  /** True once the player has seen the join-class screen (joined or skipped). */
  joinAsked: boolean;
  sync: SyncState;
  avatar: Avatar | null;
  settings: Settings;
  schedule: ScheduleState;
  town: TownState;
  session: Session | null;
  stairs: Record<AbilityFamily, StairState>;
  student: StudentContext | null;
  history: HistoryItem[];
  /** Weeks played in accessible mode (not measured). */
  unmeasuredWeeks: Week[];
  /** Sessions switched to accessible mode part-way: ALL their events are excluded. */
  unmeasuredSessions: string[];
}

export const KEYS = ['introSeen', 'deviceId', 'link', 'joinAsked', 'sync', 'avatar', 'settings', 'schedule', 'town', 'session', 'stairs', 'student', 'history', 'unmeasuredWeeks', 'unmeasuredSessions'] as const;
export type SaveKey = (typeof KEYS)[number];

export function newSave(): SaveGame {
  return {
    introSeen: false,
    deviceId: '',
    link: null,
    joinAsked: false,
    sync: { ackSeq: 0 },
    avatar: null,
    settings: DEFAULT_SETTINGS,
    schedule: initialSchedule(),
    town: initialTown(),
    session: null,
    stairs: Object.fromEntries(ABILITY_FAMILIES.map((f) => [f, { level: STARTING_LEVEL, seen: [] }])) as unknown as Record<AbilityFamily, StairState>,
    student: null,
    history: [],
    unmeasuredWeeks: [],
    unmeasuredSessions: [],
  };
}

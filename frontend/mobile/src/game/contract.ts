// The game–app contract, version 2 (RFC-0005). The only thing a game module and the app have to agree on.
//
// The app owns everything around the game: identity, consent, saving and uploading, results, settings.
// A game module owns everything inside its screen: story, mechanics, art, timing, how many screens.
// They meet in three places, and nowhere else:
//   1. GameContext: what the app tells a module (language, week, accessibility settings). Never who the
//      student is: a module needs no name, nickname or id, so it can't leak one.
//   2. GameHost: what a module may do (send an event, save its own progress, say it has finished).
//   3. GameModule: how a module describes itself (id, version, what it measures, its screen).
// Events carry what the module saw; the host adds ids, order and time (the envelope, SRS §12.5), so a
// module can't break the upload rules. Adding a module never changes the week loop or the outbox (NFR-52).
//
// This file has no React Native imports at run time, so the rules can be tested with `pnpm test`.

import type { ComponentType } from 'react';

// 1.1.0: step params in the context; week_complete is the host's.
// 2.0.0 (16 Nov 2026): English only (ADR-0016): no locale or rtl in the context; title is one string.
export const CONTRACT_VERSION = '2.0.0';

/** Event types the server accepts (envelope v3.0.0, docs/api/openapi.yaml `Event`). */
export const EVENT_TYPES = [
  'session_start',
  'session_end',
  'run_start',
  'help_opened',
  'pause',
  'resume',
  'quit',
  'plan_presented',
  'plan_committed',
  'scene_start',
  'choice_made',
  'reaction',
  'value_choice',
  'calibration_tap',
  'task_item_presented',
  'task_action',
  'task_result',
  'letter_update',
  'week_complete',
  'sim_complete',
  'reflection',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/** Sent by the host itself, never by a module: they mark the run and keep the order trustworthy.
 * week_complete is the week loop's (the server counts weeks from it, so a module must not send it twice). */
export const HOST_ONLY_EVENTS: readonly EventType[] = ['session_start', 'session_end', 'run_start', 'quit', 'week_complete'];

/** The six task families (Recommendation.tasks_measured in the OpenAPI file). */
export const TASK_FAMILIES = ['SPA', 'ABS', 'NUM', 'LOG', 'PLN', 'VRB'] as const;
export type TaskFamily = (typeof TASK_FAMILIES)[number];

/**
 * What a module gives evidence for: the one fixed point between the game and the scoring. How a module
 * measures it is the module's choice; changing *what* is measured is a team decision (RFC-0005).
 * 'none' is for modules that only tell the story or explain something.
 */
export type Construct = 'interests' | 'values' | `aptitude:${TaskFamily}` | 'none';
export const CONSTRUCTS: readonly Construct[] = [
  'interests',
  'values',
  ...TASK_FAMILIES.map((f) => `aptitude:${f}` as const),
  'none',
];

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

/** What the app tells a module. Read-only; it changes only between runs. */
export interface GameContext {
  /** Week of the year-long story, 0 for the prologue (envelope `week`, 0–4). */
  week: number;
  /** A practice run: its events are marked practice and never scored. */
  practice: boolean;
  /** Accessible task mode (FR-98): the task is played but stored as not measured. */
  a11yMode: boolean;
  /** The phone asks for less motion: skip or shorten animations. */
  reducedMotion: boolean;
  /** What the week plan asks this step to show (a scene id, a pair, a task level). Module-defined; may be
   * empty. Added in contract 1.1.0. */
  params?: JsonObject;
}

/** One thing that happened in the module. The host turns it into an envelope v3 event. */
export interface GameEvent {
  type: EventType;
  /** The content item, scene or task item it is about (≤ 64 characters, letters, digits, _ - . :). */
  itemId?: string;
  /** Facts only, no free text: short strings (≤ 64 characters), numbers, booleans; ≤ 900 bytes. */
  data?: JsonObject;
}

/**
 * A measurement nobody has agreed on yet. Kept on the phone in the developer event log, **never uploaded
 * or scored**. Use it to try a new idea; when it proves useful, propose it as a real event type.
 */
export interface ExperimentalEvent {
  name: string;
  data?: JsonObject;
}

export interface GameResult {
  /** false when the student left early; the host records `quit`. */
  completed: boolean;
}

/** What a module may do. Every call is checked; a broken call throws in development builds. */
export interface GameHost {
  emit(event: GameEvent): void;
  experiment(event: ExperimentalEvent): void;
  /** The module's own progress (where it was, what was shown), ≤ 16 KB. Given back as `saved` next time. */
  save(state: JsonValue): void;
  finish(result: GameResult): void;
}

export interface GameModuleProps {
  context: GameContext;
  host: GameHost;
  /** What the module last passed to host.save(), or null on a first run. */
  saved: JsonValue | null;
}

export interface GameModule {
  /** Lowercase words joined by dashes, unique in the app, e.g. 'planning-week' or 'sample-pick-one'. */
  id: string;
  /** The module's own version (1.2.0). Sent with every event as part of `content_version`. */
  version: string;
  kind: 'task' | 'scene' | 'activity' | 'other';
  measures: Construct[];
  /** The module's name in English, for the game lab and the logs. */
  title: string;
  /** The contract version the module was written for. */
  contract: string;
  Screen: ComponentType<GameModuleProps>;
}

// Limits, shared with the checks in rules.ts.
export const MAX_ITEM_ID = 64;
export const MAX_DATA_STRING = 64;
export const MAX_DATA_BYTES = 900;
export const MAX_SAVED_BYTES = 16 * 1024;

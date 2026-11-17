// Accessibility settings (FR-97, design/specs/accessibility.md §1): what each one is, its default, and the
// effective value once Android's own settings are taken into account. Pure functions, tested with `pnpm test`
// (settings.test.ts). Saved per student on the phone; SettingsProvider applies them without a restart.

export type ReadingSpeed = 0.75 | 1 | 1.25 | 1.5;
export type TextScale = 1 | 1.25 | 1.5 | 2;
export type ReduceMotion = 'system' | 'on';

export interface Settings {
  /** Speaker buttons on lines, choices and explanations (FR-96). */
  readAloud: boolean;
  /** New story lines read themselves. Never while TalkBack runs (a second voice would overlap). */
  autoRead: boolean;
  readingSpeed: ReadingSpeed;
  /** In-app text size, on top of Android's font scale; together never more than 200% (SRS §8.5). */
  textScale: TextScale;
  highContrast: boolean;
  /** Atkinson Hyperlegible with extra letter and line spacing. */
  readingFont: boolean;
  reduceMotion: ReduceMotion;
}

export const READING_SPEEDS: readonly ReadingSpeed[] = [0.75, 1, 1.25, 1.5];
export const TEXT_SCALES: readonly TextScale[] = [1, 1.25, 1.5, 2];

export const DEFAULTS: Settings = {
  readAloud: true,
  autoRead: false,
  readingSpeed: 1,
  textScale: 1,
  highContrast: false,
  readingFont: false,
  reduceMotion: 'system',
};

/** Settings saved by an older or newer app version: unknown values fall back to the default. */
export function fitSettings(saved: unknown): Settings {
  const s = (typeof saved === 'object' && saved !== null ? saved : {}) as Record<string, unknown>;
  const bool = (key: keyof Settings) => (typeof s[key] === 'boolean' ? (s[key] as boolean) : (DEFAULTS[key] as boolean));
  return {
    readAloud: bool('readAloud'),
    autoRead: bool('autoRead'),
    readingSpeed: READING_SPEEDS.includes(s.readingSpeed as ReadingSpeed)
      ? (s.readingSpeed as ReadingSpeed)
      : DEFAULTS.readingSpeed,
    textScale: TEXT_SCALES.includes(s.textScale as TextScale) ? (s.textScale as TextScale) : DEFAULTS.textScale,
    highContrast: bool('highContrast'),
    readingFont: bool('readingFont'),
    reduceMotion: s.reduceMotion === 'on' ? 'on' : 'system',
  };
}

/** What Android says right now. */
export interface SystemState {
  screenReader: boolean;
  reduceMotion: boolean;
}

export interface Effective {
  readAloud: boolean;
  autoRead: boolean;
  /** The speech rate passed to the phone's text-to-speech (1 = its normal speed). */
  speechRate: number;
  reduceMotion: boolean;
}

export function effective(settings: Settings, system: SystemState): Effective {
  return {
    readAloud: settings.readAloud,
    autoRead: settings.readAloud && settings.autoRead && !system.screenReader,
    speechRate: settings.readingSpeed,
    reduceMotion: settings.reduceMotion === 'on' || system.reduceMotion,
  };
}

/**
 * How one piece of text grows: the in-app size, and the most Android's font scale may add on top so the
 * total stays within `cap` (2 for body text, 1.3 for display text).
 */
export function textSizing(textScale: TextScale, cap: number): { appScale: number; maxSystemScale: number } {
  const appScale = Math.min(textScale, cap);
  return { appScale, maxSystemScale: Math.max(1, cap / appScale) };
}

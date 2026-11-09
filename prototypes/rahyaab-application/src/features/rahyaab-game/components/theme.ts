/** Visual identity of the desktop game (game/settings.py palette), as React Native styles. */
import * as S from '../game-engine/settings';

export const colors = {
  bg: S.rgb(S.BG),
  panel: S.rgb(S.PANEL),
  panelLight: S.rgb(S.PANEL_LIGHT),
  panelDim: 'rgb(36,42,64)',
  text: S.rgb(S.TEXT),
  textDim: S.rgb(S.TEXT_DIM),
  accent: S.rgb(S.ACCENT),
  accent2: S.rgb(S.ACCENT_2),
  warn: S.rgb(S.WARN),
  danger: S.rgb(S.DANGER),
  gold: S.rgb(S.GOLD),
  faint: 'rgb(120,130,160)',
  shade: 'rgba(8,10,20,0.62)',
  disabledBg: 'rgb(30,34,50)',
  disabledText: 'rgb(110,116,140)',
};

export const traitColors: Record<string, string> = Object.fromEntries(Object.entries(S.TRAIT_COLORS).map(([k, v]) => [k, S.rgb(v)]));

export const riasecColors: Record<string, string> = {
  R: 'rgb(251,146,60)',
  I: 'rgb(96,165,250)',
  A: 'rgb(232,121,249)',
  S: 'rgb(52,211,153)',
  E: 'rgb(251,191,36)',
  C: 'rgb(148,163,184)',
};

export const labelColors: Record<string, string> = {
  Low: 'rgb(148,163,184)',
  Moderate: 'rgb(251,191,36)',
  High: 'rgb(52,211,153)',
};

export const radius = { sm: 8, md: 12, lg: 16 };
export const space = (n: number) => n * 4;
/** Minimum touch target (Android 48dp / iOS 44pt). */
export const HIT = 48;
/** Cap system font scaling on dense in-game text so layouts never break (menus/results scale fully). */
export const DENSE_FONT_SCALE = 1.3;

/** Full-cover absolute style (StyleSheet.absoluteFillObject was removed in React Native 0.88). */
export const ABS_FILL = { position: 'absolute' as const, left: 0, right: 0, top: 0, bottom: 0 };

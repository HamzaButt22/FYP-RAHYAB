/**
 * Valley Explorer design tokens. One palette, one type scale, one spacing scale for every screen.
 * Colour is never the only cue: every state also has an icon or a word.
 * Contrast: ink on parchment ≈ 13:1; white on primary ≈ 5.3:1; inkMuted on surface ≈ 5.6:1 (WCAG AA).
 */
import { Platform, useWindowDimensions } from 'react-native';

export const colors = {
  parchment: '#F6EFE3',
  surface: '#FFFFFF',
  surfaceAlt: '#FBF7F0',
  ink: '#1F2A2E',
  inkMuted: '#52626A',
  border: '#E4D9C6',
  primary: '#1F7A6D',
  primaryDark: '#145A50',
  primarySoft: '#D7EDE8',
  accent: '#D9822B',
  accentSoft: '#FBE6D0',
  sky: '#CDE8EC',
  hill: '#8FC195',
  hillDark: '#5E9B6E',
  mountain: '#9AA8B5',
  river: '#6FB3D2',
  path: '#E9D3A8',
  success: '#2E7D4F',
  successSoft: '#DFF1E6',
  caution: '#9A5B0B',
  cautionSoft: '#FCEFD9',
  locked: '#A7B0B4',
  overlay: 'rgba(20, 30, 34, 0.45)',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 10, md: 16, lg: 22, pill: 999 } as const;

export const type = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '800' as const, color: colors.ink },
  title: { fontSize: 21, lineHeight: 27, fontWeight: '700' as const, color: colors.ink },
  subtitle: { fontSize: 17, lineHeight: 23, fontWeight: '700' as const, color: colors.ink },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' as const, color: colors.ink },
  small: { fontSize: 14, lineHeight: 19, fontWeight: '500' as const, color: colors.inkMuted },
  label: { fontSize: 13, lineHeight: 17, fontWeight: '700' as const, color: colors.inkMuted, letterSpacing: 0.4 },
};

/** Minimum touch target (Android guideline 48dp). */
export const TOUCH = 48;
/** Content never stretches wider than this on tablets. */
export const MAX_WIDTH = 560;
/** content width in landscape: wide enough for two columns, still readable */
export const MAX_WIDTH_LANDSCAPE = 820;

export const shadow = Platform.select({
  android: { elevation: 2 },
  default: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
});

/** true when the screen is wider than tall (the game's default orientation) */
export function useLandscape(): boolean {
  const { width, height } = useWindowDimensions();
  return width > height;
}
export function useContentWidth(): number {
  return useLandscape() ? MAX_WIDTH_LANDSCAPE : MAX_WIDTH;
}

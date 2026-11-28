/** Naya Shehar design tokens. Every screen pulls colour, type, spacing and motion from here. */
export const palette = {
  saffron: '#F4A340',
  saffronDeep: '#D9822B',
  terracotta: '#C8553D',
  teal: '#2A9D8F',
  tealDeep: '#1F7A6F',
  leaf: '#3FAE6A',
  sky: '#8ECAE6',
  indigo: '#2D2A4A',
  plum: '#5B3E7A',
  rose: '#E2589B',
  sun: '#FFD166',
  cream: '#FFF6E8',
  paper: '#FFFBF3',
  ink: '#2B2433',
  inkSoft: '#5D5468',
  white: '#FFFFFF',
} as const;

export interface ThemeColors {
  bg: string; bgAlt: string; surface: string; surfaceRaised: string; border: string;
  text: string; textSoft: string; textOnPrimary: string;
  primary: string; primaryDeep: string; secondary: string; secondaryDeep: string;
  success: string; info: string; warning: string; locked: string; overlay: string; focus: string;
}

export const light: ThemeColors = {
  bg: palette.cream, bgAlt: '#FCEBD2', surface: palette.paper, surfaceRaised: palette.white, border: '#EAD8BC',
  text: palette.ink, textSoft: palette.inkSoft, textOnPrimary: '#3A2207',
  primary: palette.saffron, primaryDeep: palette.saffronDeep, secondary: palette.teal, secondaryDeep: palette.tealDeep,
  success: palette.leaf, info: '#5B8DEF', warning: palette.terracotta, locked: '#9A8F9E', overlay: 'rgba(43,36,51,0.55)', focus: '#2D6CDF',
};

export const dark: ThemeColors = {
  bg: '#1E1A2E', bgAlt: '#272238', surface: '#2D2840', surfaceRaised: '#38324E', border: '#4A4262',
  text: '#F7EFE3', textSoft: '#C7BDD3', textOnPrimary: '#2B1A05',
  primary: '#F6B25C', primaryDeep: '#D9822B', secondary: '#45B8AA', secondaryDeep: '#2A9D8F',
  success: '#5CC584', info: '#7FA6F2', warning: '#E07A62', locked: '#7D7390', overlay: 'rgba(0,0,0,0.6)', focus: '#8DB2FF',
};

export const fonts = {
  display: 'Baloo2_800ExtraBold',
  heading: 'Baloo2_700Bold',
  sub: 'Baloo2_600SemiBold',
  body: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_800ExtraBold',
} as const;

/** Type scale in dp before the player's text-size setting is applied. */
export const type = {
  hero: { fontFamily: fonts.display, fontSize: 40, lineHeight: 46 },
  title: { fontFamily: fonts.heading, fontSize: 28, lineHeight: 34 },
  heading: { fontFamily: fonts.heading, fontSize: 21, lineHeight: 27 },
  sub: { fontFamily: fonts.sub, fontSize: 17, lineHeight: 23 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23 },
  bodyBold: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 23 },
  small: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 18, letterSpacing: 0.4 },
} as const;
export type TypeVariant = keyof typeof type;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 10, md: 16, lg: 22, xl: 30, pill: 999 } as const;
export const MIN_TOUCH = 48;

export const motion = {
  fast: 140,
  base: 240,
  slow: 420,
  celebrate: 900,
  spring: { damping: 14, stiffness: 180, mass: 0.8 },
} as const;

/** Raised "toy" shadow used by buttons and cards: solid offset bottom edge + soft blur. */
export const elevation = (level: 1 | 2 | 3, color = '#7A4E2D') => ({
  shadowColor: color,
  shadowOpacity: 0.12 + level * 0.05,
  shadowRadius: 4 + level * 4,
  shadowOffset: { width: 0, height: 2 + level * 2 },
  elevation: level * 3,
});

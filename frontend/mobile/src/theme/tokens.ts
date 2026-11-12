// Rahyaab design tokens for React Native (Expo). Source of truth: design/tokens/tokens.json.
// Self-contained (no imports) so it can be copied to src/theme/ as is.

export type ColorScheme = 'light' | 'dark' | 'contrast';

export const colors = {
  light: {
    bg: '#F6EFE3',
    surface: '#FFFFFF',
    sunken: '#EDE3D3',
    border: '#DDD0BC',
    text: '#1F2326',
    muted: '#5A5650',
    primary: '#B54A2F',
    onPrimary: '#FFFFFF',
    primaryText: '#A2401F',
    secondary: '#1F7A7A',
    onSecondary: '#FFFFFF',
    secondaryText: '#17696A',
    accent: '#F2B33D',
    onAccent: '#1F2326',
    success: '#2E7A52',
    danger: '#B42318',
    focus: '#1F7A7A',
    logoTwig: '#8A5A3A',
    logoLeaf: '#3E8A5A',
    mascotBody: '#B54A2F',
    mascotInk: '#1F2326',
    mascotLight: '#F6EFE3',
    mascotOutline: '#F6EFE3',
  },
  dark: {
    bg: '#121B1B',
    surface: '#1B2626',
    sunken: '#233131',
    border: '#2F3E3E',
    text: '#F3ECE1',
    muted: '#A9B3AE',
    primary: '#E07A5C',
    onPrimary: '#121B1B',
    primaryText: '#F0957A',
    secondary: '#4FB3AE',
    onSecondary: '#121B1B',
    secondaryText: '#6FCBC5',
    accent: '#F2B33D',
    onAccent: '#121B1B',
    success: '#6FCF97',
    danger: '#FF8A80',
    focus: '#6FCBC5',
    logoTwig: '#FBF3E6',
    logoLeaf: '#6FCF97',
    mascotBody: '#D9643F',
    mascotInk: '#1F2326',
    mascotLight: '#F6EFE3',
    mascotOutline: '#F3ECE1',
  },
  contrast: {
    bg: '#FFFFFF',
    surface: '#FFFFFF',
    sunken: '#F0F0F0',
    border: '#4D4D4D',
    text: '#000000',
    muted: '#2B2B2B',
    primary: '#8A2A12',
    onPrimary: '#FFFFFF',
    primaryText: '#7A2410',
    secondary: '#0A4D4D',
    onSecondary: '#FFFFFF',
    secondaryText: '#0A4D4D',
    accent: '#F2B33D',
    onAccent: '#000000',
    success: '#145232',
    danger: '#8A1A10',
    focus: '#0A4D4D',
    logoTwig: '#8A5A3A',
    logoLeaf: '#3E8A5A',
    mascotBody: '#B54A2F',
    mascotInk: '#1F2326',
    mascotLight: '#F6EFE3',
    mascotOutline: '#F6EFE3',
  },
} as const;

export type ThemeColors = { [K in keyof (typeof colors)['light']]: string };

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32 } as const;
export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;
export const touchMin = 48;

// Font names as registered by @expo-google-fonts packages.
export const fontFamily = {
  display: 'BricolageGrotesque_800ExtraBold',
  sans: 'PlusJakartaSans_500Medium',
  sansSemibold: 'PlusJakartaSans_600SemiBold',
  sansBold: 'PlusJakartaSans_700Bold',
  urdu: 'Gulzar_400Regular',
  reading: 'AtkinsonHyperlegible_400Regular',
} as const;

export const typography = {
  displayXl: { fontFamily: fontFamily.display, fontSize: 40, lineHeight: 44, letterSpacing: -0.8 },
  displayL: { fontFamily: fontFamily.display, fontSize: 32, lineHeight: 36, letterSpacing: -0.6 },
  heading: { fontFamily: fontFamily.display, fontSize: 24, lineHeight: 30, letterSpacing: -0.3 },
  title: { fontFamily: fontFamily.sansBold, fontSize: 18, lineHeight: 24 },
  bodyL: { fontFamily: fontFamily.sans, fontSize: 17, lineHeight: 26 },
  body: { fontFamily: fontFamily.sans, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fontFamily.sansBold, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fontFamily.sansSemibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
  urduTitle: { fontFamily: fontFamily.urdu, fontSize: 24, lineHeight: 44 },
  urduBodyL: { fontFamily: fontFamily.urdu, fontSize: 21, lineHeight: 38 },
  urduBody: { fontFamily: fontFamily.urdu, fontSize: 19, lineHeight: 34 },
  urduLabel: { fontFamily: fontFamily.urdu, fontSize: 17, lineHeight: 30 },
  readingBody: { fontFamily: fontFamily.reading, fontSize: 17, lineHeight: 26 },
} as const;

export const breakpoints = { compact: 0, phone: 360, tablet: 600, desktop: 1024 } as const;
export type SizeClass = keyof typeof breakpoints;

export interface Layout {
  sizeClass: SizeClass;
  gutter: number;
  contentMaxWidth: number;
  columns: number;
  displayScale: number;
}

// Pass the window width (from useWindowDimensions) to get layout rules for that screen.
export function getLayout(width: number): Layout {
  if (width >= breakpoints.desktop) return { sizeClass: 'desktop', gutter: 32, contentMaxWidth: 1200, columns: 12, displayScale: 1 };
  if (width >= breakpoints.tablet) return { sizeClass: 'tablet', gutter: 24, contentMaxWidth: 640, columns: 2, displayScale: 1 };
  if (width >= breakpoints.phone) return { sizeClass: 'phone', gutter: 16, contentMaxWidth: width, columns: 1, displayScale: 1 };
  return { sizeClass: 'compact', gutter: 16, contentMaxWidth: width, columns: 1, displayScale: 0.85 };
}

export function getColors(scheme: ColorScheme | null | undefined): ThemeColors {
  if (scheme === 'contrast') return colors.contrast;
  return scheme === 'dark' ? colors.dark : colors.light;
}

// Brand files by theme, relative to the project root.
export const brandAssets = {
  logo: { light: 'design/brand/logo/svg/branch-light.svg', dark: 'design/brand/logo/svg/branch-dark.svg' },
  mascot: { light: 'design/brand/mascot/svg/hudhud.svg', dark: 'design/brand/mascot/svg/hudhud-dark.svg' },
} as const;

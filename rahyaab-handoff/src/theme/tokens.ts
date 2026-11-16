// Rahyaab design tokens (docs/BRAND.md, "FINAL DECISIONS"). Components use semantic tokens only; never raw hex.
// Every text pairing below is WCAG 2.2 AA in both schemes (contrast values in docs/BRAND.md).

export type ColorScheme = 'light' | 'dark';

export const color = {
  light: {
    surface: { canvas: '#F6EFE3', raised: '#FFFFFF', sunken: '#EDE3D3' },
    border: { subtle: '#DDD0BC' },
    text: { primary: '#1F2326', secondary: '#5A5650' },
    primary: { fill: '#B54A2F', on: '#FFFFFF', text: '#A2401F' }, // terracotta: main action, Dil
    secondary: { fill: '#1F7A7A', on: '#FFFFFF', text: '#17696A' }, // teal: second action, Duniya
    accent: { fill: '#F2B33D', on: '#1F2326' }, // saffron: highlights only, never text
    status: { success: '#2E7A52', danger: '#B42318' },
    focus: '#1F7A7A',
    logo: { twig: '#8A5A3A', leaf: '#3E8A5A' },
    mascot: { body: '#B54A2F', ink: '#1F2326', light: '#F6EFE3', outline: null },
  },
  dark: {
    surface: { canvas: '#121B1B', raised: '#1B2626', sunken: '#233131' },
    border: { subtle: '#2F3E3E' },
    text: { primary: '#F3ECE1', secondary: '#A9B3AE' },
    primary: { fill: '#E07A5C', on: '#121B1B', text: '#F0957A' },
    secondary: { fill: '#4FB3AE', on: '#121B1B', text: '#6FCBC5' },
    accent: { fill: '#F2B33D', on: '#121B1B' },
    status: { success: '#6FCF97', danger: '#FF8A80' },
    focus: '#6FCBC5',
    logo: { twig: '#FBF3E6', leaf: '#6FCF97' },
    mascot: { body: '#D9643F', ink: '#1F2326', light: '#F6EFE3', outline: '#F3ECE1' }, // 1.5px die-cut edge on dark
  },
} as const;

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32 } as const;
export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;
export const font = {
  display: 'BricolageGrotesque_800ExtraBold',
  body: 'PlusJakartaSans_500Medium', bodySemibold: 'PlusJakartaSans_600SemiBold', bodyBold: 'PlusJakartaSans_700Bold',
  urdu: 'Gulzar_400Regular',
} as const;
export const type = {
  displayXl: { fontFamily: font.display, fontSize: 40, lineHeight: 44, letterSpacing: -0.8 },
  displayL: { fontFamily: font.display, fontSize: 32, lineHeight: 36, letterSpacing: -0.6 },
  heading: { fontFamily: font.display, fontSize: 24, lineHeight: 30, letterSpacing: -0.3 },
  title: { fontFamily: font.bodyBold, fontSize: 18, lineHeight: 24 },
  bodyL: { fontFamily: font.body, fontSize: 17, lineHeight: 26 },
  body: { fontFamily: font.body, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: font.bodyBold, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: font.bodySemibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
  urduBody: { fontFamily: font.urdu, fontSize: 18, lineHeight: 34 },
} as const;
export const motion = { fast: 150, base: 250, reveal: 400 } as const;
export const touchTarget = 48;
export const screenGutter = 16;

export type Theme = (typeof color)[ColorScheme];

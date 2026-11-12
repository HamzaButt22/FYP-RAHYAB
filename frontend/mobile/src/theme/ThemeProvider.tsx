// Gives every screen the colours and type for the current mode (light, dark or high contrast).
// tokens.ts is a copy of design/tokens/theme.ts; design/tokens/check_tokens.py fails CI if they differ.

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme, useWindowDimensions } from 'react-native';

import { getColors, getLayout, type ColorScheme, type Layout, type ThemeColors } from './tokens';

export interface Theme {
  scheme: ColorScheme;
  colors: ThemeColors;
  layout: Layout;
}

const ThemeContext = createContext<Theme | null>(null);

// `highContrast` comes from the You → Accessibility setting (S-18) once it is built; until then it is off.
export function ThemeProvider({ children, highContrast = false }: { children: ReactNode; highContrast?: boolean }) {
  const system = useColorScheme();
  const { width } = useWindowDimensions();
  const scheme: ColorScheme = highContrast ? 'contrast' : system === 'dark' ? 'dark' : 'light';
  const value = useMemo(() => ({ scheme, colors: getColors(scheme), layout: getLayout(width) }), [scheme, width]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used inside ThemeProvider');
  return theme;
}

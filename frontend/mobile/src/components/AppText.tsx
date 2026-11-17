// Text in the brand type scale. Display sizes stop growing at 1.3× the phone's font scale; body text scales
// to 200% (SRS §8.5). Pass maxFontSizeMultiplier to cap a piece of text lower (the tab labels do).
// The student's settings (FR-97) add an in-app text size (the total still never passes the cap) and the
// reading font, Atkinson Hyperlegible with extra spacing, for running text.

import { Text, type TextProps, type TextStyle } from 'react-native';

import { textSizing } from '@/settings/settings';
import { useSettings } from '@/settings/SettingsProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { fontFamily, typography, type ThemeColors } from '@/theme/tokens';

export type Variant = 'displayXl' | 'displayL' | 'heading' | 'title' | 'bodyL' | 'body' | 'label' | 'caption';

const DISPLAY: Variant[] = ['displayXl', 'displayL', 'heading'];
/** Running text that switches to the reading font (bold styles keep the brand font: no bold reading face). */
const READING: Variant[] = ['bodyL', 'body', 'caption'];

interface Props extends TextProps {
  variant?: Variant;
  color?: keyof ThemeColors;
  align?: TextStyle['textAlign'];
}

export function AppText({
  variant = 'body',
  color = 'text',
  align,
  style,
  children,
  maxFontSizeMultiplier,
  ...rest
}: Props) {
  const { colors } = useTheme();
  const { settings } = useSettings();
  const cap = maxFontSizeMultiplier ?? (DISPLAY.includes(variant) ? 1.3 : 2);
  const { appScale, maxSystemScale } = textSizing(settings.textScale, cap);
  const base = typography[variant];
  const reading = settings.readingFont && READING.includes(variant);
  const sized = {
    fontSize: base.fontSize * appScale,
    lineHeight: base.lineHeight * appScale * (reading ? 1.15 : 1),
    ...(reading ? { fontFamily: fontFamily.reading, letterSpacing: 0.4 } : null),
  };
  return (
    <Text
      maxFontSizeMultiplier={maxSystemScale}
      style={[base, sized, { color: colors[color], textAlign: align }, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}

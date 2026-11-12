// Text in the brand type scale. In Urdu it switches to Gulzar with taller lines and extra headroom, because
// Nastaliq letters such as گ rise above the line box and Android cuts them off (SRS §7.4). Display sizes stop growing at 1.3× the phone's font scale; body text scales to 200% (SRS §8.5).

import { Text, type TextProps, type TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme/ThemeProvider';
import { typography, type ThemeColors } from '@/theme/tokens';

export type Variant = 'displayXl' | 'displayL' | 'heading' | 'title' | 'bodyL' | 'body' | 'label' | 'caption';

const URDU: Record<Variant, keyof typeof typography> = {
  displayXl: 'urduTitle',
  displayL: 'urduTitle',
  heading: 'urduTitle',
  title: 'urduTitle',
  bodyL: 'urduBodyL',
  body: 'urduBody',
  label: 'urduLabel',
  caption: 'urduLabel',
};
const DISPLAY: Variant[] = ['displayXl', 'displayL', 'heading'];

interface Props extends TextProps {
  variant?: Variant;
  color?: keyof ThemeColors;
  align?: TextStyle['textAlign'];
  /** Force a script, e.g. the word "اردو" on the English language screen. */
  script?: 'latin' | 'urdu';
}

export function AppText({ variant = 'body', color = 'text', align, script, style, ...rest }: Props) {
  const { colors } = useTheme();
  const { i18n } = useTranslation();
  const urdu = script ? script === 'urdu' : i18n.language === 'ur';
  const base = urdu ? typography[URDU[variant]] : typography[variant];
  // Gulzar's tallest strokes (the bar of گ, the top of ط) rise above the first line's box, and Android
  // clips text at the top of its view; this headroom keeps them visible.
  const headroom = urdu ? { paddingTop: Math.round(base.fontSize * 0.6) } : null;
  return (
    <Text
      maxFontSizeMultiplier={DISPLAY.includes(variant) ? 1.3 : 2}
      style={[base, headroom, { color: colors[color], textAlign: align, includeFontPadding: false }, style]}
      {...rest}
    />
  );
}

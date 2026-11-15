// Text in the brand type scale. In Urdu it switches to Gulzar with taller lines and extra headroom, because
// Nastaliq letters such as گ and آ rise above the line box and Android cuts them off (SRS §7.4). Display
// sizes stop growing at 1.3× the phone's font scale; body text scales to 200% (SRS §8.5).
//
// Urdu clipping, fixed 15 Nov 2026 (tested on the API 37 emulator):
// - Lines that disappeared ("کرنا" missing, "آگے" cut at the side) came from Android 15+ wrapping text by
//   the ink of the letters while React Native measures by their advance widths; the app theme now makes
//   Android wrap by advance width too (plugins/withAdvanceWidthText.js).
// - The top of the first line: Gulzar reserves 1.5 em above the baseline, but React Native shortens the
//   ascent to fit our line heights, so the headroom below adds the room back. It grows with the phone's
//   font size, which scales the text but not plain padding.

import { Text, useWindowDimensions, type TextProps, type TextStyle } from 'react-native';
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

const ROOM = ' '; // NARROW NO-BREAK SPACE: not a line-end space, so it is never trimmed

export function AppText({ variant = 'body', color = 'text', align, script, style, children, ...rest }: Props) {
  const { colors } = useTheme();
  const { i18n } = useTranslation();
  const { fontScale } = useWindowDimensions();
  const maxScale = DISPLAY.includes(variant) ? 1.3 : 2;
  const urdu = script ? script === 'urdu' : i18n.language === 'ur';
  const base = urdu ? typography[URDU[variant]] : typography[variant];
  // Gulzar's tallest strokes (the bar of گ, the top of ط) rise above the first line's box, and Android
  // clips text at the top of its view; this headroom keeps them visible.
  const em = base.fontSize * Math.min(fontScale, maxScale);
  const headroom = urdu ? { paddingTop: Math.round(em * 0.6) } : null;
  // Nastaliq letters reach past their own width at the ends of a line (the bar of a first گ, the tail of a
  // last ے), and Android clips text at the side edges of its box (padding does not help: the clip is at
  // the content edge). A narrow no-break space at each end gives that ink room inside the box. Android
  // does not trim it at a line end, so React Native measures it and the box includes it.
  const content = urdu && typeof children === 'string' ? `${ROOM}${children}${ROOM}` : children;
  return (
    <Text
      maxFontSizeMultiplier={maxScale}
      style={[base, headroom, { color: colors[color], textAlign: align, includeFontPadding: false }, style]}
      {...rest}
    >
      {content}
    </Text>
  );
}

// Text in the brand type scale. Display sizes stop growing at 1.3× the phone's font scale; body text scales
// to 200% (SRS §8.5). Pass maxFontSizeMultiplier to cap a piece of text lower (the tab labels do).

import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { typography, type ThemeColors } from '@/theme/tokens';

export type Variant = 'displayXl' | 'displayL' | 'heading' | 'title' | 'bodyL' | 'body' | 'label' | 'caption';

const DISPLAY: Variant[] = ['displayXl', 'displayL', 'heading'];

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
  const maxScale = maxFontSizeMultiplier ?? (DISPLAY.includes(variant) ? 1.3 : 2);
  return (
    <Text
      maxFontSizeMultiplier={maxScale}
      style={[typography[variant], { color: colors[color], textAlign: align }, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}

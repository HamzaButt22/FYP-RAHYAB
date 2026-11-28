import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { type as typeScale, TypeVariant } from './tokens';
import { useTheme } from '@/state/GameProvider';

export interface GameTextProps extends TextProps {
  variant?: TypeVariant;
  color?: string;
  center?: boolean;
  soft?: boolean;
}

/** All game text goes through here so the text-size setting applies everywhere. */
export function GText({ variant = 'body', color, center, soft, style, ...rest }: GameTextProps) {
  const { c, scale } = useTheme();
  const t = typeScale[variant];
  const base: TextStyle = {
    ...t,
    fontSize: t.fontSize * scale,
    lineHeight: t.lineHeight * scale,
    color: color ?? (soft ? c.textSoft : c.text),
    textAlign: center ? 'center' : undefined,
  };
  return <RNText maxFontSizeMultiplier={1.4} {...rest} style={[base, style]} />;
}

// The text box inside a Field: 56 dp tall, a 2 dp red border when there is a problem, a focus ring
// otherwise. Codes are typed in Latin letters; nicknames may be Urdu, so they follow the app's script.

import { forwardRef, useState, type ComponentRef } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, typography } from '@/theme/tokens';

/** What a ref to the box points at (focus() after an error). */
export type TextInputHandle = ComponentRef<typeof TextInput>;

interface Props extends TextInputProps {
  invalid?: boolean;
  /** Codes: wide letter spacing and always left-to-right. */
  code?: boolean;
}

export const TextInputBox = forwardRef<TextInputHandle, Props>(function TextInputBox(
  { invalid = false, code = false, style, onFocus, onBlur, ...rest },
  ref,
) {
  const { colors } = useTheme();
  const { i18n } = useTranslation();
  const [focused, setFocused] = useState(false);
  const urdu = i18n.language === 'ur' && !code;
  const font = urdu ? typography.urduBody : typography.bodyL;
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={colors.muted}
      selectionColor={colors.focus}
      maxFontSizeMultiplier={2}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[
        styles.box,
        { fontFamily: font.fontFamily, fontSize: code ? 20 : font.fontSize, color: colors.text },
        code && styles.code,
        {
          backgroundColor: colors.surface,
          borderColor: invalid ? colors.danger : focused ? colors.focus : colors.border,
          borderWidth: invalid || focused ? 2 : 1.5,
        },
        style,
      ]}
      {...rest}
    />
  );
});

const styles = StyleSheet.create({
  box: { minHeight: 56, borderRadius: radius.md, paddingHorizontal: space[4], paddingVertical: space[3] },
  code: { letterSpacing: 3, writingDirection: 'ltr', textAlign: 'left' },
});

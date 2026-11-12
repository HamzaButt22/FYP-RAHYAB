// Primary and text buttons from design/specs/components.md: at least 48 dp tall, one clear label.

import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, touchMin } from '@/theme/tokens';
import { AppText } from './AppText';

interface Props {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'text';
  disabled?: boolean;
  accessibilityHint?: string;
}

export function Button({ label, onPress, kind = 'primary', disabled = false, accessibilityHint }: Props) {
  const { colors } = useTheme();
  const primary = kind === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        primary && { backgroundColor: colors.primary },
        { opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      <AppText variant="title" color={primary ? 'onPrimary' : 'primaryText'} align="center">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchMin,
    borderRadius: radius.lg,
    paddingVertical: space[3],
    paddingHorizontal: space[5],
    justifyContent: 'center',
    alignItems: 'center',
  },
});

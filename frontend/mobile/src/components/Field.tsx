// One form field as design/specs/forms-and-errors.md §1 draws it: label, a hint that is always visible,
// the control, and an inline message with an icon (never colour alone), announced to screen readers.

import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Check, X } from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';
import { AppText } from './AppText';

export type FieldMessage = { tone: 'error' | 'success'; text: string } | null;

interface Props {
  label: string;
  hint?: string;
  message?: FieldMessage;
  children: ReactNode;
  /** Groups the label with a picker row for screen readers (radiogroup for the class buttons). */
  groupRole?: 'radiogroup';
}

export function Field({ label, hint, message, children, groupRole }: Props) {
  const { colors } = useTheme();
  const Icon = message?.tone === 'success' ? Check : X;
  const tone = message?.tone === 'success' ? colors.success : colors.danger;
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      {hint ? (
        <AppText variant="body" color="muted">
          {hint}
        </AppText>
      ) : null}
      <View accessibilityRole={groupRole} accessibilityLabel={groupRole ? label : undefined}>
        {children}
      </View>
      <View accessibilityLiveRegion="polite" style={styles.messageRow}>
        {message ? (
          <>
            <Icon color={tone} size={20} strokeWidth={2.5} accessibilityElementsHidden importantForAccessibility="no" />
            <AppText style={[styles.message, { color: tone }]}>{message.text}</AppText>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: space[1] },
  messageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space[2] },
  message: { flex: 1 },
});

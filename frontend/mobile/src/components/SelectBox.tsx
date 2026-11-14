// A picker that opens a list in a sheet (birth month and year). Pickers prevent typing mistakes
// (forms-and-errors.md §1). Each option is a radio with a 56 dp row; the chosen one is ticked.

import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, touchMin } from '@/theme/tokens';
import { AppText } from './AppText';
import { Button } from './Button';

export type SelectOption<T> = { value: T; label: string };

interface Props<T> {
  /** Shown on the box before a choice, and read out with the label. */
  placeholder: string;
  /** Spoken name of the box, e.g. "Month you were born". */
  accessibilityLabel: string;
  sheetTitle: string;
  closeLabel: string;
  options: readonly SelectOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  invalid?: boolean;
}

export function SelectBox<T extends string | number>({
  placeholder,
  accessibilityLabel,
  sheetTitle,
  closeLabel,
  options,
  value,
  onChange,
  invalid = false,
}: Props<T>) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const chosen = options.find((o) => o.value === value);
  const initialIndex = Math.max(0, options.findIndex((o) => o.value === value));

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${accessibilityLabel}: ${chosen ? chosen.label : placeholder}`}
        onPress={() => setOpen(true)}
        style={[
          styles.box,
          {
            backgroundColor: colors.surface,
            borderColor: invalid ? colors.danger : colors.border,
            borderWidth: invalid ? 2 : 1.5,
          },
        ]}
      >
        <AppText variant="bodyL" color={chosen ? 'text' : 'muted'} style={styles.boxText}>
          {chosen ? chosen.label : placeholder}
        </AppText>
        <ChevronDown color={colors.muted} size={22} accessibilityElementsHidden importantForAccessibility="no" />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={[styles.scrim, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
          <SafeAreaView edges={['bottom']} style={[styles.sheet, { backgroundColor: colors.bg }]}>
            <AppText variant="heading" accessibilityRole="header" style={styles.sheetTitle}>
              {sheetTitle}
            </AppText>
            <FlatList
              data={options}
              keyExtractor={(o) => String(o.value)}
              initialScrollIndex={initialIndex}
              getItemLayout={(_, index) => ({ length: ROW, offset: ROW * index, index })}
              accessibilityRole="radiogroup"
              renderItem={({ item }) => {
                const selected = item.value === value;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected, checked: selected }}
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    style={[styles.row, { borderBottomColor: colors.border }]}
                  >
                    <AppText variant="bodyL" style={styles.boxText}>
                      {item.label}
                    </AppText>
                    {selected ? (
                      <Check color={colors.primary} size={22} strokeWidth={2.5} accessibilityElementsHidden />
                    ) : null}
                  </Pressable>
                );
              }}
            />
            <Button kind="text" label={closeLabel} onPress={() => setOpen(false)} />
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const ROW = 56;

const styles = StyleSheet.create({
  box: {
    minHeight: 56,
    borderRadius: radius.md,
    paddingHorizontal: space[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  boxText: { flex: 1 },
  scrim: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '75%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: space[4],
    paddingTop: space[4],
  },
  sheetTitle: { marginBottom: space[2] },
  row: {
    height: ROW,
    minHeight: touchMin,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

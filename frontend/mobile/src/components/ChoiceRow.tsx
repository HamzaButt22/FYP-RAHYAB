// A row of equal buttons where one can be chosen (the class picker, 8 to 12). Selection is a thick border
// AND announced as "selected", never colour alone (SRS §7.3). Mirrors in Urdu like the rest of the layout.

import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, touchMin } from '@/theme/tokens';
import { AppText } from './AppText';

interface Props<T extends string | number> {
  options: readonly T[];
  value: T | null;
  onChange: (value: T) => void;
  /** Spoken label for one option, e.g. "Class 9". */
  optionLabel: (value: T) => string;
  invalid?: boolean;
}

export function ChoiceRow<T extends string | number>({ options, value, onChange, optionLabel, invalid }: Props<T>) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.sunken, borderColor: invalid ? colors.danger : 'transparent' },
      ]}
    >
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ selected, checked: selected }}
            accessibilityLabel={optionLabel(option)}
            onPress={() => onChange(option)}
            style={[
              styles.option,
              selected && { backgroundColor: colors.surface, borderColor: colors.text, borderWidth: 2 },
            ]}
          >
            <AppText variant="title" align="center" script="latin">
              {String(option)}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderRadius: radius.lg, padding: space[1], gap: space[1], borderWidth: 2 },
  option: {
    flex: 1,
    minHeight: touchMin + 8,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'transparent',
    borderWidth: 2,
  },
});

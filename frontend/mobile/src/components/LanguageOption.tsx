// One of the two language cards on S-01. Selection is shown by a thick border AND announced as
// "selected", never by colour alone (SRS §7.3).

import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, touchMin } from '@/theme/tokens';
import { AppText } from './AppText';

interface Props {
  name: string;
  note: string;
  label: string;
  nameScript: 'latin' | 'urdu';
  selected: boolean;
  onPress: () => void;
}

export function LanguageOption({ name, note, label, nameScript, selected, onPress }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          borderWidth: selected ? 3 : 1.5,
        },
      ]}
    >
      <AppText variant="heading" align="center" script={nameScript}>
        {name}
      </AppText>
      <AppText variant="caption" color="muted" align="center" style={styles.note}>
        {note}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: touchMin * 2,
    borderRadius: radius.xl,
    paddingVertical: space[5],
    paddingHorizontal: space[3],
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
  },
  note: { textTransform: 'uppercase' },
});

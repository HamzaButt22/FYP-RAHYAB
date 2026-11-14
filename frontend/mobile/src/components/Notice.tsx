// A message about the whole form (offline, too many tries, the school's access), announced as an alert.

import { StyleSheet, View } from 'react-native';
import { CircleAlert } from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import { AppText } from './AppText';

export function Notice({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={[styles.box, { backgroundColor: colors.sunken, borderColor: colors.danger }]}
    >
      <CircleAlert color={colors.danger} size={22} accessibilityElementsHidden importantForAccessibility="no" />
      <AppText style={styles.text}>{text}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[3],
    padding: space[4],
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  text: { flex: 1 },
});

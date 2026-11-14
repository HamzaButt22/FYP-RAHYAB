// Hudhud's help card: appears after 2 failed tries on the same field (forms-and-errors.md §1, §5), with
// the most likely fix. It never opens a way around a check (§4).

import { Image, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import { AppText } from './AppText';

const HUDHUD = {
  light: require('../../assets/brand/hudhud-messenger.png'),
  dark: require('../../assets/brand/hudhud-messenger-dark.png'),
};

export function HelpCard({ title, body }: { title: string; body: string }) {
  const { colors, scheme } = useTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.secondary }]}
    >
      <View style={styles.top}>
        <Image
          source={scheme === 'dark' ? HUDHUD.dark : HUDHUD.light}
          style={styles.mascot}
          resizeMode="contain"
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <AppText variant="title" accessibilityRole="header" style={styles.title}>
          {title}
        </AppText>
      </View>
      <AppText color="muted">{body}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1.5, borderRadius: radius.xl, padding: space[4], gap: space[3] },
  top: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  mascot: { width: 64, height: 48 },
  title: { flex: 1 },
});

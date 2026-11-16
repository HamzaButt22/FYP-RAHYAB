// Tappable suggestions under a field (nickname ideas on S-03). Each chip is a 48 dp button whose spoken
// label says what tapping does ("Use the nickname Jugnu_27"); "Show others" draws new ones.

import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, touchMin } from '@/theme/tokens';
import { AppText } from './AppText';

interface Props {
  title: string;
  ideas: readonly string[];
  onPick: (idea: string) => void;
  /** Spoken label for one chip. */
  pickLabel: (idea: string) => string;
  moreLabel?: string;
  onMore?: () => void;
}

export function IdeaChips({ title, ideas, onPick, pickLabel, moreLabel, onMore }: Props) {
  const { colors } = useTheme();
  if (ideas.length === 0) return null;
  return (
    <View style={styles.wrap}>
      <AppText variant="caption" color="muted">
        {title}
      </AppText>
      <View style={styles.row}>
        {ideas.map((idea) => (
          <Pressable
            key={idea}
            accessibilityRole="button"
            accessibilityLabel={pickLabel(idea)}
            onPress={() => onPick(idea)}
            style={({ pressed }) => [
              styles.chip,
              { borderColor: colors.secondary, backgroundColor: pressed ? colors.sunken : colors.surface },
            ]}
          >
            <AppText variant="label" color="secondaryText">
              {idea}
            </AppText>
          </Pressable>
        ))}
        {onMore && moreLabel ? (
          <Pressable accessibilityRole="button" onPress={onMore} style={styles.more}>
            <AppText variant="label" color="primaryText">
              {moreLabel}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[2] },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], alignItems: 'center' },
  chip: {
    minHeight: touchMin,
    justifyContent: 'center',
    paddingHorizontal: space[4],
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  more: { minHeight: touchMin, justifyContent: 'center', paddingHorizontal: space[2] },
});

// Screen header from the S-03 designs: a round back button, the screen name, and "?" (FR-103: every
// screen says what it is for in two lines). The back arrow points the other way in Urdu.

import { useState } from 'react';
import { I18nManager, Pressable, StyleSheet, View } from 'react-native';
import { ChevronLeft, ChevronRight, CircleHelp } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, touchMin } from '@/theme/tokens';
import { AppText } from './AppText';

interface Props {
  title: string;
  onBack?: () => void;
  /** Two lines on what this screen is for. */
  help?: string;
}

export function Header({ title, onBack, help }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [showHelp, setShowHelp] = useState(false);
  const Back = I18nManager.isRTL ? ChevronRight : ChevronLeft;
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={onBack}
            style={[styles.round, { backgroundColor: colors.sunken }]}
          >
            <Back color={colors.text} size={26} accessibilityElementsHidden importantForAccessibility="no" />
          </Pressable>
        ) : null}
        <AppText variant="title" style={styles.title}>
          {title}
        </AppText>
        {help ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.help')}
            accessibilityState={{ expanded: showHelp }}
            onPress={() => setShowHelp((v) => !v)}
            style={[styles.round, { backgroundColor: colors.sunken }]}
          >
            <CircleHelp color={colors.text} size={26} accessibilityElementsHidden importantForAccessibility="no" />
          </Pressable>
        ) : null}
      </View>
      {help && showHelp ? (
        <View accessibilityLiveRegion="polite" style={[styles.help, { backgroundColor: colors.sunken }]}>
          <AppText>{help}</AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[3] },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  round: { width: touchMin, height: touchMin, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1 },
  help: { padding: space[4], borderRadius: radius.lg },
});

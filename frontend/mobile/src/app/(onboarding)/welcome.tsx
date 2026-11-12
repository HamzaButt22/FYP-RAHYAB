// S-02 Welcome (FR-02): the promise card. The other two onboarding cards and "I already have a profile"
// (re-link, FR-12) come with the onboarding screens.

import { router } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';
import { Lock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

const HUDHUD = {
  light: require('../../../assets/brand/hudhud-messenger.png'),
  dark: require('../../../assets/brand/hudhud-messenger-dark.png'),
};

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const { colors, scheme } = useTheme();
  return (
    <Screen footer={<Button label={t('onboarding.welcome.start')} onPress={() => router.push('/join')} />}>
      <Image
        source={scheme === 'dark' ? HUDHUD.dark : HUDHUD.light}
        style={styles.mascot}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel={t('onboarding.welcome.mascotLabel')}
      />
      <AppText variant="displayL" accessibilityRole="header">
        {t('onboarding.welcome.title')}
      </AppText>
      <AppText variant="bodyL" color="muted">
        {t('onboarding.welcome.body')}
      </AppText>
      <View style={[styles.promise, { backgroundColor: colors.sunken }]}>
        <Lock color={colors.text} size={24} strokeWidth={2} accessibilityElementsHidden importantForAccessibility="no" />
        <AppText style={styles.promiseText}>{t('onboarding.welcome.promise')}</AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mascot: { width: 220, height: 160, alignSelf: 'center', marginVertical: space[5] },
  promise: { flexDirection: 'row', alignItems: 'center', gap: space[4], padding: space[4], borderRadius: radius.lg },
  promiseText: { flex: 1 },
});

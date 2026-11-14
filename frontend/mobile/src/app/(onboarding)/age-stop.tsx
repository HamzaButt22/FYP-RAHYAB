// The neutral stop for students under 13 (FR-04, TC-EDGE-06). Nothing was sent or stored. The message
// does not say which answer caused it or how to get past it (AGE_ASSURANCE.md).

import { router } from 'expo-router';
import { Image, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

const HUDHUD = {
  light: require('../../../assets/brand/hudhud-messenger.png'),
  dark: require('../../../assets/brand/hudhud-messenger-dark.png'),
};

export default function AgeStopScreen() {
  const { t } = useTranslation();
  const { scheme } = useTheme();
  return (
    <Screen centered footer={<Button label={t('onboarding.ageStop.back')} onPress={() => router.replace('/welcome')} />}>
      <Image
        source={scheme === 'dark' ? HUDHUD.dark : HUDHUD.light}
        style={styles.mascot}
        resizeMode="contain"
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <AppText variant="displayL" accessibilityRole="header" align="center">
        {t('onboarding.ageStop.title')}
      </AppText>
      <AppText variant="bodyL" color="muted" align="center">
        {t('onboarding.ageStop.body')}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({ mascot: { width: 200, height: 140, alignSelf: 'center', marginBottom: space[4] } });

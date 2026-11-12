// S-01 Language (FR-01). English starts selected, as in the approved design. Continue saves the choice;
// choosing Urdu restarts the app in right-to-left layout.

import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { LanguageOption } from '@/components/LanguageOption';
import { Screen } from '@/components/Screen';
import { useAppState } from '@/state/AppState';
import type { Language } from '@/state/storage';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

const LOGO = { light: require('../../assets/brand/logo-light.png'), dark: require('../../assets/brand/logo-dark.png') };

export default function LanguageScreen() {
  const { t } = useTranslation();
  const { scheme } = useTheme();
  const { chooseLanguage } = useAppState();
  const [choice, setChoice] = useState<Language>('en');
  const [saving, setSaving] = useState(false);

  async function onContinue() {
    setSaving(true);
    try {
      await chooseLanguage(choice);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen
      centered
      footer={<Button label={t('common.continue')} onPress={onContinue} disabled={saving} />}
    >
      <View style={styles.brand}>
        <Image
          source={scheme === 'dark' ? LOGO.dark : LOGO.light}
          style={styles.logo}
          accessibilityRole="image"
          accessibilityLabel={t('common.logoLabel')}
        />
        <AppText variant="displayL" align="center" script="latin">
          rahyaab
        </AppText>
        <AppText variant="title" color="muted" align="center" script="urdu">
          {t('common.appNameUrdu')}
        </AppText>
      </View>

      <AppText variant="title" align="center" accessibilityRole="header">
        {t('onboarding.language.title')}
      </AppText>

      <View style={styles.options} accessibilityRole="radiogroup">
        <LanguageOption
          name={t('onboarding.language.englishName')}
          note={t('onboarding.language.englishNote')}
          label={t('onboarding.language.englishLabel')}
          nameScript="latin"
          selected={choice === 'en'}
          onPress={() => setChoice('en')}
        />
        <LanguageOption
          name={t('onboarding.language.urduName')}
          note={t('onboarding.language.urduNote')}
          label={t('onboarding.language.urduLabel')}
          nameScript="urdu"
          selected={choice === 'ur'}
          onPress={() => setChoice('ur')}
        />
      </View>

      <AppText color="muted" align="center">
        {t('onboarding.language.hint')}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', gap: space[1], marginBottom: space[4] },
  logo: { width: 96, height: 96 },
  options: { flexDirection: 'row', gap: space[3] },
});

// S-18 You (first part): change the language at any time (FR-01). Accessibility settings come next.

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { LanguageOption } from '@/components/LanguageOption';
import { Screen } from '@/components/Screen';
import { useAppState } from '@/state/AppState';
import type { Language } from '@/state/storage';
import { space } from '@/theme/tokens';

export default function YouScreen() {
  const { t } = useTranslation();
  const { language, chooseLanguage, resetOnboarding } = useAppState();
  const [busy, setBusy] = useState(false);

  async function pick(next: Language) {
    if (next === language || busy) return;
    setBusy(true);
    try {
      await chooseLanguage(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={['top']}>
      <AppText variant="displayL" accessibilityRole="header">
        {t('you.title')}
      </AppText>

      <AppText variant="title" accessibilityRole="header">
        {t('you.languageHeading')}
      </AppText>
      <View style={styles.options} accessibilityRole="radiogroup">
        <LanguageOption
          name={t('onboarding.language.englishName')}
          note={t('onboarding.language.englishNote')}
          label={t('onboarding.language.englishLabel')}
          nameScript="latin"
          selected={language === 'en'}
          onPress={() => pick('en')}
        />
        <LanguageOption
          name={t('onboarding.language.urduName')}
          note={t('onboarding.language.urduNote')}
          label={t('onboarding.language.urduLabel')}
          nameScript="urdu"
          selected={language === 'ur'}
          onPress={() => pick('ur')}
        />
      </View>
      <AppText color="muted">{t('you.languageNote')}</AppText>

      {__DEV__ ? <Button kind="text" label={t('you.devReset')} onPress={resetOnboarding} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({ options: { flexDirection: 'row', gap: space[3] } });

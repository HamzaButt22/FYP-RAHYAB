// S-18 You: accessibility settings (text size, read-aloud, reduced motion) come here next. The interface is
// English only (ADR-0016), so there is no language setting.

import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useAppState } from '@/state/AppState';

export default function YouScreen() {
  const { t } = useTranslation();
  const { resetOnboarding } = useAppState();

  return (
    <Screen edges={['top']}>
      <AppText variant="displayL" accessibilityRole="header">
        {t('you.title')}
      </AppText>
      <Button label={t('profile.youLink')} onPress={() => router.push('/profile')} />
      <AppText color="muted">{t('you.body')}</AppText>
      {__DEV__ ? <Button kind="text" label={t('you.devReset')} onPress={resetOnboarding} /> : null}
    </Screen>
  );
}

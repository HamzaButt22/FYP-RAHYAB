// A tab that is not built yet: its heading, one line on what will be here, and "Coming soon".

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { AppText } from './AppText';
import { Screen } from './Screen';

export function Placeholder({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <Screen edges={['top']}>
      <AppText variant="displayL" accessibilityRole="header">
        {title}
      </AppText>
      <AppText variant="bodyL" color="muted">
        {body}
      </AppText>
      <AppText variant="caption" color="secondaryText">
        {t('common.comingSoon')}
      </AppText>
      {children}
    </Screen>
  );
}

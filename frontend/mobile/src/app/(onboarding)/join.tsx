// S-03 Join: placeholder until the class-code screen and the device key are built.
// The skip button exists only in development builds, so a release build can never bypass joining.

import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useAppState } from '@/state/AppState';
import { space } from '@/theme/tokens';

export default function JoinScreen() {
  const { t } = useTranslation();
  const { finishOnboarding } = useAppState();
  return (
    <Screen
      footer={__DEV__ ? <Button kind="text" label={t('onboarding.join.devSkip')} onPress={finishOnboarding} /> : undefined}
    >
      <View style={styles.top}>
        <AppText variant="displayL" accessibilityRole="header">
          {t('onboarding.join.title')}
        </AppText>
        <AppText variant="bodyL" color="muted">
          {t('onboarding.join.body')}
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ top: { gap: space[3], marginTop: space[6] } });

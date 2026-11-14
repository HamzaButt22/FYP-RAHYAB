// S-07 Home (placeholder for the week loop). Until the family's consent slip is claimed, a banner says
// that nothing is saved yet and links to S-04 (FR-05).

import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Placeholder } from '@/components/Placeholder';
import { useAppState } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { session } = useAppState();
  const waiting = session?.consentState !== 'granted';
  return (
    <Placeholder title={t('home.title')} body={t('home.body')}>
      {waiting ? (
        <View style={[styles.banner, { backgroundColor: colors.surface, borderColor: colors.accent }]}>
          <AppText variant="title" accessibilityRole="header">
            {t('home.consentPendingTitle')}
          </AppText>
          <AppText color="muted">{t('home.consentPendingBody')}</AppText>
          <Button kind="text" label={t('home.consentPendingAction')} onPress={() => router.push('/consent')} />
        </View>
      ) : null}
    </Placeholder>
  );
}

const styles = StyleSheet.create({
  banner: { borderWidth: 2, borderRadius: radius.xl, padding: space[4], gap: space[2] },
});

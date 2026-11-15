// S-07 Home (FR-13, FR-52): this week's place in the week plan, time left, one Continue button, and the
// paths, locked with an explanation until four scored weeks are done. Until the family's consent slip is
// claimed, a banner says that nothing is saved yet and links to S-04 (FR-05).

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ACTIVE_PLAN, loadProgress } from '@/game/progress';
import {
  WEEKS_FOR_RESULTS,
  currentStep,
  minutesLeftThisWeek,
  resultsUnlocked,
  scoredWeeksDone,
  type Progress,
} from '@/game/weekLoop';
import { useAppState } from '@/state/AppState';
import { getKv } from '@/sync/runtime';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { session } = useAppState();
  const waiting = session?.consentState !== 'granted';
  const studentId = session?.studentId ?? '';
  const [progress, setProgress] = useState<Progress | null>(null);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      void getKv()
        .then((kv) => live && setProgress(loadProgress(kv, studentId)))
        .catch(() => undefined);
      return () => {
        live = false;
      };
    }, [studentId])
  );

  const here = progress ? currentStep(ACTIVE_PLAN, progress) : null;
  const card = { backgroundColor: colors.surface, borderColor: colors.border };

  return (
    <Screen edges={['top']}>
      <AppText variant="displayL" accessibilityRole="header">
        {t('home.title')}
      </AppText>

      {waiting ? (
        <View style={[styles.box, { backgroundColor: colors.surface, borderColor: colors.accent, borderWidth: 2 }]}>
          <AppText variant="title" accessibilityRole="header">
            {t('home.consentPendingTitle')}
          </AppText>
          <AppText color="muted">{t('home.consentPendingBody')}</AppText>
          <Button kind="text" label={t('home.consentPendingAction')} onPress={() => router.push('/consent')} />
        </View>
      ) : null}

      {progress ? (
        <View style={[styles.box, card]}>
          {here ? (
            <>
              <AppText variant="heading" accessibilityRole="header">
                {here.week.week === 0 ? t('home.prologue') : t('home.weekTitle', { n: here.week.week })}
              </AppText>
              {here.week.practice ? <AppText color="secondaryText">{t('home.practiceNote')}</AppText> : null}
              <AppText color="muted">
                {t('home.stepOf', { n: progress.stepIndex + 1, total: here.week.steps.length })}
              </AppText>
              <AppText color="muted">
                {t('home.minutesLeft', { n: minutesLeftThisWeek(ACTIVE_PLAN, progress) })}
              </AppText>
              <Button
                label={progress.stepIndex === 0 ? t('home.start') : t('home.continue')}
                onPress={() => router.push('/play')}
              />
            </>
          ) : (
            <AppText variant="title">{t('home.allDone')}</AppText>
          )}
        </View>
      ) : null}

      {progress ? (
        <View style={[styles.box, card]}>
          <AppText variant="title" accessibilityRole="header">
            {t('results.title')}
          </AppText>
          {resultsUnlocked(ACTIVE_PLAN, progress) ? (
            <Button label={t('home.seePaths')} onPress={() => router.push('/results')} />
          ) : (
            <>
              <AppText color="muted">{t('home.pathsLocked', { weeks: WEEKS_FOR_RESULTS })}</AppText>
              <AppText color="muted">
                {t('home.weeksDone', { n: scoredWeeksDone(ACTIVE_PLAN, progress), total: WEEKS_FOR_RESULTS })}
              </AppText>
            </>
          )}
        </View>
      ) : null}

      {__DEV__ ? (
        <Button kind="text" label={t('home.gameLab')} onPress={() => router.push('/game-lab')} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: radius.xl, padding: space[4], gap: space[2] },
});

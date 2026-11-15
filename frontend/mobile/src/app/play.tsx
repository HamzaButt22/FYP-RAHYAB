// The week player (FR-14-17): plays the next step of the week plan as a real run. Events go to the
// encrypted outbox; the prologue is practice (FR-14). After each finished step the place is saved (FR-15)
// and the next step starts; after a week's last step the week is recorded (week_complete) and the student
// goes back home. "Take a break" leaves at any time and keeps the place; "?" re-opens the help (FR-16).
// There is no timer and no right or wrong anywhere (FR-17).

import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { CONTENT_VERSION } from '@/game/content';
import type { GameModule, GameResult, JsonObject } from '@/game/contract';
import { GameScreen } from '@/game/GameScreen';
import { ACTIVE_PLAN, loadProgress, moduleStore, saveProgress } from '@/game/progress';
import { findModule } from '@/game/registry';
import { createRun, type Run } from '@/game/run';
import { advance, currentStep, type Progress, type Week } from '@/game/weekLoop';
import { useAppState } from '@/state/AppState';
import { getKv, getOutbox, outboxSink, SESSION_ID, syncNow } from '@/sync/runtime';
import { space } from '@/theme/tokens';

type Playing = { run: Run; module: GameModule; week: Week; params: JsonObject | undefined };
type Shown =
  | { kind: 'loading' }
  | { kind: 'playing'; playing: Playing }
  | { kind: 'weekDone'; week: Week }
  | { kind: 'problem' };

const goHome = () => (router.canGoBack() ? router.back() : router.replace('/home'));

export default function PlayScreen() {
  const { t, i18n } = useTranslation();
  const { session } = useAppState();
  const studentId = session?.studentId ?? '';
  const consented = useRef(false);
  useEffect(() => {
    consented.current = session?.consentState === 'granted'; // read when a step ends, without restarting play
  }, [session?.consentState]);
  const [view, setView] = useState<Shown>({ kind: 'loading' });
  const progressRef = useRef<Progress | null>(null);

  useEffect(() => {
    let cancelled = false;

    const startNext = async () => {
      const [kv, outbox] = await Promise.all([getKv(), getOutbox()]);
      const progress = progressRef.current ?? loadProgress(kv, studentId);
      progressRef.current = progress;
      const here = currentStep(ACTIVE_PLAN, progress);
      const module = here ? findModule(here.step.module) : undefined;
      if (!here) {
        if (!cancelled) goHome(); // every week played
        return;
      }
      if (!module) {
        if (!cancelled) setView({ kind: 'problem' }); // the plan names a module this build does not have
        return;
      }
      const locale = i18n.language === 'ur' ? 'ur' : 'en';
      const run = createRun({
        module,
        context: {
          locale,
          rtl: I18nManager.isRTL,
          week: here.week.week,
          practice: here.week.practice,
          a11yMode: false,
          reducedMotion: false,
          params: here.step.params,
        },
        sessionId: SESSION_ID,
        contentVersion: CONTENT_VERSION,
        sink: outboxSink(outbox),
        store: moduleStore(kv, studentId),
        saveKey: here.step.id,
        strict: __DEV__,
        monotonic: () => performance.now(),
        wallClock: () => Date.now(),
        onFinish: (result: GameResult, ended: Run) => {
          if (!result.completed) return; // left or crashed: the place stays at this step
          const next = advance(ACTIVE_PLAN, progressRef.current ?? progress);
          if (next.weekDone) ended.recordWeekComplete();
          progressRef.current = next.progress;
          saveProgress(kv, studentId, next.progress);
          // Upload when possible; the outbox keeps the events otherwise. Before consent nothing is sent (FR-05).
          if (consented.current) void syncNow().catch(() => undefined);
          if (cancelled) return;
          if (next.weekDone) setView({ kind: 'weekDone', week: next.weekDone });
          else void startNext();
        },
      });
      if (!cancelled) setView({ kind: 'playing', playing: { run, module, week: here.week, params: here.step.params } });
    };

    void startNext().catch(() => !cancelled && setView({ kind: 'problem' }));
    return () => {
      cancelled = true;
    };
  }, [studentId, i18n.language]);

  const title =
    view.kind === 'playing'
      ? view.playing.week.week === 0
        ? t('home.prologue')
        : t('home.weekTitle', { n: view.playing.week.week })
      : t('play.title');

  return (
    <Screen>
      <Header title={title} onBack={goHome} help={t('play.help')} />
      {view.kind === 'loading' ? <AppText color="muted">{t('play.loading')}</AppText> : null}
      {view.kind === 'problem' ? (
        <View style={styles.column}>
          <AppText variant="title">{t('play.problem')}</AppText>
          <Button label={t('play.backHome')} onPress={goHome} />
        </View>
      ) : null}
      {view.kind === 'weekDone' ? (
        <View style={styles.column}>
          <AppText variant="displayL" accessibilityRole="header">
            {view.week.week === 0 ? t('play.prologueDone') : t('play.weekDone', { n: view.week.week })}
          </AppText>
          <Button label={t('play.backHome')} onPress={goHome} />
        </View>
      ) : null}
      {view.kind === 'playing' ? (
        <View style={styles.column}>
          <GameScreen
            key={view.playing.run.runId}
            run={view.playing.run}
            module={view.playing.module}
            context={{
              locale: i18n.language === 'ur' ? 'ur' : 'en',
              rtl: I18nManager.isRTL,
              week: view.playing.week.week,
              practice: view.playing.week.practice,
              a11yMode: false,
              reducedMotion: false,
              params: view.playing.params,
            }}
            crashMessage={t('play.problem')}
          />
          <Button
            kind="text"
            label={t('play.takeBreak')}
            onPress={() => {
              view.playing.run.abandon();
              goHome();
            }}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({ column: { gap: space[4] } });

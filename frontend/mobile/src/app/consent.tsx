// S-04 Family OK slip (FR-05, FR-05a, FR-100; redesigned 14 Nov 2026 for the school consent path).
//
// The family signs a numbered paper form; the teacher records it and the slip carries a claim code such
// as AB23-CD45. Entering it here binds the consent to this student (POST /v1/consents:claim). "Later"
// is always allowed: the student can look around, but nothing they play is saved until consent exists.
// Reached right after joining, and later from the Home banner.

import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FileSignature } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Field, type FieldMessage } from '@/components/Field';
import { Header } from '@/components/Header';
import { HelpCard } from '@/components/HelpCard';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { TextInputBox, type TextInputHandle } from '@/components/TextInputBox';
import { claimSlip } from '@/join/joinApi';
import { claimCodeProblem, formatClaimCode } from '@/join/rules';
import { useAppState } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

function backOrHome() {
  if (router.canGoBack()) router.back();
  else router.replace('/home');
}

const MESSAGES = {
  format: 'consent.errors.format',
  lookalike: 'consent.errors.lookalike',
  not_accepted: 'consent.errors.notAccepted',
} as const;

export default function ConsentScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { onboardingDone, finishOnboarding, consentGranted, resetOnboarding } = useAppState();

  const [code, setCode] = useState('');
  const [shown, setShown] = useState<keyof typeof MESSAGES | null>(null);
  const [failures, setFailures] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ref = useRef<TextInputHandle>(null);

  async function leave() {
    if (onboardingDone) {
      backOrHome(); // came from the Home banner
      return;
    }
    await finishOnboarding();
    // This screen stays reachable after onboarding, so move on explicitly once the tabs are unlocked.
    setTimeout(() => router.replace('/home'), 0);
  }

  async function claim() {
    if (busy) return;
    setNotice(null);
    const problem = claimCodeProblem(code);
    if (problem) {
      setShown(problem === 'lookalike' ? 'lookalike' : 'format');
      setFailures((n) => n + 1);
      ref.current?.focus();
      return;
    }
    setBusy(true);
    const outcome = await claimSlip(code);
    setBusy(false);
    switch (outcome.kind) {
      case 'granted':
        await consentGranted();
        await leave();
        return;
      case 'format':
        setShown('format');
        return;
      case 'code_not_accepted':
        setShown('not_accepted');
        setFailures((n) => n + 1);
        ref.current?.focus();
        return;
      case 'signed_out':
        await resetOnboarding(); // the sign-in was revoked or expired: join again
        return;
      case 'school_inactive':
        setNotice(t('onboarding.join.errors.schoolInactive'));
        return;
      case 'too_many':
        setNotice(t('onboarding.join.errors.tooMany', { minutes: outcome.minutes }));
        return;
      case 'offline':
        setNotice(t('consent.errors.offline'));
        return;
      case 'failed':
        setNotice(t('onboarding.join.errors.failed'));
    }
  }

  const message: FieldMessage = shown ? { tone: 'error', text: t(MESSAGES[shown]) } : null;

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          {notice ? <Notice text={notice} /> : null}
          <Button label={busy ? t('consent.checking') : t('consent.submit')} onPress={claim} disabled={busy} />
          <Button kind="text" label={t('consent.later')} onPress={leave} disabled={busy} />
        </View>
      }
    >
      <Header
        title={t('consent.header')}
        onBack={onboardingDone ? backOrHome : undefined}
        help={t('consent.help')}
      />
      <AppText variant="displayL" accessibilityRole="header">
        {t('consent.title')}
      </AppText>
      <View style={[styles.how, { backgroundColor: colors.sunken }]}>
        <FileSignature color={colors.secondaryText} size={28} accessibilityElementsHidden importantForAccessibility="no" />
        <AppText style={styles.howText}>{t('consent.body')}</AppText>
      </View>

      <Field label={t('consent.codeLabel')} hint={t('consent.codeHint')} message={message}>
        <TextInputBox
          ref={ref}
          code
          value={code}
          onChangeText={(raw) => {
            const next = formatClaimCode(raw);
            setCode(next);
            setNotice(null);
            if (claimCodeProblem(next) === null || shown === 'not_accepted') setShown(null);
          }}
          onBlur={() => {
            const problem = code ? claimCodeProblem(code) : null;
            if (problem) setShown(problem === 'lookalike' ? 'lookalike' : 'format');
          }}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          maxLength={9}
          invalid={!!shown}
          accessibilityLabel={t('consent.codeLabel')}
          accessibilityHint={t('consent.codeHint')}
          returnKeyType="done"
          onSubmitEditing={claim}
        />
      </Field>

      {failures >= 2 ? <HelpCard title={t('consent.helpTitle')} body={t('consent.helpBody')} /> : null}

      <AppText color="muted">{t('consent.waiting')}</AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { gap: space[1] },
  how: { flexDirection: 'row', gap: space[3], padding: space[4], borderRadius: radius.lg, alignItems: 'flex-start' },
  howText: { flex: 1 },
});

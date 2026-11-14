// S-03 Join, with the field help of S-03e (FR-03, FR-04, FR-100, FR-102, FR-103).
//
// Four fields: class code, nickname, class and birth month and year. Each is checked when the student
// leaves it and again on Next (never on every keystroke), and an error clears as soon as the value is
// right. The server checks everything again (backend/api/src/rahyaab_api/routers/student_auth.py).
// An under-13 birth date goes to a neutral stop screen and nothing is sent (FR-04).
// After joining: S-04 (the family's consent slip), or Home if a slip was already claimed.

import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ChoiceRow } from '@/components/ChoiceRow';
import { Field, type FieldMessage } from '@/components/Field';
import { Header } from '@/components/Header';
import { HelpCard } from '@/components/HelpCard';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { SelectBox } from '@/components/SelectBox';
import { TextInputBox, type TextInputHandle } from '@/components/TextInputBox';
import { joinClass, type JoinField } from '@/join/joinApi';
import {
  birthYears,
  classCodeProblem,
  cleanNickname,
  formatClassCode,
  isUnderMinimumAge,
  NICKNAME_MAX,
  nicknameProblem,
} from '@/join/rules';
import { useAppState } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

type FieldName = 'code' | 'nickname' | 'grade' | 'birth';
const GRADES = [8, 9, 10, 11, 12] as const;
const HELP_AFTER_FAILURES = 2;

const CODE_MESSAGES = {
  required: 'onboarding.join.errors.codeFormat',
  format: 'onboarding.join.errors.codeFormat',
  lookalike: 'onboarding.join.errors.codeLookalike',
  not_accepted: 'onboarding.join.errors.codeNotAccepted',
} as const;
const NICKNAME_MESSAGES = {
  required: 'onboarding.join.errors.nicknameRequired',
  too_short: 'onboarding.join.errors.nicknameFormat',
  too_long: 'onboarding.join.errors.nicknameFormat',
  format: 'onboarding.join.errors.nicknameFormat',
  contains_phone: 'onboarding.join.errors.nicknamePhone',
  full_name: 'onboarding.join.errors.nicknameFullName',
} as const;
const OTHER_MESSAGES = {
  grade: 'onboarding.join.errors.gradeRequired',
  birth: 'onboarding.join.errors.birthRequired',
} as const;

type Shown = Record<FieldName, string | null>;
const NONE: Shown = { code: null, nickname: null, grade: null, birth: null };

export default function JoinScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { language, signedIn, finishOnboarding } = useAppState();

  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [grade, setGrade] = useState<number | null>(null);
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [birthMonth, setBirthMonth] = useState<number | null>(null);

  // The problem code shown under each field (set on leaving the field, on Next, or by the server).
  const [shown, setShown] = useState<Shown>(NONE);
  const [visited, setVisited] = useState({ code: false, nickname: false });
  const [codeFailures, setCodeFailures] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const codeRef = useRef<TextInputHandle>(null);
  const nicknameRef = useRef<TextInputHandle>(null);

  // ------------------------------------------------------------------------------ the rules, live
  const problems: Shown = {
    code: code ? classCodeProblem(code) : 'required',
    nickname: nickname.trim() ? nicknameProblem(cleanNickname(nickname)) : 'required',
    grade: grade === null ? 'required' : null,
    birth: birthYear === null || birthMonth === null ? 'required' : null,
  };

  function message(field: FieldName): string {
    const problem = shown[field] ?? 'required';
    if (field === 'code') return t(CODE_MESSAGES[problem as keyof typeof CODE_MESSAGES] ?? CODE_MESSAGES.format);
    if (field === 'nickname') {
      return t(NICKNAME_MESSAGES[problem as keyof typeof NICKNAME_MESSAGES] ?? NICKNAME_MESSAGES.format);
    }
    return t(OTHER_MESSAGES[field]);
  }

  function fieldMessage(field: FieldName, success = false): FieldMessage {
    if (shown[field]) return { tone: 'error', text: message(field) };
    if (success) return { tone: 'success', text: t('onboarding.join.looksRight') };
    return null;
  }

  /** On change: an error clears as soon as the value is right; a new error waits for blur or Next. */
  function changed(field: FieldName, problem: string | null) {
    setNotice(null);
    if (problem === null) setShown((s) => ({ ...s, [field]: null }));
  }

  function left(field: 'code' | 'nickname') {
    setVisited((v) => ({ ...v, [field]: true }));
    const problem = problems[field];
    if (problem === 'required') {
      // Leaving an empty field is fine until Next; an error Next already showed stays until it is fixed.
      return;
    }
    setShown((s) => ({ ...s, [field]: problem }));
    if (field === 'code' && problem) setCodeFailures((n) => n + 1);
  }

  function showFirst(next: Shown) {
    setShown(next);
    if (next.code) {
      setCodeFailures((n) => n + 1);
      codeRef.current?.focus();
    } else if (next.nickname) nicknameRef.current?.focus();
    const first = (['code', 'nickname', 'grade', 'birth'] as const).find((f) => next[f]);
    if (first) AccessibilityInfo.announceForAccessibility(t('onboarding.join.fixFields'));
  }

  // ------------------------------------------------------------------------------------ submit
  async function next() {
    if (busy) return;
    setNotice(null);
    if (Object.values(problems).some(Boolean)) {
      showFirst(problems);
      return;
    }
    if (isUnderMinimumAge(birthYear!, birthMonth!)) {
      router.replace('/age-stop'); // the form is dropped; nothing was sent
      return;
    }
    setBusy(true);
    const outcome = await joinClass({
      classCode: code,
      nickname: cleanNickname(nickname),
      grade: grade!,
      birthYear: birthYear!,
      birthMonth: birthMonth!,
      lang: language ?? 'en',
    });
    if (outcome.kind === 'joined') {
      // Navigation follows the new state (index.tsx): Home when a slip was already claimed, else S-04.
      if (outcome.session.consentState === 'granted') await finishOnboarding();
      signedIn(outcome.session);
      return;
    }
    setBusy(false);
    switch (outcome.kind) {
      case 'age_stop':
        router.replace('/age-stop');
        return;
      case 'fields':
        showFirst(fromServer(outcome.errors));
        return;
      case 'code_not_accepted':
        showFirst({ ...NONE, code: 'not_accepted' });
        return;
      case 'school_inactive':
        setNotice(t('onboarding.join.errors.schoolInactive'));
        return;
      case 'too_many':
        setNotice(t('onboarding.join.errors.tooMany', { minutes: outcome.minutes }));
        return;
      case 'offline':
        setNotice(t('onboarding.join.errors.offline'));
        return;
      case 'failed':
        setNotice(t('onboarding.join.errors.failed'));
    }
  }

  const months = t('onboarding.join.months', { returnObjects: true }) as string[];
  const monthOptions = months.map((label, i) => ({ value: i + 1, label }));
  const yearOptions = birthYears().map((y) => ({ value: y, label: String(y) }));

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          {/* Next to the button, so it is seen without scrolling. */}
          {notice ? <Notice text={notice} /> : null}
          <Button
            label={busy ? t('onboarding.join.joining') : t('onboarding.join.next')}
            onPress={next}
            disabled={busy}
          />
        </View>
      }
    >
      <Header
        title={t('onboarding.join.header')}
        onBack={() => router.back()}
        help={t('onboarding.join.help')}
      />
      <AppText variant="displayL" accessibilityRole="header">
        {t('onboarding.join.title')}
      </AppText>

      <Field label={t('onboarding.join.codeLabel')} hint={t('onboarding.join.codeHint')} message={fieldMessage('code', visited.code && !problems.code)}>
        <TextInputBox
          ref={codeRef}
          code
          value={code}
          onChangeText={(raw) => {
            const next = formatClassCode(raw);
            setCode(next);
            changed('code', classCodeProblem(next));
            if (shown.code === 'not_accepted') setShown((s) => ({ ...s, code: null }));
          }}
          onBlur={() => left('code')}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          maxLength={7}
          invalid={!!shown.code}
          accessibilityLabel={t('onboarding.join.codeLabel')}
          accessibilityHint={t('onboarding.join.codeHint')}
          returnKeyType="next"
          onSubmitEditing={() => nicknameRef.current?.focus()}
        />
      </Field>

      {codeFailures >= HELP_AFTER_FAILURES ? (
        <HelpCard title={t('onboarding.join.codeHelpTitle')} body={t('onboarding.join.codeHelpBody')} />
      ) : null}

      <Field
        label={t('onboarding.join.nicknameLabel')}
        hint={t('onboarding.join.nicknameHint')}
        message={fieldMessage('nickname', visited.nickname && !problems.nickname)}
      >
        <TextInputBox
          ref={nicknameRef}
          value={nickname}
          onChangeText={(raw) => {
            setNickname(raw);
            changed('nickname', raw.trim() ? nicknameProblem(cleanNickname(raw)) : 'required');
          }}
          onBlur={() => left('nickname')}
          autoCorrect={false}
          autoComplete="off"
          autoCapitalize="none"
          maxLength={NICKNAME_MAX + 10}
          invalid={!!shown.nickname}
          accessibilityLabel={t('onboarding.join.nicknameLabel')}
          accessibilityHint={t('onboarding.join.nicknameHint')}
        />
      </Field>

      <Field label={t('onboarding.join.gradeLabel')} message={fieldMessage('grade')} groupRole="radiogroup">
        <ChoiceRow
          options={GRADES}
          value={grade as (typeof GRADES)[number] | null}
          onChange={(g) => {
            setGrade(g);
            changed('grade', null);
          }}
          optionLabel={(g) => t('onboarding.join.gradeOption', { grade: g })}
          invalid={!!shown.grade}
        />
      </Field>

      <Field label={t('onboarding.join.birthLabel')} hint={t('onboarding.join.birthHint')} message={fieldMessage('birth')}>
        <View style={styles.pair}>
          <View style={styles.month}>
            <SelectBox
              placeholder={t('onboarding.join.monthPlaceholder')}
              accessibilityLabel={t('onboarding.join.monthLabel')}
              sheetTitle={t('onboarding.join.monthLabel')}
              closeLabel={t('common.close')}
              options={monthOptions}
              value={birthMonth}
              onChange={(m) => {
                setBirthMonth(m);
                changed('birth', birthYear === null ? 'required' : null);
              }}
              invalid={!!shown.birth && birthMonth === null}
            />
          </View>
          <View style={styles.year}>
            <SelectBox
              placeholder={t('onboarding.join.yearPlaceholder')}
              accessibilityLabel={t('onboarding.join.yearLabel')}
              sheetTitle={t('onboarding.join.yearLabel')}
              closeLabel={t('common.close')}
              options={yearOptions}
              value={birthYear}
              onChange={(y) => {
                setBirthYear(y);
                changed('birth', birthMonth === null ? 'required' : null);
              }}
              invalid={!!shown.birth && birthYear === null}
            />
          </View>
        </View>
      </Field>

      <View style={[styles.privacy, { backgroundColor: colors.sunken }]}>
        <AppText color="muted">{t('onboarding.join.privacy')}</AppText>
      </View>

    </Screen>
  );
}

/** Field errors from the server (422) mapped onto the four fields on screen. */
function fromServer(errors: { field: JoinField; code: string }[]): Shown {
  const shown: Shown = { ...NONE };
  for (const { field, code } of errors) {
    if (field === 'class_code') shown.code ??= code;
    else if (field === 'nickname') shown.nickname ??= code;
    else if (field === 'grade') shown.grade ??= code;
    else shown.birth ??= code;
  }
  return shown;
}

const styles = StyleSheet.create({
  pair: { flexDirection: 'row', gap: space[3] },
  month: { flex: 3 },
  year: { flex: 2 },
  privacy: { padding: space[4], borderRadius: radius.lg },
  footer: { gap: space[3] },
});

// S-05 "Your details" (FR-101, FR-104): the board, the current group and the student's situation, which the
// results use (a Matric group with or without Biology opens or closes doors). The class is shown but not
// changed here: it comes from the class code (the class check-in comes later). Saved with a merge patch;
// the next result uses the new details.

import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Field, type FieldMessage } from '@/components/Field';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { SelectBox, type SelectOption } from '@/components/SelectBox';
import {
  BOARDS,
  SITUATIONS,
  changedFields,
  groupKind,
  groupLabelKey,
  type Details,
  type Profile,
} from '@/profile/profile';
import { cachedProfile, loadProfile, saveDetails } from '@/profile/profileApi';
import { useAppState } from '@/state/AppState';
import { getKv } from '@/sync/runtime';
import { space } from '@/theme/tokens';

const NONE = '__none__'; // the "Not sure yet" / "None of these" option

type Loaded = { kind: 'loading' } | { kind: 'offline' } | { kind: 'problem' } | { kind: 'ready'; profile: Profile };

const goBack = () => (router.canGoBack() ? router.back() : router.replace('/you'));

/** Keys built at run time (group, board, situation ids); profile.test.ts checks every one exists. */
function useTx(): (key: string, options?: Record<string, unknown>) => string {
  const { t } = useTranslation();
  return t as unknown as (key: string, options?: Record<string, unknown>) => string;
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const tx = useTx();
  const { session } = useAppState();
  const studentId = session?.studentId ?? '';
  const [loaded, setLoaded] = useState<Loaded>({ kind: 'loading' });
  const [draft, setDraft] = useState<Details | null>(null);
  const [message, setMessage] = useState<FieldMessage>(null);
  const [groupError, setGroupError] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(() => {
    const run = async () => {
      const kv = await getKv();
      const cached = cachedProfile(kv, studentId);
      if (cached) setLoaded({ kind: 'ready', profile: cached }); // show what we have while asking the server
      const r = await loadProfile(kv, studentId);
      if (r.kind === 'ready') setLoaded(r);
      else if (!cached) setLoaded({ kind: r.kind === 'offline' ? 'offline' : 'problem' });
    };
    void run().catch(() => setLoaded({ kind: 'problem' }));
  }, [studentId]);
  useEffect(fetchProfile, [fetchProfile]);
  const retry = () => {
    setLoaded({ kind: 'loading' });
    fetchProfile();
  };

  const profile = loaded.kind === 'ready' ? loaded.profile : null;
  const saved: Details | null = profile
    ? { board: profile.board, current_group: profile.current_group, situation: profile.situation }
    : null;
  const current = draft ?? saved;

  const boardOptions: SelectOption<string>[] = useMemo(
    () => BOARDS.map((b) => ({ value: b, label: tx(`profile.boards.${b}`) })),
    [tx],
  );
  const groupOptions: SelectOption<string>[] = useMemo(
    () =>
      profile
        ? [
            ...profile.groups.map((g) => ({ value: g, label: tx(groupLabelKey(profile.grade, g)) })),
            { value: NONE, label: t('profile.notSure') },
          ]
        : [],
    [profile, t, tx],
  );
  const situationOptions: SelectOption<string>[] = useMemo(
    () => [
      ...SITUATIONS.map((s) => ({ value: s, label: tx(`profile.situations.${s}`) })),
      { value: NONE, label: t('profile.situationNone') },
    ],
    [t, tx],
  );

  function change(next: Partial<Details>) {
    if (!current) return;
    setDraft({ ...current, ...next });
    setMessage(null);
    setGroupError(false);
  }

  async function save() {
    if (!saved || !current || saving) return;
    const patch = changedFields(saved, current);
    if (Object.keys(patch).length === 0) {
      setMessage({ tone: 'success', text: t('profile.saved') });
      return;
    }
    setSaving(true);
    try {
      const r = await saveDetails(await getKv(), studentId, patch);
      if (r.kind === 'ready') {
        setLoaded(r);
        setDraft(null);
        setMessage({ tone: 'success', text: t('profile.saved') });
      } else if (r.kind === 'invalid' && r.field === 'current_group') {
        setGroupError(true);
        setMessage({ tone: 'error', text: t('profile.notForYourClass') });
      } else {
        setMessage({ tone: 'error', text: r.kind === 'offline' ? t('profile.offline') : t('profile.problem') });
      }
    } finally {
      setSaving(false);
    }
  }

  const kind = profile ? groupKind(profile.grade) : 'none';

  return (
    <Screen
      footer={
        profile ? (
          <Button label={saving ? t('profile.saving') : t('profile.save')} onPress={save} disabled={saving} />
        ) : null
      }
    >
      <Header title={t('profile.title')} onBack={goBack} help={t('profile.help')} />

      {loaded.kind === 'loading' ? <AppText color="muted">{t('profile.loading')}</AppText> : null}
      {loaded.kind === 'offline' || loaded.kind === 'problem' ? (
        <View style={styles.column}>
          <AppText>{loaded.kind === 'offline' ? t('profile.offline') : t('profile.problem')}</AppText>
          <Button kind="text" label={t('profile.retry')} onPress={retry} />
        </View>
      ) : null}

      {profile && current ? (
        <View style={styles.column}>
          <Field label={t('profile.classLabel')} hint={t('profile.classHint')}>
            <AppText variant="title">{t('profile.classValue', { n: profile.grade })}</AppText>
          </Field>

          <Field label={t('profile.boardLabel')} hint={t('profile.boardHint')}>
            <SelectBox
              placeholder={t('profile.boardPlaceholder')}
              accessibilityLabel={t('profile.boardLabel')}
              sheetTitle={t('profile.boardLabel')}
              closeLabel={t('common.close')}
              options={boardOptions}
              value={current.board}
              onChange={(board) => change({ board })}
            />
          </Field>

          {kind === 'none' ? (
            <AppText color="muted">{t('profile.noGroupYet')}</AppText>
          ) : (
            <Field
              label={kind === 'matric' ? t('profile.matricGroupLabel') : t('profile.interGroupLabel')}
              hint={kind === 'matric' ? t('profile.matricGroupHint') : t('profile.interGroupHint')}
              message={groupError ? message : null}
            >
              <SelectBox
                placeholder={t('profile.groupPlaceholder')}
                accessibilityLabel={kind === 'matric' ? t('profile.matricGroupLabel') : t('profile.interGroupLabel')}
                sheetTitle={kind === 'matric' ? t('profile.matricGroupLabel') : t('profile.interGroupLabel')}
                closeLabel={t('common.close')}
                options={groupOptions}
                value={current.current_group ?? (draft ? NONE : null)}
                onChange={(g) => change({ current_group: g === NONE ? null : g })}
                invalid={groupError}
              />
            </Field>
          )}

          <Field label={t('profile.situationLabel')} hint={t('profile.situationHint')}>
            <SelectBox
              placeholder={t('profile.situationNone')}
              accessibilityLabel={t('profile.situationLabel')}
              sheetTitle={t('profile.situationLabel')}
              closeLabel={t('common.close')}
              options={situationOptions}
              value={current.situation ?? NONE}
              onChange={(s) => change({ situation: s === NONE ? null : (s as Details['situation']) })}
            />
          </Field>

          {message && !groupError ? (
            <AppText color={message.tone === 'success' ? 'success' : 'danger'} accessibilityLiveRegion="polite">
              {message.text}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({ column: { gap: space[4] } });

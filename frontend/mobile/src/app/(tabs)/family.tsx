// S-14 Share with family (FR-66, NFR-42; RFC-0004). The student previews what the family report shows,
// makes a link to their latest stored result, and copies it or sends it through the phone's share sheet
// (WhatsApp is one choice there). The link with its token comes back only once, so it is shown only now;
// the list below shows every link without its token, how often it was opened and how long it lasts, and
// lets the student turn one off at once. Sharing needs the family's OK (403 consent_required) and a result.
// There is no "show task strengths" switch: the parent page (P-01) shows no task strengths.

import * as Clipboard from 'expo-clipboard';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Share, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { joinList } from '@/i18n/joinList';
import { STREAMS } from '@/library/data';
import { pathName } from '@/library/library';
import { describeLinks, previewOf, type LinkView, type NewLink, type ShareProblem, type ShareResult } from '@/share/share';
import { createLink, listLinks, loadLatestResult, turnOffLink } from '@/share/shareApi';
import { useAppState } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

type Load =
  | { kind: 'loading' }
  | { kind: 'problem'; problem: ShareProblem }
  | { kind: 'ready'; result: ShareResult; links: LinkView[] };

export default function FamilyScreen() {
  const { t } = useTranslation();
  const { session } = useAppState();
  const consented = session?.consentState === 'granted';
  const [load, setLoad] = useState<Load>({ kind: 'loading' });
  const [fresh, setFresh] = useState<NewLink | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<ShareProblem | null>(null);
  const [copied, setCopied] = useState(false);

  const reload = useCallback(async () => {
    if (!consented) {
      setLoad({ kind: 'problem', problem: 'consent' }); // the server would answer 403 consent_required
      return;
    }
    try {
      const [result, links] = await Promise.all([loadLatestResult(), listLinks()]);
      if (!result.ok) {
        setLoad({ kind: 'problem', problem: result.problem });
        return;
      }
      setLoad({ kind: 'ready', result: result.data, links: links.ok ? describeLinks(links.data, new Date()) : [] });
      setNotice(links.ok ? null : links.problem);
    } catch {
      setLoad({ kind: 'problem', problem: 'error' });
    }
  }, [consented]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  const retry = () => {
    setLoad({ kind: 'loading' });
    void reload();
  };

  const refreshLinks = async () => {
    const links = await listLinks();
    if (links.ok) {
      setLoad((l) => (l.kind === 'ready' ? { ...l, links: describeLinks(links.data, new Date()) } : l));
    }
  };

  const make = async (resultId: string) => {
    setBusy(true);
    setNotice(null);
    setCopied(false);
    try {
      const r = await createLink(resultId);
      if (r.ok) {
        setFresh(r.data);
        await refreshLinks();
      } else if (r.problem === 'consent') {
        setLoad({ kind: 'problem', problem: 'consent' });
      } else {
        setNotice(r.problem);
      }
    } catch {
      setNotice('error');
    } finally {
      setBusy(false);
    }
  };

  const copy = async (url: string) => {
    try {
      // Marked sensitive: Android 13+ then shows no preview of the link, which works like a password.
      await Clipboard.setStringAsync(url, { android: { isSensitive: true } });
      setCopied(true);
    } catch {
      setNotice('error');
    }
  };

  const send = (url: string) => {
    Share.share({ message: t('family.shareMessage', { url }) }).catch(() => setNotice('error'));
  };

  const turnOff = (link: LinkView) => {
    Alert.alert(t('family.confirmTitle'), t('family.confirmBody'), [
      { text: t('family.confirmKeep'), style: 'cancel' },
      {
        text: t('family.turnOff'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              const r = await turnOffLink(link.id);
              // 404: the link is already gone, so the list just catches up
              if (!r.ok && r.problem !== 'no_result') setNotice(r.problem);
              if (r.ok || r.problem === 'no_result') {
                if (fresh?.id === link.id) setFresh(null);
                await refreshLinks();
              }
            } catch {
              setNotice('error');
            }
          })();
        },
      },
    ]);
  };

  return (
    <Screen edges={['top']}>
      <Header title={t('family.title')} help={t('family.help')} />
      {load.kind === 'loading' ? <AppText color="muted">{t('family.loading')}</AppText> : null}
      {load.kind === 'problem' ? <ProblemView problem={load.problem} onRetry={retry} /> : null}
      {load.kind === 'ready' ? (
        <>
          <AppText color="muted">{t('family.lead')}</AppText>
          <Preview result={load.result} />
          {notice ? <Notice text={t(`family.problem.${notice}`)} /> : null}
          <Button
            label={busy ? t('family.making') : t('family.make')}
            accessibilityHint={t('family.makeHint')}
            disabled={busy}
            onPress={() => void make(load.result.id)}
          />
          {fresh ? (
            <FreshLink link={fresh} copied={copied} onCopy={() => void copy(fresh.url)} onSend={() => send(fresh.url)} />
          ) : null}
          <Links links={load.links} onTurnOff={turnOff} />
        </>
      ) : null}
    </Screen>
  );
}

function ProblemView({ problem, onRetry }: { problem: ShareProblem; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.column}>
      <AppText variant="title" accessibilityRole="header">
        {t(`family.problem.${problem}`)}
      </AppText>
      {problem === 'consent' ? <Button label={t('family.consentAction')} onPress={() => router.push('/consent')} /> : null}
      {problem === 'no_result' ? <Button label={t('family.playAction')} onPress={() => router.navigate('/home')} /> : null}
      {problem === 'offline' || problem === 'error' || problem === 'rate_limited' ? (
        <Button label={t('family.retry')} onPress={onRetry} />
      ) : null}
    </View>
  );
}

/** A path's name as the parent page shows it (streams.json), so both say the same (TC-SHARE-13). */
function useName() {
  const { t } = useTranslation();
  const tx = t as unknown as (key: string, options?: Record<string, unknown>) => string;
  return (id: string) => pathName(STREAMS, id) ?? tx(`stream.${id}`, { defaultValue: id });
}

function Preview({ result }: { result: ShareResult }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const name = useName();
  const preview = previewOf(result);
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AppText variant="title" accessibilityRole="header">
        {t('family.previewTitle')}
      </AppText>
      <AppText variant="label" color="muted">
        {t('family.previewPaths')}
      </AppText>
      {preview.paths.map((p) => (
        <AppText key={p.id}>{`• ${t('family.previewPath', { name: name(p.id), band: t(`results.band.${p.band}`) })}`}</AppText>
      ))}
      {preview.planB.length ? (
        <AppText color="secondaryText">
          {t('family.previewPlanB', { list: joinList(preview.planB.map(name), t('results.and')) })}
        </AppText>
      ) : null}
      <AppText variant="caption" color="muted">
        {t('family.previewMore')}
      </AppText>
      <AppText variant="caption" color="muted">
        {t('family.expires')}
      </AppText>
    </View>
  );
}

function FreshLink({
  link,
  copied,
  onCopy,
  onSend,
}: {
  link: NewLink;
  copied: boolean;
  onCopy: () => void;
  onSend: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 2 }]}>
      <AppText variant="title" accessibilityRole="header">
        {t('family.newTitle')}
      </AppText>
      <AppText color="muted">{t('family.newBody')}</AppText>
      <View style={[styles.url, { backgroundColor: colors.sunken }]}>
        <AppText selectable>{link.url}</AppText>
      </View>
      <Button label={t('family.send')} accessibilityHint={t('family.sendHint')} onPress={onSend} />
      <Button kind="text" label={t('family.copy')} accessibilityHint={t('family.copyHint')} onPress={onCopy} />
      {copied ? (
        <AppText color="secondaryText" align="center" accessibilityLiveRegion="polite">
          {t('family.copied')}
        </AppText>
      ) : null}
    </View>
  );
}

function Links({ links, onTurnOff }: { links: LinkView[]; onTurnOff: (link: LinkView) => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={styles.column}>
      <AppText variant="heading" accessibilityRole="header">
        {t('family.linksTitle')}
      </AppText>
      {links.length === 0 ? <AppText color="muted">{t('family.noLinks')}</AppText> : null}
      {links.map((link, i) => {
        const n = String(i + 1);
        const state =
          link.status === 'active'
            ? t('family.link.active', { days: String(link.daysLeft ?? 0) })
            : t(`family.link.${link.status}`);
        return (
          <View key={link.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppText variant="label">{t('family.link.label', { n })}</AppText>
            <AppText color={link.status === 'active' ? 'text' : 'muted'}>{state}</AppText>
            <AppText color="muted">{t('family.link.views', { times: String(link.views) })}</AppText>
            {link.canTurnOff ? (
              <Button
                kind="text"
                label={t('family.turnOff')}
                accessibilityLabel={t('family.turnOffLabel', { n })}
                accessibilityHint={t('family.turnOffHint')}
                onPress={() => onTurnOff(link)}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: space[2] },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: space[4], gap: space[2] },
  url: { borderRadius: radius.md, padding: space[3] },
});

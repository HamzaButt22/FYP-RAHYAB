// S-10b Your paths (FR-46, FR-51, FR-53, FR-56): the top-3 cards with a fit band (dots and words, never
// colour alone), 2-3 reasons, where each path can lead (doors from the rules engine), a Plan B and
// "Why this?". Before enough play it says "one more week?" (FR-51) instead of guessing. No numeric scores.

import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { ListenButton } from '@/components/ListenButton';
import { joinList } from '@/i18n/joinList';
import { Screen } from '@/components/Screen';
import {
  bandDots,
  doorPhrases,
  reasonPhrase,
  type Evidence,
  whyFor,
  type PathCard,
  type Phrase,
  type ResultState,
} from '@/results/format';
import { computeResult, fetchEvidence } from '@/results/resultsApi';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** Translation by a key built at run time (server codes, stream ids). format.test.ts checks every such key
 * exists in en.json, which the typed `t` cannot do for keys it does not know in advance. */
function useTx(): Translate {
  const { t } = useTranslation();
  return t as unknown as Translate;
}

function useSay() {
  const tx = useTx();
  return useCallback(
    (p: Phrase) => {
      const lists: Record<string, string> = {};
      for (const [name, keys] of Object.entries(p.lists ?? {})) lists[name] = joinList(keys.map((k) => tx(k)), tx('results.and'));
      return tx(p.key, { ...p.params, ...lists });
    },
    [tx]
  );
}

export default function ResultsScreen() {
  const { t } = useTranslation();
  const [state, setState] = useState<ResultState | null>(null);

  const fetchResult = useCallback(() => {
    void computeResult().then(setState, () => setState({ kind: 'error' }));
  }, []);
  useEffect(fetchResult, [fetchResult]);
  const retry = () => {
    setState(null);
    fetchResult();
  };

  return (
    <Screen>
      <Header title={t('results.title')} onBack={() => (router.canGoBack() ? router.back() : router.replace('/home'))} />
      {state === null ? <AppText color="muted">{t('results.loading')}</AppText> : null}
      {state && state.kind !== 'ready' ? (
        <View style={styles.column}>
          <AppText variant="title" accessibilityRole="header">
            {t(`results.state.${state.kind}`)}
          </AppText>
          {state.kind === 'more_play' ? <AppText color="muted">{t('results.state.more_play_body')}</AppText> : null}
          {state.kind === 'offline' || state.kind === 'error' ? (
            <Button label={t('results.retry')} onPress={retry} />
          ) : null}
        </View>
      ) : null}
      {state?.kind === 'ready' ? (
        <View style={styles.column}>
          {state.result.provisional ? <AppText color="secondaryText">{t('results.provisional')}</AppText> : null}
          <AppText color="muted">
            {t('results.confidenceLabel', { level: t(`results.confidence.${state.result.confidence}`) })}
          </AppText>
          {state.result.ranked.map((card, i) => (
            <Card key={card.stream_id} card={card} rank={i + 1} resultId={state.result.id} />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

function Card({ card, rank, resultId }: { card: PathCard; rank: number; resultId: string }) {
  const { t } = useTranslation();
  const tx = useTx();
  const say = useSay();
  const { colors } = useTheme();
  const [why, setWhy] = useState<Evidence | null | 'open'>(null);
  const dots = bandDots(card.fit_band);
  // Read aloud (FR-96): the path, its fit, the reasons and the doors, as sentences.
  const spoken = [
    `${rank}. ${tx(`stream.${card.stream_id}`, { defaultValue: card.stream_id })}.`,
    `${t(`results.band.${card.fit_band}`)}.`,
    ...card.reasons.map((r) => reasonPhrase(r)).flatMap((p) => (p ? [`${say(p)}.`] : [])),
    ...card.doors.map((d) => `${tx(d.label_key, { defaultValue: d.to })}: ${say(doorPhrases(d)[0])}.`),
    ...card.plan_b.map((id) => `${t('results.planB', { name: tx(`stream.${id}`, { defaultValue: id }) })}.`),
  ].join(' ');

  const toggleWhy = () => {
    if (why) {
      setWhy(null);
      return;
    }
    setWhy('open');
    void fetchEvidence(resultId).then((e) => setWhy((w) => (w ? (e ?? 'open') : w)));
  };

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      accessibilityLabel={`${rank}. ${tx(`stream.${card.stream_id}`)}, ${t(`results.band.${card.fit_band}`)}`}
    >
      <View style={styles.titleRow}>
        <AppText variant="heading" accessibilityRole="header" style={styles.grow}>
          {tx(`stream.${card.stream_id}`, { defaultValue: card.stream_id })}
        </AppText>
        <ListenButton id={`card:${card.stream_id}`} text={spoken} />
      </View>
      <View style={styles.band} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {[1, 2, 3].map((n) => (
          <View
            key={n}
            style={[styles.dot, { backgroundColor: n <= dots ? colors.primary : colors.sunken, borderColor: colors.primary }]}
          />
        ))}
        <AppText variant="label" color="primaryText">
          {t(`results.band.${card.fit_band}`)}
        </AppText>
      </View>

      {card.reasons.map((r, i) => {
        const phrase = reasonPhrase(r);
        return phrase ? <AppText key={i}>{`• ${say(phrase)}`}</AppText> : null;
      })}

      {card.doors.length > 0 ? (
        <View style={styles.column}>
          <AppText variant="label" color="muted">
            {t('results.doorsTitle')}
          </AppText>
          {card.doors.map((d) => {
            const [state, ...more] = doorPhrases(d);
            return (
              <View key={d.to}>
                <AppText>{`${tx(d.label_key, { defaultValue: d.to })}: ${say(state)}`}</AppText>
                {more.map((p) => (
                  <AppText key={p.key} variant="caption" color="muted">
                    {say(p)}
                  </AppText>
                ))}
              </View>
            );
          })}
        </View>
      ) : null}

      {card.plan_b.map((id) => (
        <AppText key={id} color="secondaryText">
          {t('results.planB', { name: tx(`stream.${id}`, { defaultValue: id }) })}
        </AppText>
      ))}

      <Pressable accessibilityRole="button" onPress={toggleWhy} style={styles.whyButton}>
        <AppText variant="label" color="primaryText">
          {why ? t('results.hideWhy') : t('results.why')}
        </AppText>
      </Pressable>
      {why && why !== 'open' ? <WhyPanel evidence={why} streamId={card.stream_id} /> : null}
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push({ pathname: '/stream/[id]', params: { id: card.stream_id } })}
        style={styles.whyButton}
      >
        <AppText variant="label" color="primaryText">
          {t('results.aboutPath')}
        </AppText>
      </Pressable>
    </View>
  );
}

/** "Why this?" (FR-56): two plain sentences: how often the student picked their top interests, and what the
 * path suits. */
function WhyPanel({ evidence, streamId }: { evidence: Evidence; streamId: string }) {
  const { t } = useTranslation();
  const tx = useTx();
  const { colors } = useTheme();
  const why = whyFor(evidence, streamId);
  const typeName = (type: string) => tx(`results.type.${type}`);
  const and = tx('results.and');
  const picked = why.counts
    ? t('results.whyChoices', {
        list: joinList(
          why.counts.map((c) =>
            tx('results.whyCount', { type: typeName(c.type), chosen: String(c.chosen), offered: String(c.offered) }),
          ),
          and,
        ),
      })
    : t('results.whyTop', { list: joinList(why.top.map(typeName), and) });

  return (
    <View style={[styles.why, { backgroundColor: colors.sunken }]}>
      <AppText>{picked}</AppText>
      {why.pathTypes.length ? (
        <AppText>{t('results.whyPath', { list: joinList(why.pathTypes.map(typeName), and) })}</AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: space[2] },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3] },
  grow: { flex: 1 },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: space[4], gap: space[2] },
  band: { flexDirection: 'row', alignItems: 'center', gap: space[1] },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5 },
  whyButton: { minHeight: 48, justifyContent: 'center' },
  why: { borderRadius: radius.md, padding: space[3], gap: space[1] },
});

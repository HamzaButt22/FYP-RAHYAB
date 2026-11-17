// S-13 Stream detail (FR-60, FR-65): who a path suits, what it needs first, entry tests, where it can lead
// (with doors and their state), examples, length and notes when the data has them, and similar paths to
// compare. Only facts in streams.json are shown; what is not there yet is named as "being checked".

import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Header } from '@/components/Header';
import { ListenButton } from '@/components/ListenButton';
import { Screen } from '@/components/Screen';
import { joinList } from '@/i18n/joinList';
import { STREAMS } from '@/library/data';
import { doorsFor, findPath, missingFacts, nextSteps, similarPaths, topTypes } from '@/library/library';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

function useTx(): (key: string, options?: Record<string, unknown>) => string {
  const { t } = useTranslation();
  return t as unknown as (key: string, options?: Record<string, unknown>) => string;
}

const goBack = () => (router.canGoBack() ? router.back() : router.replace('/explore'));

export default function StreamScreen() {
  const tx = useTx();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const found = findPath(STREAMS, String(id ?? ''));

  if (!found) {
    return (
      <Screen>
        <Header title={tx('library.title')} onBack={goBack} />
        <AppText>{tx('library.notFound')}</AppText>
      </Screen>
    );
  }

  const { path } = found;
  const and = tx('results.and');
  const suits = tx('library.suits', { list: joinList(topTypes(path).map((t) => tx(`results.type.${t}`)), and) });
  const steps = nextSteps(STREAMS, path);
  const doors = doorsFor(STREAMS, path.id);
  const similar = similarPaths(STREAMS, path.id);
  const missing = missingFacts(path);
  const spoken = [
    path.name,
    suits,
    path.requires?.length ? `${tx('library.needsTitle')}: ${path.requires.join(', ')}.` : '',
    path.tests?.length ? `${tx('library.testsTitle')}: ${path.tests.join(', ')}.` : '',
    path.notes ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const card = { backgroundColor: colors.surface, borderColor: colors.border };
  return (
    <Screen>
      <Header title={tx('library.title')} onBack={goBack} help={tx('library.help')} />

      <View style={styles.row}>
        <AppText variant="displayL" accessibilityRole="header" style={styles.grow}>
          {path.name}
        </AppText>
        <ListenButton id={`stream:${path.id}`} text={spoken} />
      </View>

      <Section title={tx('library.whoTitle')}>
        <AppText>{suits}</AppText>
      </Section>

      {path.requires?.length ? (
        <Section title={tx('library.needsTitle')}>
          <AppText>{path.requires.join(', ')}</AppText>
        </Section>
      ) : null}

      {path.tests?.length ? (
        <Section title={tx('library.testsTitle')}>
          <AppText>{path.tests.join(', ')}</AppText>
        </Section>
      ) : null}

      {steps.length || doors.length || path.gate_note ? (
        <Section title={tx('library.leadsTitle')}>
          {steps.map((s) =>
            s.kind === 'path' ? (
              <Pressable key={s.id} accessibilityRole="link" onPress={() => router.push({ pathname: '/stream/[id]', params: { id: s.id } })}>
                <AppText color="primaryText">{`• ${s.name}`}</AppText>
              </Pressable>
            ) : (
              <AppText key={s.key}>{`• ${tx(s.key)}`}</AppText>
            ),
          )}
          {doors.map((d) => (
            <View key={d.to}>
              <AppText>{`${tx(d.labelKey)}: ${tx(`results.doorState.${d.state}`)}`}</AppText>
              {d.checkWithSchool ? (
                <AppText variant="caption" color="muted">
                  {tx('results.checkWithBoard')}
                </AppText>
              ) : null}
            </View>
          ))}
          {path.gate_note ? <AppText color="muted">{path.gate_note}</AppText> : null}
        </Section>
      ) : null}

      {path.examples?.length ? (
        <Section title={tx('library.examplesTitle')}>
          <AppText>{path.examples.join(', ')}</AppText>
        </Section>
      ) : null}

      {path.subjects_by_board && Object.keys(path.subjects_by_board).length ? (
        <Section title={tx('library.subjectsTitle')}>
          {Object.entries(path.subjects_by_board).map(([board, entry]) => (
            <AppText key={board}>{`${tx(`profile.boards.${board}`, { defaultValue: board })}: ${entry.subjects.join(', ')}`}</AppText>
          ))}
        </Section>
      ) : null}

      {path.cost_estimate ? (
        <Section title={tx('library.costTitle')}>
          <AppText>
            {tx(path.cost_estimate.per === 'year' ? 'library.costPerYear' : 'library.costTotal', {
              min: path.cost_estimate.min_pkr.toLocaleString('en-PK'),
              max: path.cost_estimate.max_pkr.toLocaleString('en-PK'),
            })}
          </AppText>
          <AppText variant="caption" color="muted">
            {tx('library.costNote', { date: path.cost_estimate.last_verified })}
          </AppText>
        </Section>
      ) : null}

      {path.duration ? (
        <Section title={tx('library.durationTitle')}>
          <AppText>{path.duration}</AppText>
        </Section>
      ) : null}

      {path.availability || path.notes ? (
        <Section title={tx('library.notesTitle')}>
          {path.availability ? <AppText>{path.availability}</AppText> : null}
          {path.notes ? <AppText>{path.notes}</AppText> : null}
        </Section>
      ) : null}

      {path.verify ? (
        <View style={[styles.note, { backgroundColor: colors.sunken }]}>
          <AppText>{tx('library.verify')}</AppText>
        </View>
      ) : null}
      {missing.length ? (
        <AppText variant="caption" color="muted">
          {tx('library.missing', { list: joinList(missing.map((f) => tx(`library.facts.${f}`)), and) })}
        </AppText>
      ) : null}

      {similar.length ? (
        <Section title={tx('library.similarTitle')}>
          {similar.map((p) => (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/stream/[id]', params: { id: p.id } })}
              style={({ pressed }) => [styles.similar, card, pressed && { backgroundColor: colors.sunken }]}
            >
              <AppText variant="title">{p.name}</AppText>
            </Pressable>
          ))}
        </Section>
      ) : null}

      <AppText variant="caption" color="muted">
        {tx('library.source')}
      </AppText>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="label" color="secondaryText" accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3] },
  grow: { flex: 1 },
  section: { gap: space[1] },
  note: { borderRadius: radius.md, padding: space[3] },
  similar: { borderWidth: 1, borderRadius: radius.lg, padding: space[3] },
});

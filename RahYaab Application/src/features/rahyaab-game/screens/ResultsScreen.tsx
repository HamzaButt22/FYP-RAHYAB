/**
 * Result screens (desktop draw_results / draw_riasec / draw_analytics). All numbers come from the backend report;
 * nothing is computed or estimated on the phone.
 */
import React, { useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { AssessmentReport, RIASEC_CODES, TRAITS, Trait } from '../types/api';
import { Backdrop, Bar, Body, Btn, Card, H1, H2, Muted } from '../components/primitives';
import { colors, labelColors, riasecColors, space, traitColors } from '../components/theme';
import { fmtFixed } from '../game-engine/pymath';
import { LEVEL_TITLES } from '../levels';

const TRAIT_LABELS: Record<Trait, string> = {
  openness: 'Openness',
  conscientiousness: 'Conscientiousness',
  extraversion: 'Extraversion',
  agreeableness: 'Agreeableness',
  neuroticism: 'Neuroticism',
};
export const RIASEC_NAMES: Record<string, string> = { R: 'Realistic', I: 'Investigative', A: 'Artistic', S: 'Social', E: 'Enterprising', C: 'Conventional' };

type Tab = 'bigfive' | 'riasec' | 'analytics';

export function ResultsScreen({ report, playerName, onDone }: { report: AssessmentReport; playerName: string; onDone: () => void }) {
  const tabs: { key: Tab; label: string }[] = [];
  if (report.has_bigfive) tabs.push({ key: 'bigfive', label: 'Big Five' });
  if (report.riasec) tabs.push({ key: 'riasec', label: 'Career interests' });
  tabs.push({ key: 'analytics', label: 'Analytics' });
  const [tab, setTab] = useState<Tab>(tabs[0].key);

  const share = () => {
    const payload = {
      session_id: report.session_id,
      player: playerName,
      disclaimer: report.result.disclaimer,
      is_validated: report.result.is_validated,
      result: report.has_bigfive ? report.result : null,
      riasec: report.riasec,
      telemetry_summary: report.summary,
      levels: report.levels,
      level_status: report.level_status,
    };
    Share.share({ title: 'RahYaab report', message: JSON.stringify(payload, null, 2) }).catch(() => undefined);
  };

  return (
    <View style={styles.fill}>
      <Backdrop tint="rgb(20,28,56)" />
      <View style={styles.tabs} accessibilityRole="tablist">
        {tabs.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t.key }}
            style={[styles.tab, tab === t.key && styles.tabOn]}
          >
            <Text style={[styles.tabText, tab === t.key && { color: colors.text }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.page}>
        {tab === 'bigfive' ? <BigFive report={report} playerName={playerName} /> : null}
        {tab === 'riasec' && report.riasec ? <Riasec report={report} /> : null}
        {tab === 'analytics' ? <Analytics report={report} /> : null}
        <View style={styles.actions}>
          <Btn label="Share report (JSON)" onPress={share} style={{ flex: 1, marginRight: space(2) }} />
          <Btn label="Done" variant="primary" onPress={onDone} style={{ flex: 1 }} testID="results-done" />
        </View>
      </ScrollView>
    </View>
  );
}

function BigFive({ report, playerName }: { report: AssessmentReport; playerName: string }) {
  const res = report.result;
  const [sel, setSel] = useState<Trait>('openness');
  const used = (report.contributions?.bigfive_levels ?? []).join(', ') || '-';
  const ev = res.evidence[sel];
  return (
    <View>
      <H1>BIG FIVE INDICATORS</H1>
      <Muted>{`${playerName}  -  from levels ${used} (prototype, exploratory)`}</Muted>
      <View style={{ height: space(3) }} />
      {TRAITS.map((t) => {
        const on = t === sel;
        const score = res.scores[t];
        const blocks = 20;
        const filled = Math.round((score / 100) * blocks);
        return (
          <Pressable
            key={t}
            onPress={() => setSel(t)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${TRAIT_LABELS[t]} ${fmtFixed(score, 0)} out of 100, ${res.labels[t]}`}
            accessibilityHint="Shows the behavioral evidence for this trait"
            style={[styles.traitRow, on && { backgroundColor: colors.panelLight, borderColor: traitColors[t] }]}
          >
            <View style={styles.traitHead}>
              <Text style={[styles.traitName, on && { fontWeight: '800' }]}>{TRAIT_LABELS[t]}</Text>
              <Text style={[styles.traitScore, { color: traitColors[t] }]}>{fmtFixed(score, 0)}</Text>
              <Text style={[styles.traitLabel, { color: labelColors[res.labels[t]] }]}>{res.labels[t]}</Text>
            </View>
            <View style={styles.blocks}>
              {Array.from({ length: blocks }, (_, b) => (
                <View key={b} style={[styles.block, { backgroundColor: b < filled ? traitColors[t] : 'rgb(36,42,62)' }]} />
              ))}
            </View>
          </Pressable>
        );
      })}
      <Card accent={traitColors[sel]} style={{ marginTop: space(3) }}>
        <H2 style={{ color: traitColors[sel] }}>{`${ev.trait}: ${ev.label}`}</H2>
        <Body style={{ marginTop: space(2) }}>{ev.headline}</Body>
        <Text style={styles.subhead}>Observed behavioral indicators:</Text>
        {(ev.indicators.length ? ev.indicators : ['(no relevant behavior was recorded)']).map((line, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={[styles.dot, { backgroundColor: traitColors[sel] }]} />
            <Body style={{ flex: 1 }}>{line}</Body>
          </View>
        ))}
        <Muted style={{ marginTop: space(2) }}>{`Evidence coverage ${Math.round(ev.coverage * 100)}%  |  confidence: ${ev.confidence}`}</Muted>
        <Text style={styles.caveat}>{ev.caveat}</Text>
      </Card>
      <Text style={[styles.warn, { marginTop: space(3) }]}>PROTOTYPE SCORING: weights are design assumptions, not a validated psychometric model.</Text>
      <Muted>Scores summarise behavior in this one session; they are not a diagnosis.</Muted>
    </View>
  );
}

function Riasec({ report }: { report: AssessmentReport }) {
  const r = report.riasec!;
  const order = [...RIASEC_CODES].sort((a, b) => r.scores[b] - r.scores[a]);
  return (
    <View>
      <H1>CAREER INTEREST PROFILE (RIASEC)</H1>
      <Muted>{`Exploratory estimate from levels ${r.levels_used.join(', ') || 'none'}. It shows what you chose and stayed with, not what you are good at.`}</Muted>
      <View style={{ height: space(3) }} />
      {order.map((code) => (
        <View key={code} style={styles.riRow} accessible accessibilityLabel={`${RIASEC_NAMES[code]} ${fmtFixed(r.scores[code], 0)}`}>
          <Text style={[styles.riName, r.holland_code.includes(code) && { fontWeight: '800' }]}>{RIASEC_NAMES[code]}</Text>
          <Text style={[styles.riScore, { color: riasecColors[code] }]}>{fmtFixed(r.scores[code], 0)}</Text>
          <View style={{ flex: 1 }}>
            <Bar frac={r.scores[code] / 100} color={riasecColors[code]} height={16} />
          </View>
        </View>
      ))}
      {r.flat_profile ? (
        <Text style={[styles.warn, { marginTop: space(2) }]}>Flat profile: no category stands out.</Text>
      ) : r.holland_code ? (
        <Text style={[styles.good, { marginTop: space(2) }]}>{`Top interests (Holland code): ${r.holland_code}`}</Text>
      ) : null}
      <Card accent={colors.accent} style={{ marginTop: space(3) }}>
        <H2 style={{ color: colors.accent }}>How this was built</H2>
        {[
          'Choice: which activities you picked on your own.',
          'Engagement: optional extras, revisits, staying with a task.',
          'Finishing a task or doing it well is reported separately and does not raise the score.',
          'Speed is never used as interest.',
        ].map((l) => (
          <Body key={l} style={{ marginTop: space(1) }}>
            {l}
          </Body>
        ))}
        {Object.entries(r.level_status)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([lid, st]) => (
            <Muted key={lid} style={{ marginTop: space(1) }}>{`Level ${lid}: ${st.replace(/_/g, ' ')}`}</Muted>
          ))}
        <Muted style={{ marginTop: space(1) }}>{`Levels agree: ${r.agreement_label}`}</Muted>
      </Card>
      <Text style={[styles.warn, { marginTop: space(3) }]}>
        PROTOTYPE: mapping and weights are design assumptions, not a validated interest inventory or career advice.
      </Text>
    </View>
  );
}

const pct = (v: number | null | undefined) => (v === null || v === undefined ? 'n/a' : `${Math.round(v * 100)}%`);

function Analytics({ report }: { report: AssessmentReport }) {
  const sm = report.summary;
  const total = Math.trunc(sm.total_play_time_s);
  const tiles: [string, string][] = [
    ['Total play time', `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`],
    ['Levels completed', `${sm.levels_completed} / ${sm.levels_planned ?? 4}`],
    ['Decisions made', String(sm.decisions_made)],
    ['Avg decision time', sm.average_decision_time_s === null ? 'n/a' : `${fmtFixed(sm.average_decision_time_s, 1)}s`],
    ['Exploration rate', pct(sm.exploration_rate)],
    ['Risk-taking rate', pct(sm.risk_taking_rate)],
    ['Helping rate', pct(sm.helping_rate)],
    ['Retry rate', pct(sm.retry_rate)],
    ['Strategy changes', String(sm.strategy_changes)],
    ['Errors', String(sm.errors)],
  ];
  const counts = Object.entries(report.event_counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const max = Math.max(1, ...counts.map(([, v]) => v));
  return (
    <View>
      <H1>TELEMETRY ANALYTICS</H1>
      <Muted>{`Session ${report.session_id}  -  ${sm.total_events} events stored on the server`}</Muted>
      <View style={styles.tiles}>
        {tiles.map(([label, value]) => (
          <View key={label} style={styles.tile} accessible accessibilityLabel={`${label}: ${value}`}>
            <Text style={styles.tileValue}>{value}</Text>
            <Text style={styles.tileLabel}>{label}</Text>
          </View>
        ))}
      </View>
      <H2 style={{ marginTop: space(4) }}>Time per level attempt</H2>
      {report.levels.slice(0, 8).map((lv, i) => (
        <View key={i} style={styles.lvRow}>
          <Text style={styles.lvName}>{`Level ${lv.level_id}`}</Text>
          <Text style={styles.lvDim} numberOfLines={1}>
            {LEVEL_TITLES[lv.level_id]}
          </Text>
          <Text style={styles.lvDim}>{`${fmtFixed(lv.duration_s, 0)}s`}</Text>
          <Text style={{ color: lv.outcome === 'complete' ? colors.accent2 : colors.danger, width: 84, textAlign: 'right' }}>
            {{ complete: 'completed', failed: 'failed', unfinished: 'unfinished' }[lv.outcome]}
          </Text>
        </View>
      ))}
      <H2 style={{ marginTop: space(4) }}>Most frequent events</H2>
      {counts.map(([k, v]) => (
        <View key={k} style={styles.evRow}>
          <Text style={styles.evName} numberOfLines={1}>
            {k}
          </Text>
          <View style={{ flex: 1, marginHorizontal: space(2) }}>
            <Bar frac={v / max} color={colors.accent} height={12} />
          </View>
          <Text style={styles.evCount}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  page: { padding: space(4), paddingBottom: space(10), maxWidth: 900, width: '100%', alignSelf: 'center' },
  tabs: { flexDirection: 'row', paddingTop: space(10), paddingHorizontal: space(3), justifyContent: 'center' },
  tab: { paddingVertical: space(2.5), paddingHorizontal: space(4), borderBottomWidth: 3, borderBottomColor: 'transparent', minHeight: 44, justifyContent: 'center' },
  tabOn: { borderBottomColor: colors.accent },
  tabText: { color: colors.textDim, fontWeight: '700', fontSize: 15 },
  traitRow: { borderRadius: 12, borderWidth: 2, borderColor: 'transparent', padding: space(2.5), marginVertical: 3 },
  traitHead: { flexDirection: 'row', alignItems: 'baseline' },
  traitName: { color: colors.text, fontSize: 17, flex: 1 },
  traitScore: { fontSize: 24, fontWeight: '800', width: 56, textAlign: 'right' },
  traitLabel: { fontSize: 14, fontWeight: '800', width: 86, textAlign: 'right' },
  blocks: { flexDirection: 'row', marginTop: space(1.5) },
  block: { flex: 1, height: 14, marginRight: 3, borderRadius: 3 },
  subhead: { color: colors.textDim, fontWeight: '700', marginTop: space(3), marginBottom: space(1) },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 3 },
  dot: { width: 7, height: 7, borderRadius: 4, marginTop: 7, marginRight: space(2.5) },
  caveat: { color: 'rgb(180,170,130)', fontSize: 13, marginTop: space(1) },
  warn: { color: colors.warn, fontSize: 13 },
  good: { color: colors.accent2, fontSize: 16, fontWeight: '800' },
  riRow: { flexDirection: 'row', alignItems: 'center', marginVertical: space(1.5) },
  riName: { color: colors.text, fontSize: 16, width: 120 },
  riScore: { fontSize: 18, fontWeight: '800', width: 44, textAlign: 'right', marginRight: space(3) },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', marginTop: space(3), justifyContent: 'space-between' },
  tile: { width: '48%', backgroundColor: colors.panel, borderRadius: 14, padding: space(3), marginVertical: space(1), alignItems: 'center' },
  tileValue: { color: colors.accent, fontSize: 24, fontWeight: '800' },
  tileLabel: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  lvRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: space(1.5), borderBottomWidth: 1, borderBottomColor: colors.panel },
  lvName: { color: colors.text, width: 64, fontWeight: '700' },
  lvDim: { color: colors.textDim, marginRight: space(2), flexShrink: 1, flex: 1 },
  evRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  evName: { color: colors.textDim, width: 150, fontSize: 12 },
  evCount: { color: colors.text, width: 40, textAlign: 'right' },
  actions: { flexDirection: 'row', marginTop: space(6) },
});

export { TRAIT_LABELS };

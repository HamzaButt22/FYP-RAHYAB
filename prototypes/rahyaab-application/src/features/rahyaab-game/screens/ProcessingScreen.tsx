/**
 * "Assessment complete": upload the remaining telemetry and ask the server for the results.
 * Shows real progress; offline is a normal, recoverable state (everything stays on the phone).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { AssessmentReport } from '../types/api';
import { AssessmentSession, FinishResult } from '../services/assessmentSession';
import { Backdrop, Bar, Btn, Card, H1, Muted } from '../components/primitives';
import { colors, space } from '../components/theme';

const RETRY_DELAYS = [3000, 6000, 12000, 24000, 45000, 60000];

export function ProcessingScreen({
  session,
  onReport,
  onLater,
}: {
  session: AssessmentSession;
  onReport: (r: AssessmentReport) => void;
  onLater: () => void;
}) {
  const [state, setState] = useState<'working' | 'pending' | 'failed'>('working');
  const [detail, setDetail] = useState('');
  const [progress, setProgress] = useState(0);
  const attempt = useRef(0);
  const cbs = useRef({ onReport });
  cbs.current = { onReport };
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);
  const total = session.events.length;

  const run = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    setState('working');
    const poll = setInterval(() => setProgress(total ? (total - session.pendingUploads()) / total : 1), 250);
    let res: FinishResult;
    try {
      res = await session.finish();
    } catch (e) {
      res = { kind: 'failed', error: (e as Error).message };
    } finally {
      clearInterval(poll);
    }
    if (!alive.current) return;
    setProgress(total ? (total - session.pendingUploads()) / total : 1);
    if (res.kind === 'completed') {
      cbs.current.onReport(res.report);
      return;
    }
    setDetail(res.kind === 'pending' ? res.reason : res.error);
    setState(res.kind === 'pending' ? 'pending' : 'failed');
    if (res.kind === 'pending') {
      const delay = RETRY_DELAYS[Math.min(attempt.current, RETRY_DELAYS.length - 1)];
      attempt.current += 1;
      timer.current = setTimeout(() => {
        if (alive.current) run();
      }, delay);
    }
  }, [session, total]);

  useEffect(() => {
    alive.current = true;
    run();
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active' && alive.current) run();
    });
    return () => {
      alive.current = false;
      if (timer.current) clearTimeout(timer.current);
      sub.remove();
    };
  }, [run]);

  const steps = [
    { label: 'Raw telemetry saved on this phone', done: true },
    { label: `Uploading telemetry (${total - session.pendingUploads()} of ${total} events)`, done: session.pendingUploads() === 0 },
    { label: 'Cleaning events and extracting behavioral features (server)', done: false },
    { label: 'Estimating indicators (Big Five and/or RIASEC)', done: false },
  ];

  return (
    <View style={styles.fill}>
      <Backdrop tint="rgb(24,40,70)" />
      <View style={styles.page}>
        <H1 style={{ textAlign: 'center' }}>Assessment complete</H1>
        <Card style={{ marginTop: space(5) }}>
          {steps.map((s, i) => (
            <View key={i} style={styles.step}>
              <View style={[styles.dot, { backgroundColor: s.done ? colors.accent2 : state === 'working' ? colors.warn : colors.panelLight }]} />
              <Text style={styles.stepText}>{s.label}</Text>
            </View>
          ))}
          <View style={{ marginTop: space(3) }}>
            <Bar frac={progress} color={colors.accent2} height={12} />
          </View>
        </Card>
        {state === 'pending' ? (
          <Card style={{ marginTop: space(4) }} accent={colors.warn}>
            <Text style={styles.warn}>No connection to the RahYaab server right now.</Text>
            <Muted style={{ marginTop: space(2) }}>
              Your game is saved on this phone and nothing is lost. We will keep trying; you can also finish later - your results will be ready next time you open the game.
            </Muted>
            <Muted style={{ marginTop: space(1) }}>{detail}</Muted>
            <Btn label="Try again now" variant="primary" onPress={() => run()} style={{ marginTop: space(3) }} />
            <Btn label="Finish later" onPress={onLater} style={{ marginTop: space(2) }} />
          </Card>
        ) : null}
        {state === 'failed' ? (
          <Card style={{ marginTop: space(4) }} accent={colors.danger}>
            <Text style={[styles.warn, { color: colors.danger }]}>The server could not process this assessment.</Text>
            <Muted style={{ marginTop: space(2) }}>{detail}</Muted>
            <Muted style={{ marginTop: space(1) }}>Your telemetry is kept on this phone. Please tell your teacher or the study team.</Muted>
            <Btn label="Try again" variant="primary" onPress={() => run()} style={{ marginTop: space(3) }} />
            <Btn label="Back to RahYaab" onPress={onLater} style={{ marginTop: space(2) }} />
          </Card>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  page: { flex: 1, padding: space(5), paddingTop: space(12), maxWidth: 680, width: '100%', alignSelf: 'center' },
  step: { flexDirection: 'row', alignItems: 'center', marginVertical: space(1.5) },
  dot: { width: 14, height: 14, borderRadius: 7, marginRight: space(3) },
  stepText: { color: colors.text, fontSize: 15, flex: 1 },
  warn: { color: colors.warn, fontSize: 15, fontWeight: '700' },
});

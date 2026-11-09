/**
 * Integration entry point: mount <RahYaabGameScreen /> as one screen of the host app's navigator.
 *
 * Internally the module runs its own small state machine (menu -> name -> game -> processing -> results) rather than
 * pushing nested navigator routes: the assessment is a strict sequence (desktop GameApp) and must not be broken by
 * back-stack navigation, swipe-back gestures or deep links into the middle of a level.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TrackKey } from '../assessment/content';
import { PLANS } from '../game-engine/runner';
import { LEVEL_TITLES } from '../levels';
import { ApiClient } from '../services/apiClient';
import { ActiveSessionExistsError, AssessmentSession } from '../services/assessmentSession';
import { getDefaultStorage, KeyValueStorage, STORAGE_PREFIX } from '../services/storage';
import { AssessmentReport } from '../types/api';
import { RahYaabGameProps } from '../types/public';
import { Backdrop, Body, Btn, Card, H1 } from '../components/primitives';
import { colors, space } from '../components/theme';
import { ControlMode, GameScreen } from '../screens/GameScreen';
import { ConsentScreen, IncompatibleScreen, InstructionsScreen, LevelSelectScreen, MenuScreen, NameScreen, ResumeScreen } from '../screens/MenuScreens';
import { ProcessingScreen } from '../screens/ProcessingScreen';
import { ResultsScreen } from '../screens/ResultsScreen';

type Flow =
  | { name: 'loading' }
  | { name: 'error'; message: string }
  | { name: 'menu' }
  | { name: 'instructions' }
  | { name: 'levelSelect' }
  | { name: 'consent'; plan: number[] }
  | { name: 'name'; plan: number[] }
  | { name: 'resume'; session: AssessmentSession }
  | { name: 'incompatible'; localId: string }
  | { name: 'game'; session: AssessmentSession }
  | { name: 'processing'; session: AssessmentSession }
  | { name: 'results'; session: AssessmentSession; report: AssessmentReport };

const PREFS_KEY = `${STORAGE_PREFIX}prefs`;

export function RahYaabGameScreen(props: RahYaabGameProps) {
  return (
    <SafeAreaProvider>
      <View style={styles.fill}>
        <GameFlow {...props} />
      </View>
    </SafeAreaProvider>
  );
}

function GameFlow({ config, player, storage: storageProp, initialTrack, consentText, onComplete, onExit, onRequestOrientation, exitLabel = 'Back to RahYaab' }: RahYaabGameProps) {
  const storage: KeyValueStorage = useMemo(() => storageProp ?? getDefaultStorage(), [storageProp]);
  const apiOrError = useMemo(() => {
    try {
      return new ApiClient({
        baseUrl: config.apiBaseUrl,
        getAuthHeaders: config.getAuthHeaders,
        allowInsecureHttp: config.allowInsecureHttp,
        timeoutMs: config.requestTimeoutMs,
      });
    } catch (e) {
      return e as Error;
    }
  }, [config.apiBaseUrl, config.getAuthHeaders, config.allowInsecureHttp, config.requestTimeoutMs]);
  const api = apiOrError instanceof ApiClient ? apiOrError : null;

  const [flow, setFlow] = useState<Flow>({ name: 'loading' });
  const [controlMode, setControlMode] = useState<ControlMode>('joystick');
  const [busy, setBusy] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const reported = useRef(new Set<string>());
  const cb = useRef({ onComplete, onExit, onRequestOrientation });
  cb.current = { onComplete, onExit, onRequestOrientation };

  const startPlan = useCallback(
    (plan: number[]) => setFlow(consentText ? { name: 'consent', plan } : { name: 'name', plan }),
    [consentText],
  );

  // ---------------------------------------------------------------------------------------- startup
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!api) {
        setFlow({ name: 'error', message: (apiOrError as Error).message });
        return;
      }
      try {
        const prefs = JSON.parse((await storage.getItem(PREFS_KEY)) ?? '{}');
        if (prefs.controlMode === 'dpad' || prefs.controlMode === 'joystick') setControlMode(prefs.controlMode);
      } catch {
        /* per-viewer convenience only */
      }
      const r = await AssessmentSession.loadActive({ storage, api });
      if (!alive) return;
      if (r.kind === 'restored') {
        const s = r.session;
        if (s.record.status === 'completed' && s.record.report) setFlow({ name: 'results', session: s, report: s.record.report });
        else if (s.record.status === 'abandoned') {
          s.abandon().catch(() => undefined); // finish closing it on the server, then forget it
          setFlow(initialTrack ? { name: 'menu' } : { name: 'menu' });
        } else setFlow({ name: 'resume', session: s });
      } else if (r.kind === 'incompatible' || r.kind === 'corrupt') {
        setFlow({ name: 'incompatible', localId: r.localId });
      } else if (initialTrack) {
        startPlan(PLANS[initialTrack]);
      } else setFlow({ name: 'menu' });
    })().catch((e) => alive && setFlow({ name: 'error', message: `Could not read saved data: ${(e as Error).message}` }));
    return () => {
      alive = false;
    };
  }, [api, apiOrError, storage, initialTrack, startPlan]);

  // ----------------------------------------------------------------------------------- orientation
  useEffect(() => {
    cb.current.onRequestOrientation?.(flow.name === 'game' ? 'landscape' : 'default');
  }, [flow.name]);

  const saveControlMode = (m: ControlMode) => {
    setControlMode(m);
    storage.setItem(PREFS_KEY, JSON.stringify({ controlMode: m })).catch(() => undefined);
  };

  const createSession = async (plan: number[], name: string) => {
    setBusy(true);
    setNameError(null);
    try {
      const s = await AssessmentSession.start({ storage, api, plan, playerName: name, hostPlayerId: player?.playerId ?? null });
      s.sync().catch(() => undefined); // create the server session early when online; offline is fine
      setFlow({ name: 'game', session: s });
    } catch (e) {
      if (e instanceof ActiveSessionExistsError) {
        const r = await AssessmentSession.loadActive({ storage, api });
        if (r.kind === 'restored') setFlow({ name: 'resume', session: r.session });
        else setNameError(e.message);
      } else setNameError(`Could not start: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const onReport = useCallback((session: AssessmentSession, report: AssessmentReport) => {
    setFlow({ name: 'results', session, report });
    if (!reported.current.has(session.record.localId)) {
      reported.current.add(session.record.localId);
      cb.current.onComplete?.({
        sessionId: report.session_id,
        playerId: session.record.server.playerId,
        plan: session.record.plan,
        report,
      });
    }
  }, []);

  // ---------------------------------------------------------------------------------------- render
  switch (flow.name) {
    case 'loading':
      return <Backdrop />;
    case 'error':
      return (
        <View style={styles.fill}>
          <Backdrop />
          <View style={styles.center}>
            <H1 style={{ textAlign: 'center' }}>RahYaab is not configured</H1>
            <Card style={{ marginTop: space(4) }}>
              <Body>{flow.message}</Body>
            </Card>
            <Btn label={exitLabel} onPress={() => cb.current.onExit?.('closed')} style={{ marginTop: space(5) }} />
          </View>
        </View>
      );
    case 'menu':
      return (
        <MenuScreen
          onTrack={(t: TrackKey) => startPlan(PLANS[t])}
          onLevelSelect={() => setFlow({ name: 'levelSelect' })}
          onInstructions={() => setFlow({ name: 'instructions' })}
          onExit={() => cb.current.onExit?.('closed')}
          controlMode={controlMode}
          onControlMode={saveControlMode}
          exitLabel={exitLabel}
        />
      );
    case 'instructions':
      return <InstructionsScreen onBack={() => setFlow({ name: 'menu' })} />;
    case 'levelSelect':
      return <LevelSelectScreen onPick={(lid) => startPlan([lid])} onBack={() => setFlow({ name: 'menu' })} />;
    case 'consent':
      return <ConsentScreen text={consentText ?? ''} onAgree={() => setFlow({ name: 'name', plan: flow.plan })} onBack={() => setFlow({ name: 'menu' })} />;
    case 'name':
      return (
        <NameScreen
          initial={player?.displayName ?? ''}
          busy={busy}
          error={nameError}
          onSubmit={(n) => createSession(flow.plan, n)}
          onBack={() => setFlow({ name: 'menu' })}
        />
      );
    case 'resume': {
      const s = flow.session;
      const r = s.runner;
      const lid = r.currentLevelId;
      return (
        <ResumeScreen
          playerName={s.record.playerName}
          levelLabel={`level ${lid}: ${LEVEL_TITLES[lid]}, ${r.levelIdx + 1} of ${r.plan.length}`}
          pendingUpload={s.record.status === 'finished'}
          busy={busy}
          onResume={() => setFlow(s.record.status === 'finished' ? { name: 'processing', session: s } : { name: 'game', session: s })}
          onAbandon={async () => {
            setBusy(true);
            await s.abandon().catch(() => undefined);
            setBusy(false);
            setFlow({ name: 'menu' });
          }}
        />
      );
    }
    case 'incompatible':
      return (
        <IncompatibleScreen
          onDiscard={async () => {
            await AssessmentSession.discard(storage, flow.localId);
            setFlow({ name: 'menu' });
          }}
          onExit={() => cb.current.onExit?.('closed')}
        />
      );
    case 'game': {
      const s = flow.session;
      return (
        <GameScreen
          key={s.record.localId}
          session={s}
          controlMode={controlMode}
          onOver={(st) => {
            if (st === 'finished') setFlow({ name: 'processing', session: s });
            else {
              s.abandon().catch(() => undefined);
              setFlow({ name: 'menu' });
            }
          }}
        />
      );
    }
    case 'processing': {
      const s = flow.session;
      return <ProcessingScreen session={s} onReport={(rep) => onReport(s, rep)} onLater={() => cb.current.onExit?.('finish-later')} />;
    }
    case 'results': {
      const s = flow.session;
      return (
        <ResultsScreen
          report={flow.report}
          playerName={s.record.playerName}
          onDone={async () => {
            await s.close().catch(() => undefined); // results were handed to the host; keep no assessment data on the phone
            cb.current.onExit?.('completed');
            setFlow({ name: 'menu' });
          }}
        />
      );
    }
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, padding: space(6), justifyContent: 'center', maxWidth: 620, width: '100%', alignSelf: 'center' },
});

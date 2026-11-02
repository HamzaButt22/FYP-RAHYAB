/**
 * Everything the engine owns: briefing -> level intro -> play (+ dialogs) -> pause -> outcome -> ... -> finished.
 * Port of the desktop screens draw_briefing / draw_intro / draw_play / draw_paused / draw_outcome.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChoiceDialog, CountPanel, MessageBox } from '../game-engine/dialogs';
import { Level } from '../game-engine/level-base';
import { MAX_ATTEMPTS } from '../game-engine/settings';
import { fmtFixed } from '../game-engine/pymath';
import { PlannerPanel } from '../levels/level2-planning';
import { ActivityPanel, WorkshopLevel } from '../levels/level7-workshop';
import { levelInfo } from '../levels';
import { INTRO_TEXT, LEVEL_BLURB } from '../assessment/content';
import { AssessmentSession } from '../services/assessmentSession';
import { InputController, Press } from '../utils/inputController';
import { inputTarget } from '../utils/uiState';
import { useGameLoop } from '../hooks/useGameLoop';
import { usePlayLayout, useReducedMotion } from '../hooks/useResponsive';
import { ActionButton, DPad, Joystick, SmallButton } from '../components/Controls';
import { ActivityPanelView } from '../components/modals/ActivityPanelView';
import { ChoiceDialogView, CountPanelView, MessageBoxView, PlannerPanelView } from '../components/modals/Dialogs';
import { createDynamics, updateDynamics, WorldView } from '../components/world/WorldView';
import { Backdrop, Body, Btn, Bullet, Card, H1, Muted } from '../components/primitives';
import { ABS_FILL, colors, DENSE_FONT_SCALE, space } from '../components/theme';

export type ControlMode = 'joystick' | 'dpad';

export interface GameScreenProps {
  session: AssessmentSession;
  controlMode: ControlMode;
  onOver: (state: 'finished' | 'abandoned') => void;
}

export function GameScreen({ session, controlMode, onOver }: GameScreenProps) {
  const runner = session.runner;
  const input = useRef(new InputController()).current;
  const dyn = useRef(createDynamics()).current;
  const layout = usePlayLayout();
  const reduced = useReducedMotion();
  const scaleRef = useRef(layout.scale);
  scaleRef.current = layout.scale;
  const [, setSig] = useState('');
  const [confirmQuit, setConfirmQuit] = useState(false);

  const send = useCallback((p: Press) => input.press(p, inputTarget(runner)), [input, runner]);

  useGameLoop(session, input, {
    onSignature: setSig,
    onFrame: () => updateDynamics(dyn, runner, scaleRef.current, reduced),
    onOver,
  });

  useEffect(() => {
    if (runner.state !== 'paused') setConfirmQuit(false);
  });

  switch (runner.state) {
    case 'briefing':
      return <Briefing session={session} onBegin={() => send({ confirm: true })} />;
    case 'intro':
      return <Intro session={session} onStart={() => send({ confirm: true })} />;
    case 'play':
    case 'paused':
    case 'outcome':
      break;
    default:
      return (
        <View style={styles.fill}>
          <Backdrop />
        </View>
      );
  }

  const level = runner.level as Level;
  const modal = level.modal;
  const hint = modal ? null : level.interactHint();
  const controls = controlMode === 'dpad' ? <DPad input={input} /> : <Joystick input={input} size={layout.landscape ? 116 : 128} />;
  const action = <ActionButton hint={hint} onPress={() => send({ interact: true })} size={layout.landscape ? 84 : 92} />;
  const notebook = level.hasNotebook ? <SmallButton glyph="📓" label="Notebook" onPress={() => send({ tab: true })} /> : null;

  const world = <WorldView level={level} scale={layout.scale} dyn={dyn} frozen={level.player.frozen} />;
  const toast = level.toastMs > 0 && !modal ? level.toast : '';

  return (
    <View style={[styles.fill, { backgroundColor: colors.bg, paddingTop: layout.insets.top, paddingBottom: layout.insets.bottom, paddingLeft: layout.insets.left, paddingRight: layout.insets.right }]}>
      <Hud level={level} attempt={runner.attempt} height={layout.hudH} onPause={() => send({ pause: true })} landscape={layout.landscape} notebook={layout.landscape ? null : notebook} />
      {layout.landscape ? (
        <View style={styles.row}>
          <View style={[styles.side, { width: layout.sideW }]}>{controls}</View>
          <View>
            {world}
            <Toast text={toast} />
          </View>
          <View style={[styles.side, { width: layout.sideW }]}>
            {notebook}
            <View style={{ height: space(3) }} />
            {action}
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={{ alignItems: 'center' }}>
            {world}
            <Toast text={toast} />
          </View>
          <Text style={styles.rotate}>Tip: turn your phone sideways for a bigger map.</Text>
          <View style={[styles.bottom, { height: layout.bottomH }]}>
            {controls}
            {action}
          </View>
        </View>
      )}
      {runner.state === 'play' && modal ? <ModalLayer level={level} send={send} /> : null}
      {runner.state === 'paused' ? (
        <PauseOverlay
          confirmQuit={confirmQuit}
          onResume={() => send({ pause: true })}
          onAskQuit={() => setConfirmQuit(true)}
          onCancelQuit={() => setConfirmQuit(false)}
          onQuit={() => {
            send({ selectIndex: 1 });
            send({ confirm: true });
          }}
        />
      ) : null}
      {runner.state === 'outcome' ? <Outcome session={session} level={level} onPick={(i) => send({ number: i + 1 })} /> : null}
    </View>
  );
}

function ModalLayer({ level, send }: { level: Level; send: (p: Press) => void }) {
  const m = level.modal;
  if (m instanceof ChoiceDialog) return <ChoiceDialogView dlg={m} send={send} />;
  if (m instanceof MessageBox) return <MessageBoxView box={m} send={send} />;
  if (m instanceof CountPanel) return <CountPanelView panel={m} send={send} />;
  if (m instanceof PlannerPanel) return <PlannerPanelView panel={m} send={send} />;
  if (m instanceof ActivityPanel) return <ActivityPanelView panel={m} level={level as WorkshopLevel} send={send} />;
  return null;
}

function Hud({ level, attempt, height, onPause, landscape, notebook }: { level: Level; attempt: number; height: number; onPause: () => void; landscape: boolean; notebook: React.ReactNode }) {
  return (
    <View style={[styles.hud, { minHeight: height }]} accessibilityRole="summary">
      <View style={{ flex: 1, marginRight: space(2) }}>
        <Text style={styles.hudTitle} numberOfLines={1} maxFontSizeMultiplier={DENSE_FONT_SCALE}>{`Level ${level.levelId}: ${level.name}`}</Text>
        <Text style={styles.hudObjective} numberOfLines={landscape ? 1 : 2} maxFontSizeMultiplier={DENSE_FONT_SCALE}>
          {level.objective}
        </Text>
        {level.levelId <= 4 ? <Text style={styles.hudDim} maxFontSizeMultiplier={DENSE_FONT_SCALE}>{`Attempt ${attempt}/${MAX_ATTEMPTS}`}</Text> : null}
      </View>
      <View style={styles.hudStats}>
        {level.hudExtra().map((h) => (
          <View key={h.label} style={styles.stat} accessible accessibilityLabel={`${h.label}: ${h.value}`}>
            <Text style={styles.statValue} maxFontSizeMultiplier={DENSE_FONT_SCALE}>
              {h.value}
            </Text>
            <Text style={styles.statLabel} maxFontSizeMultiplier={DENSE_FONT_SCALE}>
              {h.label}
            </Text>
          </View>
        ))}
      </View>
      {notebook}
      <SmallButton glyph="⏸" label="Pause" onPress={onPause} />
    </View>
  );
}

function Toast({ text }: { text: string }) {
  if (!text) return null;
  return (
    <View style={styles.toastWrap} pointerEvents="none">
      <Text style={styles.toast} accessibilityLiveRegion="polite" maxFontSizeMultiplier={DENSE_FONT_SCALE}>
        {text}
      </Text>
    </View>
  );
}

function Briefing({ session, onBegin }: { session: AssessmentSession; onBegin: () => void }) {
  const plan = session.runner.plan;
  return (
    <View style={styles.fill}>
      <Backdrop />
      <ScrollView contentContainerStyle={styles.page}>
        <H1 style={{ textAlign: 'center' }}>{`Welcome, ${session.record.playerName}!`}</H1>
        <Card style={{ marginTop: space(4) }} accent={colors.accent}>
          <Body>{`You are about to play ${plan.length} game level(s) (levels ${plan.join(', ')}). There are no right or wrong answers - just play the way that feels natural to you. You can pause or step away at any time.`}</Body>
          <View style={{ height: space(3) }} />
          <Bullet color={colors.accent}>What the game records: movement, choices, timing, retries and mistakes (telemetry).</Bullet>
          <Bullet color={colors.accent}>Levels 1-6 give exploratory Big Five indicators; levels 7-8 give an exploratory career-interest (RIASEC) profile. The two are kept separate.</Bullet>
          <Bullet color={colors.accent}>Important: this is a prototype. Results are behavioral indicators, not a diagnosis, ability score or career test.</Bullet>
          <Text style={[styles.warn, { marginTop: space(3) }]}>
            Controls: move with the joystick, tap the action button next to things, tap options then "Choose", pause any time.
          </Text>
        </Card>
        <Btn label={`Begin Level ${plan[0]}`} variant="primary" onPress={onBegin} style={{ marginTop: space(5) }} testID="begin" />
      </ScrollView>
    </View>
  );
}

function Intro({ session, onStart }: { session: AssessmentSession; onStart: () => void }) {
  const r = session.runner;
  const lid = r.currentLevelId;
  const info = levelInfo(lid);
  return (
    <View style={styles.fill}>
      <Backdrop tint="rgb(30,36,70)" />
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={[styles.accent, { textAlign: 'center' }]}>{`${LEVEL_BLURB[lid]}   (${r.levelIdx + 1} of ${r.plan.length})`}</Text>
        <H1 style={{ textAlign: 'center', marginVertical: space(2) }}>{info.name}</H1>
        <Card>
          <Body>{INTRO_TEXT[lid]}</Body>
        </Card>
        <Text style={[styles.warn, { textAlign: 'center', marginTop: space(4) }]}>{`Objective: ${info.objective}`}</Text>
        <Muted style={{ textAlign: 'center', marginTop: space(2) }}>{info.controlsHint}</Muted>
        {r.attempt > 1 ? <Muted style={{ textAlign: 'center', marginTop: space(2) }}>{`Attempt ${r.attempt} of ${MAX_ATTEMPTS}`}</Muted> : null}
        <Btn label="Start" variant="primary" onPress={onStart} style={{ marginTop: space(5) }} testID="start-level" />
      </ScrollView>
    </View>
  );
}

function PauseOverlay({ confirmQuit, onResume, onAskQuit, onCancelQuit, onQuit }: { confirmQuit: boolean; onResume: () => void; onAskQuit: () => void; onCancelQuit: () => void; onQuit: () => void }) {
  return (
    <View style={styles.overlay} accessibilityViewIsModal>
      <Card style={styles.overlayCard}>
        {!confirmQuit ? (
          <>
            <H1 style={{ textAlign: 'center' }}>PAUSED</H1>
            <Btn label="Resume" variant="primary" onPress={onResume} style={{ marginTop: space(4) }} testID="resume" />
            <Btn label="Quit to menu (abandon assessment)" variant="danger" onPress={onAskQuit} style={{ marginTop: space(3) }} />
            <Muted style={{ textAlign: 'center', marginTop: space(3) }}>The game clock is stopped while paused.</Muted>
          </>
        ) : (
          <>
            <H1 style={{ textAlign: 'center', fontSize: 24 }}>Abandon this assessment?</H1>
            <Body style={{ marginTop: space(3), textAlign: 'center' }}>
              Your progress will not be scored and cannot be resumed. If you just need a break, choose "Keep playing" - you can leave the app and come back later.
            </Body>
            <Btn label="Keep playing" variant="primary" onPress={onCancelQuit} style={{ marginTop: space(4) }} />
            <Btn label="Yes, abandon" variant="danger" onPress={onQuit} style={{ marginTop: space(3) }} testID="confirm-abandon" />
          </>
        )}
      </Card>
    </View>
  );
}

const FAIL_REASONS: Record<string, string> = {
  quota_missed: 'You delivered less than the 100-coin quota.',
  timeout: 'The vault collapsed before you got out.',
};

function Outcome({ session, level, onPick }: { session: AssessmentSession; level: Level; onPick: (i: number) => void }) {
  const ok = level.status === 'complete';
  const opts = session.runner.outcomeOptions();
  return (
    <View style={styles.overlay} accessibilityViewIsModal>
      <Card style={[styles.overlayCard, { borderWidth: 2, borderColor: ok ? colors.accent2 : colors.danger }]}>
        <H1 style={{ textAlign: 'center', color: ok ? colors.accent2 : colors.danger }}>{ok ? 'LEVEL COMPLETE' : 'LEVEL FAILED'}</H1>
        <Body style={{ textAlign: 'center', marginTop: space(1) }}>{level.name}</Body>
        <Muted style={{ textAlign: 'center', marginTop: space(2) }}>
          {ok ? `Time on this attempt: ${fmtFixed(level.elapsedMs / 1000, 0)}s` : (FAIL_REASONS[level.failReason ?? ''] ?? 'Something went wrong.')}
        </Muted>
        {opts.map((o, i) => (
          <Btn key={o} label={o} variant={i === 0 ? 'primary' : 'secondary'} onPress={() => onPick(i)} style={{ marginTop: space(3) }} testID={`outcome-${i}`} />
        ))}
        {!ok && session.runner.attempt < MAX_ATTEMPTS ? <Muted style={{ textAlign: 'center', marginTop: space(2) }}>{`Attempt ${session.runner.attempt} of ${MAX_ATTEMPTS}`}</Muted> : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  page: { padding: space(5), paddingTop: space(10), maxWidth: 860, width: '100%', alignSelf: 'center' },
  row: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  side: { alignItems: 'center', justifyContent: 'center' },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  rotate: { color: colors.textDim, fontSize: 12, textAlign: 'center', marginTop: space(2) },
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
    paddingHorizontal: space(3),
    paddingVertical: space(1),
  },
  hudTitle: { color: colors.text, fontWeight: '800', fontSize: 15 },
  hudObjective: { color: colors.textDim, fontSize: 12 },
  hudDim: { color: colors.textDim, fontSize: 11 },
  hudStats: { flexDirection: 'row', marginRight: space(2) },
  stat: { alignItems: 'flex-end', marginLeft: space(3) },
  statValue: { color: colors.gold, fontWeight: '800', fontSize: 16 },
  statLabel: { color: colors.textDim, fontSize: 10 },
  toastWrap: { position: 'absolute', left: 0, right: 0, bottom: 8, alignItems: 'center', paddingHorizontal: 8 },
  toast: {
    color: colors.text,
    backgroundColor: 'rgba(30,36,56,0.92)',
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    overflow: 'hidden',
    textAlign: 'center',
  },
  overlay: { ...ABS_FILL, backgroundColor: 'rgba(6,8,16,0.82)', alignItems: 'center', justifyContent: 'center', padding: space(4) },
  overlayCard: { width: '100%', maxWidth: 520 },
  warn: { color: colors.warn, fontSize: 14 },
  accent: { color: colors.accent, fontSize: 15 },
});

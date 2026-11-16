// Game lab: developer builds only (the route is locked with Stack.Protected guard={__DEV__}). Lists every
// module in the registry with any contract problems, plays one as a practice run, and then shows exactly
// what it sent: the envelope events that would go to the outbox, the experiments that stay on the phone,
// and anything dropped. With "Send to the local API" on, the run also goes through the real encrypted
// outbox and is uploaded at once (needs a joined student whose family said OK). English only, like the
// rest of the app; students never see it.

import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import type { GameContext, GameModule, GameResult } from '@/game/contract';
import { CONTENT_VERSION } from '@/game/content';
import { GameScreen } from '@/game/GameScreen';
import { GAME_MODULES } from '@/game/registry';
import { moduleProblems, registryProblems } from '@/game/rules';
import { MemorySink, MemoryStore, createRun, uuidv7, type EventSink, type Run } from '@/game/run';
import { getOutbox, outboxSink, syncNow } from '@/sync/runtime';
import type { SyncOutcome } from '@/sync/sync';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

const store = new MemoryStore(); // saved progress lasts while the app is open, so "played before" can be tried
const sessionId = uuidv7(Date.now());

type Played = { module: GameModule; sink: MemorySink; run: Run; result: GameResult; upload: string | null };

function describe(outcome: SyncOutcome): string {
  switch (outcome.kind) {
    case 'done':
      return `sent ${outcome.sent}: ${outcome.acked} stored, ${outcome.deferred} waiting, ${outcome.rejected} rejected`;
    case 'failed':
      return `not sent (${outcome.reason}); retried later`;
    case 'waiting':
      return 'waiting after an earlier failure; retried later';
    case 'consent_required':
      return 'kept on the phone: no family consent yet';
    case 'signed_out':
      return 'kept on the phone: nobody is signed in';
    case 'busy':
      return 'a sync was already running';
  }
}

export default function GameLab() {
  const { colors } = useTheme();
  const [a11yMode, setA11yMode] = useState(false);
  const [upload, setUpload] = useState(false);
  const [playing, setPlaying] = useState<{ module: GameModule; run: Run } | null>(null);
  const [played, setPlayed] = useState<Played | null>(null);
  const problems = useMemo(() => registryProblems(GAME_MODULES), []);
  const context: GameContext = {
    week: 0,
    practice: true, // lab runs are never scored
    a11yMode,
    reducedMotion: false,
  };

  const play = async (module: GameModule) => {
    const shown = new MemorySink();
    const outbox = upload ? outboxSink(await getOutbox()) : null;
    const sink: EventSink = {
      add: (event) => {
        outbox?.add(event); // first into the encrypted outbox, as in the app
        shown.add(event);
      },
    };
    const run = createRun({
      module,
      context,
      sessionId,
      contentVersion: CONTENT_VERSION,
      sink,
      store,
      strict: true, // the lab exists only in development builds
      monotonic: () => performance.now(),
      wallClock: () => Date.now(),
      onFinish: (result, ended) => {
        setPlayed({ module, sink: shown, run: ended, result, upload: upload ? 'sending…' : null });
        setPlaying(null);
        if (upload) {
          void syncNow()
            .then(describe, (e: unknown) => `failed: ${String(e)}`)
            .then((text) => setPlayed((p) => (p ? { ...p, upload: text } : p)));
        }
      },
    });
    setPlayed(null);
    setPlaying({ module, run });
  };

  if (playing) {
    return (
      <Screen>
        <GameScreen
          run={playing.run}
          module={playing.module}
          context={context}
          crashMessage="The module crashed. The run was closed with quit; see the console."
        />
        <Button kind="text" label="Leave (sends quit)" onPress={() => playing.run.abandon()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="displayL" accessibilityRole="header">
        Game lab
      </AppText>
      <AppText color="muted">
        Developer builds only. Play a module as a practice run and see what it sends. Contract rules: RFC-0005.
      </AppText>
      {problems.length > 0 ? (
        <View style={[styles.box, { borderColor: colors.danger }]}>
          {problems.map((p) => (
            <AppText key={p} color="danger">
              {p}
            </AppText>
          ))}
        </View>
      ) : null}
      <View style={styles.toggle}>
        <AppText style={styles.grow}>Accessible task mode (stored as not measured)</AppText>
        <Switch value={a11yMode} onValueChange={setA11yMode} />
      </View>
      <View style={styles.toggle}>
        <AppText style={styles.grow}>
          Send to the local API through the encrypted outbox (needs a joined student with family OK)
        </AppText>
        <Switch value={upload} onValueChange={setUpload} />
      </View>
      {GAME_MODULES.map((m) => (
        <View key={m.id} style={[styles.box, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <AppText variant="title">{m.title}</AppText>
          <AppText variant="caption" color="secondaryText">
            {`${m.id}@${m.version} · ${m.kind} · measures ${m.measures.join(', ')}`}
          </AppText>
          <Button
            label="Play"
            disabled={moduleProblems(m).length > 0}
            onPress={() => void play(m)}
          />
        </View>
      ))}
      {played ? <Results played={played} /> : null}
      <Button kind="text" label="Back" onPress={() => router.back()} />
    </Screen>
  );
}

function Results({ played }: { played: Played }) {
  const { colors } = useTheme();
  const { sink, run, result, module, upload } = played;
  return (
    <View style={[styles.box, { borderColor: colors.border }]}>
      <AppText variant="title">
        {`${module.id}: ${result.completed ? 'finished' : 'left early'}, ${sink.events.length} events`}
      </AppText>
      <AppText variant="caption" color="secondaryText">
        {`practice: ${sink.events[0]?.practice ? 'yes' : 'no'} · accessible mode: ${sink.events[0]?.a11y_mode ? 'yes (not measured)' : 'no'} · week ${sink.events[0]?.week ?? '-'}`}
      </AppText>
      {upload ? (
        <AppText variant="label" color="primaryText">{`Upload: ${upload}`}</AppText>
      ) : null}
      <AppText variant="label">Events for the outbox (envelope v3.0.0)</AppText>
      {sink.events.map((e) => (
        <AppText key={e.event_id} variant="caption" selectable>
          {`#${e.seq} ${e.event_type} ${e.item_id ?? ''} ${e.data ? JSON.stringify(e.data) : ''} · ${e.monotonic_ms} ms`}
        </AppText>
      ))}
      <AppText variant="label">Experiments (kept on the phone, never uploaded)</AppText>
      {run.log.experiments.length === 0 ? <AppText variant="caption">none</AppText> : null}
      {run.log.experiments.map((x, i) => (
        <AppText key={i} variant="caption" selectable>
          {`${x.name} ${x.data ? JSON.stringify(x.data) : ''} · ${x.at_ms} ms`}
        </AppText>
      ))}
      {run.log.dropped.length > 0 ? (
        <>
          <AppText variant="label" color="danger">
            Dropped (release builds only)
          </AppText>
          {run.log.dropped.map((d, i) => (
            <AppText key={i} variant="caption" color="danger">
              {d}
            </AppText>
          ))}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: radius.md, padding: space[3], gap: space[2] },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  grow: { flex: 1 },
});

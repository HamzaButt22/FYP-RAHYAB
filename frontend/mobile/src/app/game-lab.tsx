// Game lab: developer builds only (the route is locked with Stack.Protected guard={__DEV__}). Lists every
// module in the registry with any contract problems, plays one as a practice run, and then shows exactly
// what it sent: the envelope events that would go to the outbox, the experiments that stay on the phone,
// and anything dropped. English only (in the Latin font, also in Urdu mode), like other developer tools;
// students never see it.

import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import type { GameContext, GameModule, GameResult } from '@/game/contract';
import { GameScreen } from '@/game/GameScreen';
import { GAME_MODULES } from '@/game/registry';
import { moduleProblems, registryProblems } from '@/game/rules';
import { MemorySink, MemoryStore, createRun, uuidv7, type Run } from '@/game/run';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

const store = new MemoryStore(); // saved progress lasts while the app is open, so "played before" can be tried
const sessionId = uuidv7(Date.now());

type Played = { module: GameModule; sink: MemorySink; run: Run; result: GameResult };

export default function GameLab() {
  const { i18n } = useTranslation();
  const { colors } = useTheme();
  const [a11yMode, setA11yMode] = useState(false);
  const [playing, setPlaying] = useState<{ module: GameModule; run: Run } | null>(null);
  const [played, setPlayed] = useState<Played | null>(null);
  const problems = useMemo(() => registryProblems(GAME_MODULES), []);
  const locale = i18n.language === 'ur' ? 'ur' : 'en';
  const context: GameContext = {
    locale,
    rtl: locale === 'ur',
    week: 0,
    practice: true, // lab runs are never scored
    a11yMode,
    reducedMotion: false,
  };

  const play = (module: GameModule) => {
    const sink = new MemorySink();
    const run = createRun({
      module,
      context,
      sessionId,
      sink,
      store,
      strict: true, // the lab exists only in development builds
      monotonic: () => performance.now(),
      wallClock: () => Date.now(),
      onFinish: (result, ended) => {
        setPlayed({ module, sink, run: ended, result });
        setPlaying(null);
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
      <AppText script="latin" variant="displayL" accessibilityRole="header">
        Game lab
      </AppText>
      <AppText script="latin" color="muted">
        Developer builds only. Play a module as a practice run and see what it sends. Contract rules: RFC-0005.
      </AppText>
      {problems.length > 0 ? (
        <View style={[styles.box, { borderColor: colors.danger }]}>
          {problems.map((p) => (
            <AppText script="latin" key={p} color="danger">
              {p}
            </AppText>
          ))}
        </View>
      ) : null}
      <View style={styles.toggle}>
        <AppText script="latin" style={styles.grow}>Accessible task mode (stored as not measured)</AppText>
        <Switch value={a11yMode} onValueChange={setA11yMode} />
      </View>
      {GAME_MODULES.map((m) => (
        <View key={m.id} style={[styles.box, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <AppText variant="title">{m.title[locale]}</AppText>
          <AppText script="latin" variant="caption" color="secondaryText">
            {`${m.id}@${m.version} · ${m.kind} · measures ${m.measures.join(', ')}`}
          </AppText>
          <Button
            label="Play"
            disabled={moduleProblems(m).length > 0}
            onPress={() => play(m)}
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
  const { sink, run, result, module } = played;
  return (
    <View style={[styles.box, { borderColor: colors.border }]}>
      <AppText script="latin" variant="title">
        {`${module.id}: ${result.completed ? 'finished' : 'left early'}, ${sink.events.length} events`}
      </AppText>
      <AppText script="latin" variant="caption" color="secondaryText">
        {`practice: ${sink.events[0]?.practice ? 'yes' : 'no'} · accessible mode: ${sink.events[0]?.a11y_mode ? 'yes (not measured)' : 'no'} · week ${sink.events[0]?.week ?? '-'}`}
      </AppText>
      <AppText script="latin" variant="label">Events for the outbox (envelope v3.0.0)</AppText>
      {sink.events.map((e) => (
        <AppText script="latin" key={e.event_id} variant="caption" selectable>
          {`#${e.seq} ${e.event_type} ${e.item_id ?? ''} ${e.data ? JSON.stringify(e.data) : ''} · ${e.monotonic_ms} ms`}
        </AppText>
      ))}
      <AppText script="latin" variant="label">Experiments (kept on the phone, never uploaded)</AppText>
      {run.log.experiments.length === 0 ? <AppText script="latin" variant="caption">none</AppText> : null}
      {run.log.experiments.map((x, i) => (
        <AppText script="latin" key={i} variant="caption" selectable>
          {`${x.name} ${x.data ? JSON.stringify(x.data) : ''} · ${x.at_ms} ms`}
        </AppText>
      ))}
      {run.log.dropped.length > 0 ? (
        <>
          <AppText script="latin" variant="label" color="danger">
            Dropped (release builds only)
          </AppText>
          {run.log.dropped.map((d, i) => (
            <AppText script="latin" key={i} variant="caption" color="danger">
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

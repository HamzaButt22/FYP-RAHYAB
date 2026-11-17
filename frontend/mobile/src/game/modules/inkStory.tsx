// The story host (ADR-0009, FR-20, FR-95): plays one scene of an Ink story as a game module (contract 2.0).
// A week-plan step names the story and the scene: params { story: 'sample', knot: 'prologue' }.
//
// - The scene reads like a chat: the newest block of lines, with the speakers' names and one speaker button
//   (read aloud, FR-96), under the student's last answer. Older lines leave the screen, so the choices
//   always stay in view.
// - Choices are large buttons. A two-way choice tagged with interest types (#type) is recorded as
//   `choice_made` {pair, picked, side, dwell_ms} under the line's #item; other choices only move the story.
// - The place in the scene is saved after every choice, so "Take a break" resumes at the same choice.
// - At the end, "Done" finishes the run; the host then saves the week's progress.

import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ListenButton } from '@/components/ListenButton';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, touchMin } from '@/theme/tokens';
import { CONTRACT_VERSION, type GameModule, type GameModuleProps } from '../contract.ts';
import { STORIES } from '../stories';
import { StoryRunner, type Snapshot, type StoryChoice, type StoryLine } from '../story/runner.ts';

type Entry = { kind: 'lines'; lines: StoryLine[] } | { kind: 'you'; text: string };

const TEXT = {
  missing: 'This part of the story could not be opened.',
  done: 'Done',
  resumed: 'Welcome back. Carry on from here.',
  you: 'You',
} as const;

/** The time when a choice is shown or tapped (event time, never read while drawing). */
const clock = () => Date.now();

function asSnapshot(saved: unknown): Snapshot | null {
  if (typeof saved !== 'object' || saved === null || Array.isArray(saved)) return null;
  const s = saved as Record<string, unknown>;
  return typeof s.ink === 'string' ? { ink: s.ink, item: typeof s.item === 'string' ? s.item : null } : null;
}

/** The lines on screen when the place was saved, shown again on resume (so the question is not lost). */
function savedLines(saved: unknown): StoryLine[] {
  const lines = (saved as { lines?: unknown } | null)?.lines;
  return Array.isArray(lines)
    ? lines.filter(
        (l): l is StoryLine => typeof l?.text === 'string' && (typeof l.speaker === 'string' || l.speaker === null),
      )
    : [];
}

function InkStory({ context, host, saved }: GameModuleProps) {
  const { colors } = useTheme();
  // Without params (the game lab), the sample prologue plays.
  const storyId = typeof context.params?.story === 'string' ? context.params.story : 'sample';
  const knot = typeof context.params?.knot === 'string' ? context.params.knot : 'prologue';
  const json = STORIES[storyId];

  // The scene starts when the screen is created; it is created anew for every run (GameScreen key).
  const [first] = useState(() => {
    if (!json || !knot) return null;
    const run = new StoryRunner(json, knot, asSnapshot(saved));
    return { run, step: run.next() };
  });
  const runner = useRef<StoryRunner | null>(first?.run ?? null);
  const shownAt = useRef(0); // when the current choices appeared (set after drawing, never during)
  const [entries, setEntries] = useState<Entry[]>(() => {
    const lines = first?.step.lines.length ? first.step.lines : savedLines(saved);
    return lines.length ? [{ kind: 'lines', lines }] : [];
  });
  const [choices, setChoices] = useState<StoryChoice[]>(first?.step.choices ?? []);
  const [ended, setEnded] = useState(first?.step.ended ?? false);
  const [resumed, setResumed] = useState(() => asSnapshot(saved) !== null);

  const show = (step: ReturnType<StoryRunner['next']>, before: Entry[]) => {
    setEntries(step.lines.length ? [...before, { kind: 'lines', lines: step.lines }] : before);
    setChoices(step.choices);
    setEnded(step.ended);
    shownAt.current = clock();
  };

  useEffect(() => {
    shownAt.current = Date.now();
    if (first) host.emit({ type: 'scene_start', data: { scene_id: knot } });
  }, [first, host, knot]);

  const choose = (choice: StoryChoice) => {
    const run = runner.current;
    if (!run) return;
    setResumed(false);
    const measured = run.choose(choice.index);
    if (measured) {
      host.emit({
        type: 'choice_made',
        ...(measured.itemId ? { itemId: measured.itemId } : {}),
        data: {
          pair: measured.pair,
          picked: measured.picked,
          side: measured.side,
          dwell_ms: clock() - shownAt.current,
        },
      });
    }
    const step = run.next();
    try {
      const place = run.snapshot();
      host.save({ ink: place.ink, item: place.item, lines: step.lines.map((l) => ({ ...l })) });
    } catch {
      // too large to save (a very long scene): the scene still plays; a break restarts it
    }
    show(step, [...entries, { kind: 'you', text: choice.text }]);
  };

  if (!json || !knot) {
    return <AppText>{TEXT.missing}</AppText>;
  }

  // Only the last answer and the newest lines stay on screen, so the choices never scroll out of view.
  const visible = entries.slice(-2);
  return (
    <View style={styles.column}>
      {resumed ? <AppText color="muted">{TEXT.resumed}</AppText> : null}
      {visible.map((entry, i) =>
        entry.kind === 'you' ? (
          <View key={`you-${entries.length - visible.length + i}`} style={[styles.you, { backgroundColor: colors.sunken }]}>
            <AppText variant="caption" color="muted">
              {TEXT.you}
            </AppText>
            <AppText>{entry.text}</AppText>
          </View>
        ) : (
          <View key={`lines-${entries.length - visible.length + i}`} style={styles.row}>
            <View style={[styles.block, styles.grow]}>
              {groupBySpeaker(entry.lines).map((g, j) => (
                <View key={j} style={styles.block}>
                  {g.speaker ? (
                    <AppText variant="label" color="secondaryText">
                      {g.speaker}
                    </AppText>
                  ) : null}
                  <AppText>{g.text}</AppText>
                </View>
              ))}
            </View>
            {/* Read aloud (FR-96): one button for the whole block. */}
            <ListenButton
              id={`story:${knot}:${entries.length}`}
              text={entry.lines.map((l) => l.text).join(' ')}
            />
          </View>
        ),
      )}

      {choices.map((c) => (
        <Pressable
          key={c.index}
          accessibilityRole="button"
          accessibilityLabel={c.text}
          onPress={() => choose(c)}
          style={({ pressed }) => [
            styles.choice,
            { backgroundColor: pressed ? colors.sunken : colors.surface, borderColor: colors.border },
          ]}
        >
          <AppText variant="title">{c.text}</AppText>
        </Pressable>
      ))}

      {ended ? <Button label={TEXT.done} onPress={() => host.finish({ completed: true })} /> : null}
    </View>
  );
}

/** Consecutive lines by the same speaker read as one paragraph. */
function groupBySpeaker(lines: StoryLine[]): { speaker: string | null; text: string }[] {
  const out: { speaker: string | null; text: string }[] = [];
  for (const line of lines) {
    const last = out[out.length - 1];
    if (last && last.speaker === line.speaker) last.text += ` ${line.text}`;
    else out.push({ speaker: line.speaker, text: line.text });
  }
  return out;
}

export const inkStory: GameModule = {
  id: 'ink-story',
  version: '1.0.0',
  kind: 'scene',
  measures: ['interests'],
  title: 'Story scene (Ink)',
  contract: CONTRACT_VERSION,
  Screen: InkStory,
};

const styles = StyleSheet.create({
  column: { gap: space[4] },
  block: { gap: space[1] },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3] },
  grow: { flex: 1 },
  you: { alignSelf: 'flex-end', maxWidth: '85%', borderRadius: radius.lg, padding: space[3], gap: space[1] },
  choice: {
    minHeight: touchMin + 8,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    justifyContent: 'center',
  },
});

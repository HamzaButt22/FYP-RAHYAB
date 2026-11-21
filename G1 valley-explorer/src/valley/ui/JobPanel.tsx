/**
 * Shared hands-on activity used by the three interest levels. Required steps are done in order;
 * extra steps unlock after the first step. "Leave" is always available and never penalised.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { canFinish, stepAvailable, type Job } from '../core/levels/machine';
import type { TaskDef } from '../core/tasks';
import { Button, Card, Pill, Tap } from './components';
import { CheckIcon, LockIcon, TaskGlyph } from './icons';
import { colors, radius, space, TOUCH, type } from './theme';

const WORK_MS = 380;

export function JobPanel({ task, job, onStep, onFinish, onLeave, finishLabel = 'Finish', footerNote }: {
  task: TaskDef; job: Job; onStep: (id: string) => void; onFinish: () => void; onLeave: () => void; finishLabel?: string; footerNote?: string;
}) {
  const [working, setWorking] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const ready = canFinish(task, job);

  const press = (id: string) => {
    if (working) return; // one step at a time; also blocks rapid double taps
    setWorking(id);
    timer.current = setTimeout(() => { setWorking(null); onStep(id); }, WORK_MS);
  };

  return (
    <View style={{ gap: space.md }}>
      <Card style={st.head}>
        <View style={[st.glyphBox, { backgroundColor: `${task.tint}22` }]}><TaskGlyph glyph={task.glyph} size={48} color={task.tint} /></View>
        <View style={{ flex: 1 }}>
          <Text style={type.subtitle}>{task.place}</Text>
          <Text style={type.small}>{task.blurb}</Text>
        </View>
      </Card>
      {task.steps.map((step) => {
        const done = job.done.includes(step.id);
        const avail = stepAvailable(task, job, step);
        return (
          <Tap key={step.id} onPress={() => press(step.id)} disabled={!avail || !!working} dim={!avail && !done} testID={`step-${step.id}`}
            accessibilityLabel={`${step.label}${step.optional ? ', extra step' : ''}${done ? ', done' : avail ? '' : ', not available yet'}`}
            style={[st.step, done && st.stepDone, step.optional && !done && st.stepExtra]}>
            <View style={[st.tick, done && { backgroundColor: colors.successSoft, borderColor: colors.success }]}>
              {done ? <CheckIcon /> : avail ? null : <LockIcon />}
            </View>
            <Text style={[type.body, { flex: 1 }, done && { color: colors.inkMuted }]}>{step.label}</Text>
            {step.optional ? <Pill text="EXTRA" tone="accent" /> : null}
            {working === step.id ? <WorkBar /> : null}
          </Tap>
        );
      })}
      {footerNote ? <Text style={type.small}>{footerNote}</Text> : null}
      <View style={{ gap: space.sm }}>
        <Button label={finishLabel} onPress={onFinish} disabled={!ready || !!working} testID="job-finish" />
        <Button label={ready ? 'Leave now' : 'Leave this activity'} variant="ghost" onPress={onLeave} disabled={!!working} testID="job-leave" />
      </View>
    </View>
  );
}

function WorkBar() {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => { Animated.timing(v, { toValue: 1, duration: WORK_MS, useNativeDriver: true }).start(); }, [v]);
  return <Animated.View style={[st.workBar, { transform: [{ scaleX: v }] }]} />;
}

const st = StyleSheet.create({
  head: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  glyphBox: { width: 64, height: 64, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  step: { minHeight: TOUCH + 8, flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: space.lg, paddingVertical: space.md, overflow: 'hidden' },
  stepDone: { backgroundColor: colors.surfaceAlt },
  stepExtra: { borderStyle: 'dashed', borderColor: colors.accent },
  tick: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  workBar: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, backgroundColor: colors.primary, transformOrigin: 'left' },
});

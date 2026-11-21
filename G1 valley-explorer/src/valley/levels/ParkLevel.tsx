/** Level 7 — Riverside Park Day. Talk to Mayor Saima to pick a role, then work at any site for 3 phases × 3 shifts. */
import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { parkMission, PARK_PHASES, PARK_SHIFTS } from '../core/levels/interestLevels';
import { ALL_TASKS, PARK_ROLES } from '../core/tasks';
import type { Pos } from '../game/engine/tilemap';
import { World, type WorldMessage } from '../game/engine/World';
import { Hud } from '../game/Hud';
import { parkMap, PARK_START } from '../game/maps';
import { MiniGameStage } from '../game/minigames/MiniGameStage';
import { Button, Sheet, Tap } from '../ui/components';
import { CheckIcon } from '../ui/icons';
import { colors, radius, space, TOUCH, type } from '../ui/theme';
import { useLevel } from '../ui/useLevel';
import type { LevelProps } from './types';

export function ParkLevel({ session, onComplete, onBack, look, coins }: LevelProps) {
  const { state, dispatch } = useLevel(session, parkMission, onComplete);
  const [message, setMessage] = useState<WorldMessage | null | undefined>(undefined);
  const [roles, setRoles] = useState(false);
  const last = useRef<Pos>(PARK_START);
  const [spawn, setSpawn] = useState<{ p: Pos; k: number }>({ p: PARK_START, k: 0 });
  const setStart = (p: Pos) => setSpawn((sp) => ({ p, k: sp.k + 1 }));
  const needMayor = !state || state.role === null || state.phaseBreak;
  const map = useMemo(() => parkMap(needMayor, !!state?.job), [needMayor, state?.job]);
  if (!state) return null;
  const phase = PARK_PHASES[Math.min(state.phase, PARK_PHASES.length - 1)];
  const sub = `${phase} phase · shift ${state.shift + 1} of ${PARK_SHIFTS}${state.role ? ` · ${PARK_ROLES.find((r) => r.id === state.role)?.label}` : ''}`;

  if (state.job) {
    return <MiniGameStage task={ALL_TASKS[state.job.taskId]} job={state.job} sub={sub} coins={coins}
      onStep={(id) => dispatch({ type: 'STEP', stepId: id })}
      onFinish={() => { dispatch({ type: 'FINISH_JOB' }); setStart({ ...last.current }); }}
      onLeave={() => { dispatch({ type: 'LEAVE_JOB' }); setStart({ ...last.current }); }} finishLabel="Finish this shift" />;
  }

  const intro: WorldMessage | null = message === undefined && state.role === null
    ? { speaker: 'mayor', text: 'Welcome! I am Mayor Saima. We are reopening Riverside Park today. Come and talk to me to choose your role.' }
    : message === undefined && state.phaseBreak
      ? { speaker: 'mayor', text: `The ${PARK_PHASES[state.phase - 1]} phase is done — thank you! Talk to me before the next phase.` }
      : message ?? null;

  return (
    <>
      <World key={`spawn-${spawn.k}`} map={map} start={spawn.p} look={look} message={intro} onDismiss={() => setMessage(null)} onMove={(p) => { last.current = p; }}
        onAction={(o) => {
          if (o.id === 'mayor') { setMessage(null); setRoles(true); return; }
          if (needMayor) { setMessage({ speaker: 'mayor', text: 'Come and talk to me first!' }); return; }
          dispatch({ type: 'PICK', taskId: o.id.slice('site:'.length) });
        }}
        hud={<Hud title="Riverside Park Day" sub={sub} coins={coins} onBack={onBack} backLabel="Back to the valley (progress saved)" />} />
      <Sheet visible={roles} title={state.role === null ? 'Choose your role' : state.phaseBreak ? 'Keep your role or switch?' : 'Your role'} onClose={() => setRoles(false)}
        actions={state.role !== null ? (
          <Button label={state.phaseBreak ? `Start the ${phase} phase` : 'Back to work'} testID="park-continue"
            onPress={() => { if (state.phaseBreak) dispatch({ type: 'CONTINUE' }); setRoles(false); setMessage({ speaker: 'mayor', text: 'Tap any site to walk there and start working.' }); }} />
        ) : <Text style={type.small}>Every role helps. You can work at any site whatever you pick.</Text>}>
        <View style={{ gap: space.sm }}>
          {PARK_ROLES.map((r) => {
            const sel = state.role === r.id;
            const canSet = state.role === null || state.phaseBreak;
            return (
              <Tap key={r.id} testID={`role-${r.id}`} disabled={!canSet && !sel} onPress={() => {
                dispatch({ type: 'ROLE', role: r.id });
                if (state.role === null) { setRoles(false); setMessage({ speaker: 'mayor', text: `Great, a ${r.label}! Now tap any site to walk there and start working — any site is fine.` }); }
              }} accessibilityState={{ selected: sel }} accessibilityLabel={`${r.label}. ${r.description}`} style={[st.role, sel && st.roleSel]}>
                <View style={{ flex: 1 }}><Text style={type.subtitle}>{r.label}</Text><Text style={type.small}>{r.description}</Text></View>
                {sel ? <CheckIcon size={22} /> : null}
              </Tap>
            );
          })}
        </View>
      </Sheet>
    </>
  );
}

const st = StyleSheet.create({
  role: { minHeight: TOUCH, flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 2, borderColor: colors.border, paddingHorizontal: space.md, paddingVertical: space.sm },
  roleSel: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
});

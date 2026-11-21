/** Level 6 — The Pattern Gate (abstract reasoning: what comes next?). */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polygon, Rect } from 'react-native-svg';
import { patternGate } from '../core/levels/abilityLevel';
import { PATTERN_ITEMS, type Panel } from '../core/items/patternGate';
import { AbilityFrame } from '../ui/AbilityFrame';
import { Card, Tap } from '../ui/components';
import { colors, radius, space, type, useLandscape } from '../ui/theme';
import { useLevel } from '../ui/useLevel';
import { PopIn } from '../ui/PopIn';
import type { LevelProps } from './types';

const INK = '#2F4858';

function Shape({ shape, filled, x, y, r }: { shape: Panel['shape']; filled: boolean; x: number; y: number; r: number }) {
  const p = { fill: filled ? INK : 'none', stroke: INK, strokeWidth: 2.4 };
  if (shape === 'circle') return <Circle cx={x} cy={y} r={r} {...p} />;
  if (shape === 'square') return <Rect x={x - r} y={y - r} width={2 * r} height={2 * r} {...p} />;
  if (shape === 'triangle') return <Polygon points={`${x},${y - r} ${x + r},${y + r} ${x - r},${y + r}`} {...p} />;
  return <Polygon points={`${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`} {...p} />;
}

/** Up to 6 shapes laid out on a 3×2 grid inside a 60×60 stone. */
export function Stone({ panel, size }: { panel: Panel; size: number }) {
  // dice-style layouts with clear gaps so counts are easy to read (shapes never touch)
  const LAYOUTS: number[][][] = [[], [[30, 30]], [[17, 30], [43, 30]], [[30, 16], [16, 44], [44, 44]],
    [[17, 17], [43, 17], [17, 43], [43, 43]], [[14, 14], [46, 14], [30, 30], [14, 46], [46, 46]],
    [[12, 17], [30, 17], [48, 17], [12, 43], [30, 43], [48, 43]]];
  const order = LAYOUTS[Math.max(1, Math.min(6, panel.count))];
  const r = panel.count <= 2 ? 10 : panel.count <= 4 ? 8 : 6.5;
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60">
      {order.map(([x, y], i) => <Shape key={i} shape={panel.shape} filled={panel.filled} x={x} y={y} r={r} />)}
    </Svg>
  );
}

const describe = (p: Panel) => `${p.count} ${p.filled ? 'solid' : 'outline'} ${p.shape}${p.count > 1 ? 's' : ''}`;

export function PatternGateLevel({ session, onComplete, onBack, coins }: LevelProps) {
  const { state, dispatch } = useLevel(session, patternGate, onComplete);
  const landscape = useLandscape();
  if (!state) return null;
  const item = PATTERN_ITEMS[state.index];
  const choice = state.draft as number | null;
  const letters = ['A', 'B', 'C', 'D'];

  return (
    <AbilityFrame coins={coins} scene="#E2E0DA" submitLabel="Open the gate" title="The Pattern Gate" state={state} scoredCount={PATTERN_ITEMS.length - 1} practice={item.practice} hint={item.hint}
      intro="The gate opens with the right stone. Look at how the four stones change from left to right, then pick the stone that comes next."
      canSubmit={choice !== null} onSubmit={() => dispatch({ type: 'SUBMIT', response: choice })} onHint={() => dispatch({ type: 'HINT' })}
      onSkip={() => dispatch({ type: 'SKIP' })} onNext={() => dispatch({ type: 'NEXT' })} onRetry={() => dispatch({ type: 'RETRY' })} onBack={onBack}
      explanation={`${item.rule} So the next stone is ${letters[item.correctIndex]}.`}>
      <Card style={{ gap: space.sm, backgroundColor: '#7E8790', borderColor: '#5E6770' }}>
        <Text style={[type.label, { color: '#FFFFFF' }]}>THE GATE</Text>
        <View style={st.row} accessibilityLabel={`Sequence: ${item.sequence.map(describe).join(', then ')}, then what?`}>
          {item.sequence.map((p, i) => <View key={i} style={st.stone}><Stone panel={p} size={56} /></View>)}
          <View style={[st.stone, st.mystery]} testID="gate-slot">{choice !== null ? <PopIn id={choice}><Stone panel={item.options[choice]} size={56} /></PopIn> : <Text style={[type.display, { color: colors.accent }]}>?</Text>}</View>
        </View>
      </Card>
      <Text style={type.subtitle}>Which stone comes next?</Text>
      <View style={st.grid}>
        {item.options.map((p, i) => {
          const sel = choice === i;
          return (
            <Tap key={i} testID={`pat-opt-${i}`} onPress={() => dispatch({ type: 'DRAFT', draft: i })} accessibilityState={{ selected: sel }}
              accessibilityLabel={`Stone ${letters[i]}: ${describe(p)}${sel ? ', selected' : ''}`} style={[st.opt, landscape && { width: '23%' }, sel && st.optSel]}>
              <Text style={[type.label, sel && { color: colors.primaryDark }]}>{letters[i]}</Text>
              <Stone panel={p} size={84} />
            </Tap>
          );
        })}
      </View>
    </AbilityFrame>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  stone: { flex: 1, aspectRatio: 1, borderRadius: radius.sm, backgroundColor: '#ECE4D6', alignItems: 'center', justifyContent: 'center' },
  mystery: { backgroundColor: colors.accentSoft, borderWidth: 2, borderColor: colors.accent, borderStyle: 'dashed' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, justifyContent: 'space-between' },
  opt: { width: '47.5%', alignItems: 'center', gap: space.xs, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 3, borderColor: colors.border, paddingVertical: space.md },
  optSel: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
});

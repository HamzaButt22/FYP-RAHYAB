/** Level 8 — The Vault Locks (logical reasoning). Untimed: the original countdown, gambles and lasers are gone. */
import React, { useEffect, useRef, useState } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { vaultLocks } from '../core/levels/abilityLevel';
import { LOCK_ITEMS, type Clue } from '../core/items/vaultLocks';
import { AbilityFrame } from '../ui/AbilityFrame';
import { Card, Tap } from '../ui/components';
import { colors, radius, space, TOUCH, type, useLandscape } from '../ui/theme';
import { useLevel } from '../ui/useLevel';
import { PopIn } from '../ui/PopIn';
import type { LevelProps } from './types';

const plural = (n: number, w: string) => (n === 0 ? `no ${w}s` : n === 1 ? `1 ${w}` : `${n} ${w}s`);
export function clueText(c: Clue): string {
  if (c.rightPlace === 0 && c.wrongPlace === 0) return 'None of these numbers are in the code.';
  const parts: string[] = [];
  if (c.rightPlace) parts.push(`${plural(c.rightPlace, 'number')} right and in the right place`);
  if (c.wrongPlace) parts.push(`${plural(c.wrongPlace, 'number')} right but in the wrong place`);
  return `${parts.join('; ')}.`.replace(/^./, (m) => m.toUpperCase());
}

export function VaultLocksLevel({ session, onComplete, onBack, coins }: LevelProps) {
  const { state, dispatch } = useLevel(session, vaultLocks, onComplete);
  const landscape = useLandscape();
  if (!state) return null;
  const item = LOCK_ITEMS[state.index];
  const code = (state.draft as number[]) ?? [1, 2, 3];
  const set = (pos: number, delta: number) => {
    const next = code.slice();
    next[pos] = ((next[pos] - 1 + delta + 6) % 6) + 1;
    dispatch({ type: 'DRAFT', draft: next });
  };
  const repeats = new Set(code).size < 3;

  return (
    <AbilityFrame coins={coins} scene="#D9D4E3" submitLabel="Pull the lever" title="The Vault Locks" state={state} scoredCount={LOCK_ITEMS.length - 1} practice={item.practice} hint={item.hint}
      intro="Each lock has a 3-number code using the numbers 1 to 6. No number is used twice. Read the clues, set the dials and check your answer. There is no timer."
      canSubmit={!repeats} onSubmit={() => dispatch({ type: 'SUBMIT', response: code })} onHint={() => dispatch({ type: 'HINT' })}
      onSkip={() => dispatch({ type: 'SKIP' })} onNext={() => dispatch({ type: 'NEXT' })} onRetry={() => dispatch({ type: 'RETRY' })} onBack={onBack}
      explanation={`The code is ${item.answer.join(' ')}. Every clue fits this code and no other.`} solvedArt={<OpenVault />}>
      <View style={landscape ? { flexDirection: 'row', gap: space.md, alignItems: 'stretch' } : { gap: space.md }}>
        <Card style={{ gap: space.md, flex: landscape ? 1 : undefined }}>
          <Text style={type.label}>CLUES</Text>
          {item.clues.map((c, i) => (
            <View key={i} style={st.clue} accessibilityLabel={`Clue ${i + 1}: ${c.guess.join(' ')}. ${clueText(c)}`}>
              <View style={st.guess}>{c.guess.map((d, k) => <Text key={k} style={st.guessDigit}>{d}</Text>)}</View>
              <Text style={[type.body, { flex: 1 }]}>{clueText(c)}</Text>
            </View>
          ))}
        </Card>
        <View style={{ gap: space.sm, flex: landscape ? 1 : undefined }}>
          {landscape ? null : <Text style={type.subtitle}>Set the code</Text>}
          <View style={[st.door, landscape && { padding: space.md, flex: 1, justifyContent: 'center' }]}>
            <View style={st.dials}>
              {code.map((d, pos) => <Dial key={pos} pos={pos} value={d} onChange={(delta) => set(pos, delta)} />)}
            </View>
            <Text style={[type.small, { color: '#E8D9B5', textAlign: 'center' }]}>Swipe a dial up or down, or use the arrows</Text>
          </View>
          {repeats ? <Text style={[type.small, { color: colors.caution, textAlign: 'center' }]}>Each number can be used only once.</Text> : null}
        </View>
      </View>
    </AbilityFrame>
  );
}

const st = StyleSheet.create({
  clue: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  guess: { flexDirection: 'row', gap: 4 },
  guessDigit: { width: 30, height: 36, textAlign: 'center', textAlignVertical: 'center', lineHeight: 36, fontSize: 20, fontWeight: '800', color: colors.ink, backgroundColor: colors.surfaceAlt, borderRadius: 6, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  door: { backgroundColor: '#4A4458', borderRadius: radius.lg, padding: space.lg, gap: space.sm, borderWidth: 6, borderColor: '#6B6380' },
  dials: { flexDirection: 'row', justifyContent: 'center', gap: space.lg },
  dial: { alignItems: 'center', backgroundColor: '#2F3E46', borderRadius: radius.md, paddingVertical: space.sm, width: 84 },
  dialBtn: { width: TOUCH + 12, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  arrow: { color: '#E8D9B5', fontSize: 22 },
  digit: { color: '#FFFFFF', fontSize: 40, fontWeight: '800', marginVertical: space.xs },
});

/** One code dial: swipe up/down (or tap the arrows) to change the number. */
function Dial({ pos, value, onChange }: { pos: number; value: number; onChange: (delta: number) => void }) {
  const cb = useRef(onChange);
  useEffect(() => { cb.current = onChange; });
  // The ref is read only inside gesture callbacks, never during render (lint false positive for this pattern).
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 8,
    onPanResponderRelease: (_e, g) => { if (g.dy < -18) cb.current(1); else if (g.dy > 18) cb.current(-1); },
  }));
  return (
    <View style={st.dial} {...responder.panHandlers}>
      <Tap testID={`dial-${pos}-up`} onPress={() => onChange(1)} accessibilityLabel={`Dial ${pos + 1} up`} style={st.dialBtn}><Text style={st.arrow}>▲</Text></Tap>
      <PopIn id={value}><Text style={st.digit} accessibilityLabel={`Dial ${pos + 1} shows ${value}`}>{value}</Text></PopIn>
      <Tap testID={`dial-${pos}-down`} onPress={() => onChange(-1)} accessibilityLabel={`Dial ${pos + 1} down`} style={st.dialBtn}><Text style={st.arrow}>▼</Text></Tap>
    </View>
  );
}

function OpenVault() {
  return (
    <Svg width={140} height={100} viewBox="0 0 140 100">
      <Rect x={10} y={10} width={80} height={80} rx={8} fill="#4A4458" />
      <Rect x={18} y={18} width={64} height={64} rx={6} fill="#F3C34D" />
      <Circle cx={40} cy={50} r={8} fill="#E3B23C" /><Circle cx={60} cy={44} r={8} fill="#E3B23C" /><Circle cx={56} cy={62} r={8} fill="#E3B23C" />
      <Path d="M90 12 L128 22 L128 78 L90 88z" fill="#6B6380" />
      <Circle cx={112} cy={50} r={9} fill="#2F3E46" />
    </Svg>
  );
}

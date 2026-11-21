/** Level 5 — The Map Room (spatial reasoning: which piece is the same map, only turned?). */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { mapRoom } from '../core/levels/abilityLevel';
import { MAP_ITEMS, mapOptions, type Grid } from '../core/items/mapRoom';
import { AbilityFrame } from '../ui/AbilityFrame';
import { Card, Tap } from '../ui/components';
import { colors, radius, space, type, useLandscape } from '../ui/theme';
import { useLevel } from '../ui/useLevel';
import { PopIn } from '../ui/PopIn';
import type { LevelProps } from './types';

export function MapTile({ grid, size }: { grid: Grid; size: number }) {
  const n = grid.length;
  const cell = (size - (n + 1) * 2) / n;
  return (
    <View style={[st.tile, { width: size, height: size }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {grid.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: 2 }}>
          {row.split('').map((c, k) => (
            <View key={k} style={{ width: cell, height: cell, borderRadius: 3, backgroundColor: c === '#' ? colors.hillDark : colors.river }}>
              {c === '#' ? <View style={st.tree} /> : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function MapRoomLevel({ session, onComplete, onBack, coins }: LevelProps) {
  const { state, dispatch } = useLevel(session, mapRoom, onComplete);
  const landscape = useLandscape();
  if (!state) return null;
  const item = MAP_ITEMS[state.index];
  const opts = mapOptions(item);
  const choice = state.draft as number | null;
  const letters = ['A', 'B', 'C', 'D'];

  return (
    <AbilityFrame coins={coins} scene="#DCE8EE" submitLabel="Place this piece" title="The Map Room" state={state} scoredCount={MAP_ITEMS.length - 1} practice={item.practice} hint={item.hint}
      intro="Torn map pieces lie on the table. Exactly one of the four pieces is the same as the top piece, only turned around. The others are flipped like in a mirror."
      canSubmit={choice !== null} onSubmit={() => dispatch({ type: 'SUBMIT', response: choice })} onHint={() => dispatch({ type: 'HINT' })}
      onSkip={() => dispatch({ type: 'SKIP' })} onNext={() => dispatch({ type: 'NEXT' })} onRetry={() => dispatch({ type: 'RETRY' })} onBack={onBack}
      explanation={`Piece ${letters[item.correctIndex]} is the same map turned ${item.turns === 2 ? 'half way round' : item.turns === 1 ? 'a quarter turn to the right' : 'a quarter turn to the left'}. The other pieces are mirror images, which can never be turned to match.`}>
      <Card style={st.table}>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={type.label}>TORN MAP</Text>
          <MapTile grid={item.pattern} size={124} />
        </View>
        <Text style={[type.title, { color: colors.inkMuted }]}>=</Text>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={type.label}>YOUR PIECE</Text>
          <View style={st.slot} testID="map-slot">
            {choice !== null ? <PopIn id={choice}><MapTile grid={opts[choice]} size={116} /></PopIn> : <Text style={[type.small, { textAlign: 'center' }]}>Tap a piece below</Text>}
          </View>
        </View>
      </Card>
      <Text style={type.subtitle}>Which piece is the same, only turned?</Text>
      <View style={st.grid}>
        {opts.map((g, i) => {
          const sel = choice === i;
          return (
            <Tap key={i} testID={`map-opt-${i}`} onPress={() => dispatch({ type: 'DRAFT', draft: i })} accessibilityState={{ selected: sel }}
              accessibilityLabel={`Piece ${letters[i]}${sel ? ', selected' : ''}`} style={[st.opt, landscape && { width: '23%' }, sel && st.optSel]}>
              <Text style={[type.label, sel && { color: colors.primaryDark }]}>{letters[i]}</Text>
              <MapTile grid={g} size={landscape ? 84 : 112} />
            </Tap>
          );
        })}
      </View>
    </AbilityFrame>
  );
}

const st = StyleSheet.create({
  table: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#C9A97E', borderColor: '#8A5A3B' },
  slot: { width: 124, height: 124, borderRadius: radius.sm, borderWidth: 3, borderStyle: 'dashed', borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', padding: 4 },
  tile: { backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, padding: 2, gap: 2 },
  tree: { position: 'absolute', left: '30%', top: '25%', width: '40%', height: '40%', borderRadius: 99, backgroundColor: '#477A55' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, justifyContent: 'space-between' },
  opt: { width: '47.5%', alignItems: 'center', gap: space.xs, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 3, borderColor: colors.border, paddingVertical: space.md },
  optSel: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
});

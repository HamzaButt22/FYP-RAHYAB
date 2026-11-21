/** Top bar used by every game scene: back, title, coins, stamps, and optional extra info. */
import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Tap } from '../ui/components';
import { BackIcon, CoinIcon, StarIcon } from '../ui/icons';
import { colors, radius, space } from '../ui/theme';

export function Hud({ title, sub, coins, stamps, onBack, backLabel = 'Back', right }: {
  title: string; sub?: string; coins?: number; stamps?: string; onBack?: () => void; backLabel?: string; right?: React.ReactNode;
}) {
  const { width: w, height: h } = useWindowDimensions();
  const compact = w > h; // landscape: thinner bar so the world gets the height
  return (
    <View style={[st.bar, compact && st.compact]}>
      {onBack ? (
        <Tap onPress={onBack} accessibilityLabel={backLabel} style={st.back} testID="hud-back"><BackIcon color="#FFFFFF" /></Tap>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[st.title, compact && { fontSize: 16 }]} numberOfLines={1} accessibilityRole="header">{title}{compact && sub ? <Text style={st.sub}>{'   '}{sub}</Text> : null}</Text>
        {sub && !compact ? <Text style={st.sub} numberOfLines={1}>{sub}</Text> : null}
      </View>
      {stamps ? <View style={st.chip}><StarIcon size={16} color="#F3C34D" /><Text style={st.chipText}>{stamps}</Text></View> : null}
      {coins !== undefined ? <View style={st.chip} accessibilityLabel={`${coins} coins`}><CoinIcon size={16} /><Text style={st.chipText}>{coins}</Text></View> : null}
      {right}
    </View>
  );
}

export function HudButton({ label, onPress, testID }: { label: string; onPress: () => void; testID?: string }) {
  return <Tap onPress={onPress} style={st.hudBtn} accessibilityLabel={label === '⟳' ? 'Rotate the screen' : label} testID={testID}><Text style={st.chipText}>{label}</Text></Tap>;
}

const st = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, paddingVertical: space.sm, backgroundColor: '#2E4A3A' },
  compact: { paddingVertical: 4 },
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  sub: { color: '#CFE3D6', fontSize: 13, fontWeight: '600' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  hudBtn: { minHeight: 40, justifyContent: 'center', backgroundColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: 12 },
});

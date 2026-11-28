import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { MiniGameProps, MiniShell } from './Shell';
import { useTheme } from '@/state/GameProvider';
import { GText } from '@/ui/Text';
import { radius, space } from '@/ui/tokens';
import { audio } from '@/services/audio';
import { feedback } from '@/services/feedback';

const COLOURS = [
  { c: '#5B8DEF', n: 'Blue' }, { c: '#3FAE6A', n: 'Green' }, { c: '#F4A340', n: 'Orange' },
  { c: '#E2589B', n: 'Pink' }, { c: '#FFD166', n: 'Yellow' }, { c: '#8A6FD1', n: 'Purple' },
];
const REGIONS = [
  { id: 'sky', label: 'Sky', d: 'M0 0 H300 V120 H0 Z' },
  { id: 'sun', label: 'Sun', d: 'M240 50 m-26 0 a26 26 0 1 0 52 0 a26 26 0 1 0 -52 0' },
  { id: 'hills', label: 'Hills', d: 'M0 140 Q70 70 150 130 T300 110 V190 H0 Z' },
  { id: 'river', label: 'River', d: 'M0 175 Q80 160 150 178 T300 170 V200 H0 Z' },
  { id: 'house', label: 'House', d: 'M60 110 H120 V160 H60 Z M54 112 L90 82 L126 112 Z' },
  { id: 'tree', label: 'Tree', d: 'M196 100 m-24 0 a24 22 0 1 0 48 0 a24 22 0 1 0 -48 0' },
];

/** Create: choose colours and paint each part of the mural. Any colours are fine. */
export default function PaintMural({ title, partner, onDone }: MiniGameProps) {
  const { c } = useTheme();
  const [brush, setBrush] = useState(COLOURS[0].c);
  const [fills, setFills] = useState<Record<string, string>>({});
  const done = REGIONS.every((r) => fills[r.id]);
  return (
    <MiniShell title={title} partner={partner} instructions="Pick a colour, then tap a part of the wall to paint it. Use any colours you like!" done={done} onDone={onDone}
      progress={`Painted: ${Object.keys(fills).length} of ${REGIONS.length}`}>
      <View style={{ alignSelf: 'center', borderRadius: radius.md, overflow: 'hidden', borderWidth: 4, borderColor: '#C9A26B' }}>
        <Svg width={300} height={200} viewBox="0 0 300 200">
          <Rect x={0} y={0} width={300} height={200} fill="#FFFBF3" />
          {REGIONS.map((r) => (
            <Path key={r.id} d={r.d} fill={fills[r.id] ?? '#FFFBF3'} stroke="#5D5468" strokeWidth={2} strokeDasharray={fills[r.id] ? undefined : '6 4'}
              onPress={() => { setFills((f) => ({ ...f, [r.id]: brush })); audio.play('blip'); feedback.tap(); }} />
          ))}
          <Path d="M84 160 V136 H96 V160" fill="#5D5468" />
          <Rect x={192} y={118} width={8} height={30} fill="#8B6A4E" />
          <Circle cx={240} cy={50} r={1} fill="none" />
        </Svg>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm, marginTop: space.md }}>
        {REGIONS.map((r) => (
          <Pressable key={r.id} accessibilityRole="button" accessibilityLabel={`Paint the ${r.label}${fills[r.id] ? ', painted' : ''}`}
            onPress={() => { setFills((f) => ({ ...f, [r.id]: brush })); audio.play('blip'); }}
            style={{ minHeight: 40, paddingHorizontal: 10, borderRadius: radius.pill, justifyContent: 'center', borderWidth: 2, borderColor: c.border, backgroundColor: fills[r.id] ?? c.surfaceRaised }}>
            <GText variant="label" color={fills[r.id] ? '#FFFFFF' : c.text}>{r.label}</GText>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.sm, marginTop: space.md }}>
        {COLOURS.map((col) => (
          <Pressable key={col.c} accessibilityRole="button" accessibilityLabel={`${col.n} paint`} accessibilityState={{ selected: brush === col.c }}
            onPress={() => { setBrush(col.c); audio.play('select', 0.4); }}
            style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: col.c, borderWidth: brush === col.c ? 5 : 2, borderColor: brush === col.c ? c.text : '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
            {brush === col.c ? <GText variant="label" color="#FFFFFF">✓</GText> : null}
          </Pressable>
        ))}
      </View>
    </MiniShell>
  );
}

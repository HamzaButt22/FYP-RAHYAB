import { Pressable, View } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { ChoicePuzzle } from '@/assessment/abilities/puzzleTypes';
import { ViewProps } from './PuzzleRunner';
import { GText } from '@/ui/Text';
import { Icon } from '@/ui/Icon';
import { useTheme } from '@/state/GameProvider';
import { elevation, radius, space } from '@/ui/tokens';
import { feedback } from '@/services/feedback';

/** LOG / VRB: read carefully and choose one answer. */
export function ChoiceView({ puzzle, onAnswer, tried, locked, reveal, solved }: ViewProps<ChoicePuzzle>) {
  const { c } = useTheme();
  return (
    <View style={{ gap: space.sm }}>
      {puzzle.visual ? <View style={{ alignSelf: 'center' }}><Visual kind={puzzle.visual} /></View> : null}
      {puzzle.options.map((o, i) => {
        const wrong = tried.includes(i);
        const right = (solved || reveal) && i === puzzle.answer;
        return (
          <Pressable key={i} accessibilityRole="button" accessibilityLabel={`Option ${'ABCD'[i]}: ${o}${wrong ? ', tried, not correct' : ''}${right ? ', correct answer' : ''}`}
            disabled={locked || wrong} onPress={() => { feedback.tap(); onAnswer({ kind: 'index', value: i }); }}
            style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 56, padding: space.md, borderRadius: radius.md,
              backgroundColor: right ? '#E4F5E9' : c.surfaceRaised, borderWidth: 3, borderColor: right ? c.success : wrong ? c.locked : c.border, opacity: wrong ? 0.5 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }] }, elevation(1)]}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: right ? c.success : c.bgAlt, alignItems: 'center', justifyContent: 'center' }}>
              {wrong ? <Icon name="close" size={18} color={c.locked} /> : right ? <Icon name="check" size={18} color="#FFFFFF" /> : <GText variant="bodyBold">{'ABCD'[i]}</GText>}
            </View>
            <GText style={{ flex: 1 }} color={right ? '#2B2433' : undefined}>{o}</GText>
          </Pressable>
        );
      })}
    </View>
  );
}

function Visual({ kind }: { kind: NonNullable<ChoicePuzzle['visual']> }) {
  const ink = '#2B2433';
  if (kind === 'circuit-series') {
    return (
      <Svg width={260} height={90} accessibilityLabel="Battery, switch A, switch B and a bulb joined in one line">
        <Path d="M20 70 H240 V20 H20 Z" stroke={ink} strokeWidth={3} fill="none" />
        <Rect x={10} y={35} width={20} height={20} fill="#F4A340" stroke={ink} strokeWidth={2} />
        {[90, 150].map((x, i) => <G key={x}><Rect x={x - 18} y={8} width={36} height={24} rx={4} fill="#FFFBF3" stroke={ink} strokeWidth={2} /><SvgText x={x} y={25} fontSize={13} fontWeight="bold" textAnchor="middle" fill={ink}>{i ? 'B' : 'A'}</SvgText></G>)}
        <Circle cx={240} cy={45} r={13} fill="#FFF3C4" stroke={ink} strokeWidth={2.5} />
      </Svg>
    );
  }
  if (kind === 'circuit-parallel') {
    return (
      <Svg width={260} height={110} accessibilityLabel="Two separate paths to the bulbs">
        <Path d="M20 95 H240 M20 95 V15 H240 V95 M20 55 H240" stroke={ink} strokeWidth={3} fill="none" />
        <Rect x={10} y={66} width={20} height={20} fill="#F4A340" stroke={ink} strokeWidth={2} />
        {[[120, 15], [120, 55]].map(([x, y], i) => <G key={i}><Rect x={x - 18} y={y - 12} width={36} height={24} rx={4} fill="#FFFBF3" stroke={ink} strokeWidth={2} /><SvgText x={x} y={y + 5} fontSize={13} fontWeight="bold" textAnchor="middle" fill={ink}>{i ? 'Y' : 'X'}</SvgText></G>)}
        <Circle cx={240} cy={15} r={11} fill="#FFF3C4" stroke={ink} strokeWidth={2.5} />
        <Circle cx={240} cy={55} r={11} fill="#FFF3C4" stroke={ink} strokeWidth={2.5} />
      </Svg>
    );
  }
  if (kind === 'signs') {
    return (
      <Svg width={270} height={70} accessibilityLabel="Three signs, numbered 1, 2 and 3">
        {[0, 1, 2].map((i) => <G key={i}><Rect x={10 + i * 88} y={8} width={76} height={40} rx={6} fill="#FFFBF3" stroke={ink} strokeWidth={2} /><Path d={`M${48 + i * 88} 48 V66`} stroke="#8B6A4E" strokeWidth={4} /><SvgText x={48 + i * 88} y={34} fontSize={18} fontWeight="bold" textAnchor="middle" fill={ink}>{`Sign ${i + 1}`}</SvgText></G>)}
      </Svg>
    );
  }
  return (
    <Svg width={280} height={78} accessibilityLabel="Four houses in a row numbered 1 to 4">
      {[0, 1, 2, 3].map((i) => <G key={i}><Path d={`M${14 + i * 66} 34 L${40 + i * 66} 10 L${66 + i * 66} 34 Z`} fill="#C8553D" /><Rect x={18 + i * 66} y={34} width={44} height={36} fill="#F6D7A7" stroke={ink} strokeWidth={2} /><SvgText x={40 + i * 66} y={60} fontSize={18} fontWeight="bold" textAnchor="middle" fill={ink}>{i + 1}</SvgText></G>)}
    </Svg>
  );
}

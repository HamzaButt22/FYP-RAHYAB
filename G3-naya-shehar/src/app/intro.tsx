import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Screen, Appear, Panel } from '@/ui/Layout';
import { GText } from '@/ui/Text';
import { GameButton } from '@/ui/Button';
import { useGame } from '@/state/GameProvider';
import { space, radius } from '@/ui/tokens';
import { audio } from '@/services/audio';

const SLIDES = [
  { title: 'The flood', text: 'Last year, heavy rain flooded the little town of Naya Shehar. Roads, homes and the school were damaged.' },
  { title: 'A new start', text: 'Now the town has a grant to rebuild. But money is not enough — it needs people with ideas and helping hands.' },
  { title: 'That’s you!', text: 'You are joining the Youth Development Office as a volunteer. Your choices will shape how the town grows.' },
];

function SlideArt({ i }: { i: number }) {
  return (
    <Svg width="100%" height={200} viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice">
      <Rect x={0} y={0} width={320} height={200} fill={i === 0 ? '#8FA6BF' : i === 1 ? '#FFD58A' : '#BFE6FF'} />
      {i === 0 ? Array.from({ length: 30 }, (_, k) => <Path key={k} d={`M${(k * 41) % 320} ${(k * 29) % 120} l-5 14`} stroke="#E8F1F8" strokeWidth={2} />) : <Circle cx={250} cy={50} r={26} fill="#FFD166" />}
      {[30, 90, 150, 210, 260].map((x, k) => (
        <Rect key={x} x={x} y={i === 0 ? 120 + (k % 2) * 6 : 100 - (k % 3) * 12} width={40} height={i === 0 ? 50 : 70 + (k % 3) * 12}
          fill={i === 0 ? '#9C948C' : ['#F6D7A7', '#F2C0A2', '#DDE8C4', '#C9DDEE', '#F1D6E4'][k]} stroke="#7A4E2D" strokeWidth={2} transform={i === 0 && k % 2 ? `rotate(4 ${x} 150)` : undefined} />
      ))}
      <Path d={i === 0 ? 'M0 150 Q80 135 160 152 T320 145 V200 H0 Z' : 'M0 170 Q80 160 160 172 T320 166 V200 H0 Z'} fill={i === 0 ? '#6E8FA8' : '#3FAE6A'} opacity={0.95} />
      {i === 2 ? <Path d="M140 140 q20 -40 40 0 z" fill="#F4A340" /> : null}
      {i === 2 ? <Circle cx={160} cy={118} r={12} fill="#C98E64" /> : null}
      {i === 1 ? <Path d="M120 60 h80 v40 h-80 z" fill="#FFFBF3" stroke="#3FAE6A" strokeWidth={4} /> : null}
      {i === 1 ? <Path d="M135 80 h50 M160 68 v24" stroke="#3FAE6A" strokeWidth={5} /> : null}
    </Svg>
  );
}

export default function Intro() {
  const router = useRouter();
  const { act } = useGame();
  const [i, setI] = useState(0);
  const last = i === SLIDES.length - 1;
  return (
    <Screen footer={
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        {i > 0 ? <GameButton style={{ flex: 1 }} label="Back" variant="ghost" onPress={() => setI(i - 1)} /> : null}
        <GameButton style={{ flex: 2 }} label={last ? 'Create my volunteer' : 'Next'} icon="arrow" onPress={() => {
          audio.play('page');
          if (last) { act((e) => e.markIntroSeen()); router.replace('/avatar'); } else setI(i + 1);
        }} testID="intro-next" />
      </View>
    }>
      <Appear key={i}>
        <View style={{ borderRadius: radius.xl, overflow: 'hidden' }}><SlideArt i={i} /></View>
      </Appear>
      <Appear key={`t${i}`} delay={120}>
        <Panel title={SLIDES[i].title} speak={`${SLIDES[i].title}. ${SLIDES[i].text}`}>
          <GText variant="sub">{SLIDES[i].text}</GText>
        </Panel>
      </Appear>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }} accessible accessibilityLabel={`Page ${i + 1} of ${SLIDES.length}`}>
        {SLIDES.map((_, k) => <View key={k} style={{ width: k === i ? 26 : 10, height: 10, borderRadius: 5, backgroundColor: k === i ? '#F4A340' : '#EAD8BC' }} />)}
      </View>
    </Screen>
  );
}

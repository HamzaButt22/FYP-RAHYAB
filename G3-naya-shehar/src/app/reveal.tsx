import { useEffect, useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { TownMap, MAP_W, MAP_H } from '@/art/TownMap';
import { GText } from '@/ui/Text';
import { GameButton } from '@/ui/Button';
import { SpeakButton } from '@/ui/Speak';
import { Appear } from '@/ui/Layout';
import { useGame, useTheme } from '@/state/GameProvider';
import { space } from '@/ui/tokens';
import { audio } from '@/services/audio';
import { BUILDINGS, stageOf } from '@/game/world/buildings';

function Firework({ x, y, delay, colour }: { x: number; y: number; delay: number; colour: string }) {
  const v = useSharedValue(0);
  useEffect(() => { v.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1)); }, [delay, v]);
  const sparks = useMemo(() => Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2), []);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x, top: y }}>
      {sparks.map((a) => <Spark key={a} angle={a} v={v} colour={colour} />)}
    </View>
  );
}
function Spark({ angle, v, colour }: { angle: number; v: ReturnType<typeof useSharedValue<number>>; colour: string }) {
  const st = useAnimatedStyle(() => ({ opacity: 1 - v.value, transform: [{ translateX: Math.cos(angle) * 46 * v.value }, { translateY: Math.sin(angle) * 46 * v.value + v.value * v.value * 18 }] }));
  return <Animated.View style={[{ position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: colour }, st]} />;
}

/** Final town reveal: the whole rebuilt town at night, lanterns and fireworks for the Mela. */
export default function Reveal() {
  const { s } = useGame();
  const { reducedMotion } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const scale = Math.min(width / MAP_W, (height * 0.62) / MAP_H) * 1.05;
  const zoom = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    audio.play('fanfare');
    if (!reducedMotion) zoom.value = withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.cubic) });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const st = useAnimatedStyle(() => ({ transform: [{ scale: scale * (1.8 - 0.8 * zoom.value) }] }));
  const open = BUILDINGS.filter((b) => stageOf(s.town.progress[b.id]) === 4).length;
  return (
    <View style={{ flex: 1, backgroundColor: '#1B2340' }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <Animated.View style={[{ width: MAP_W, height: MAP_H }, st]}>
          <TownMap town={s.town} week={4} season={4} reducedMotion={reducedMotion} festive night />
        </Animated.View>
        {!reducedMotion ? <>
          <Firework x={width * 0.2} y={insets.top + 80} delay={300} colour="#FFD166" />
          <Firework x={width * 0.75} y={insets.top + 60} delay={900} colour="#E2589B" />
          <Firework x={width * 0.5} y={insets.top + 130} delay={1500} colour="#6EC6E6" />
        </> : null}
      </View>
      <View style={{ padding: space.lg, paddingBottom: insets.bottom + space.lg, gap: space.md }}>
        <Appear delay={reducedMotion ? 0 : 1800}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <View style={{ flex: 1 }}>
              <GText variant="title" color="#FFFFFF">Naya Shehar is reborn!</GText>
              <GText color="#E6DCEF">{`${open} buildings open · ${s.town.homes} homes rebuilt · one very happy town`}</GText>
            </View>
            <SpeakButton text={`Naya Shehar is reborn! ${open} buildings are open and ${s.town.homes} homes are rebuilt.`} />
          </View>
        </Appear>
        <GameButton label="See your story" icon="arrow" size="lg" onPress={() => router.replace('/summary')} testID="reveal-next" />
      </View>
    </View>
  );
}

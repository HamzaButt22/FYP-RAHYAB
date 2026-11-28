import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Emblem } from '@/art/Logo';
import { Screen, Appear, Panel } from '@/ui/Layout';
import { GText } from '@/ui/Text';
import { GameButton } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { SpeakButton } from '@/ui/Speak';
import { useTheme } from '@/state/GameProvider';
import { space } from '@/ui/tokens';

const TEXT = 'Welcome to Naya Shehar! Help a small town rebuild after a flood. Fix buildings, help people, solve puzzles and plan a big festival. Play one week at a time. There is no sign in, and your game is saved on this phone.';

export default function Welcome() {
  const router = useRouter();
  const { c } = useTheme();
  return (
    <Screen footer={<GameButton label="Begin the story" icon="play" size="lg" onPress={() => router.push('/intro')} testID="welcome-start" />}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}><SpeakButton text={TEXT} /></View>
      <Appear style={{ alignItems: 'center', gap: space.sm }}>
        <Emblem size={170} />
        <GText variant="hero" center>Naya Shehar</GText>
        <GText variant="sub" center soft>Build your town. Shape your future.</GText>
      </Appear>
      <Appear delay={200}>
        <Panel>
          {[
            ['home', 'Rebuild a Pakistani town after the flood.'],
            ['hands', 'Help people and choose the jobs you like.'],
            ['sparkle', 'Solve puzzles — no timers, ever.'],
            ['calendar', 'Play one week at a time: 4 seasons in total.'],
            ['lock', 'No sign-in. Your game is saved on this phone.'],
          ].map(([i, t]) => (
            <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 4 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.bgAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name={i as 'home'} color={c.primaryDeep} /></View>
              <GText style={{ flex: 1 }}>{t}</GText>
            </View>
          ))}
        </Panel>
      </Appear>
    </Screen>
  );
}

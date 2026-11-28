import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { GText } from '@/ui/Text';
import { GameButton } from '@/ui/Button';
import { SpeakButton } from '@/ui/Speak';
import { Appear } from '@/ui/Layout';
import { useGame, useTheme } from '@/state/GameProvider';
import { elevation, radius, space } from '@/ui/tokens';
import { speech } from '@/services/feedback';

/** Pause menu (modal). Progress is already saved, so leaving is always safe. */
export default function Pause() {
  const router = useRouter();
  const { c } = useTheme();
  const { s } = useGame();
  const close = () => { speech.stop(); router.back(); };
  return (
    <View style={{ flex: 1, backgroundColor: c.overlay, justifyContent: 'center', padding: space.lg }}>
      <Pressable accessibilityLabel="Close pause menu" style={{ position: 'absolute', inset: 0 }} onPress={close} />
      <Appear>
        <View style={[{ backgroundColor: c.surface, borderRadius: radius.xl, padding: space.xl, gap: space.md, borderWidth: 2, borderColor: c.border }, elevation(3)]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <GText variant="title" style={{ flex: 1 }} accessibilityRole="header">Paused</GText>
            <SpeakButton text="Paused. Your progress is saved. You can resume, change settings, or go to the town." />
          </View>
          <GText soft>Your progress is saved. Take a break whenever you like.</GText>
          <GameButton label="Resume" icon="play" onPress={close} testID="resume" />
          <GameButton label="Accessibility" icon="access" variant="ghost" onPress={() => router.push('/accessibility')} />
          <GameButton label="Settings" icon="gear" variant="ghost" onPress={() => router.push('/settings')} />
          {s.session ? <GameButton label="Leave to the town" icon="map" variant="ghost" onPress={() => { router.dismissAll(); router.replace('/town'); }} /> : null}
          <GameButton label="Main menu" icon="home" variant="quiet" onPress={() => { router.dismissAll(); router.replace('/menu'); }} />
        </View>
      </Appear>
    </View>
  );
}

import { View } from 'react-native';
import { GText } from '@/ui/Text';
import { SpeakButton } from '@/ui/Speak';
import { GameButton } from '@/ui/Button';
import { Appear } from '@/ui/Layout';
import { useTheme } from '@/state/GameProvider';
import { Portrait, lookForCharacter } from '@/art/Bust';
import { CharacterId, CHARACTERS } from '@/game/characters/characters';
import { elevation, radius, space } from '@/ui/tokens';

export interface MiniGameProps { title: string; partner: CharacterId; onDone: () => void; seed: number }

/** Common frame for every activity mini-game. These are NOT scored. */
export function MiniShell({ title, partner, instructions, done, onDone, children, progress }: {
  title: string; partner: CharacterId; instructions: string; done: boolean; onDone: () => void; children: React.ReactNode; progress?: string;
}) {
  const { c, reducedMotion } = useTheme();
  return (
    <View style={{ gap: space.md }}>
      <View style={[{ flexDirection: 'row', gap: space.sm, alignItems: 'center', backgroundColor: c.surface, borderRadius: radius.lg, padding: space.md, borderWidth: 2, borderColor: c.border }, elevation(1)]}>
        <Portrait look={lookForCharacter(partner)} expression={done ? 'proud' : 'happy'} size={56} reducedMotion={reducedMotion} />
        <View style={{ flex: 1 }}>
          <GText variant="label" color={c.primaryDeep}>WITH {CHARACTERS[partner].name.toUpperCase()}</GText>
          <GText variant="sub">{title}</GText>
          <GText variant="small" soft>{instructions}</GText>
        </View>
        <SpeakButton text={`${title}. ${instructions}`} size={44} />
      </View>
      {progress ? <GText variant="label" center soft>{progress}</GText> : null}
      <View>{children}</View>
      {done ? (
        <Appear>
          <GameButton label="Great work! Continue" icon="check" onPress={onDone} sound="success" testID="mini-done" />
        </Appear>
      ) : null}
    </View>
  );
}

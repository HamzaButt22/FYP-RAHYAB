import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { SCRIPTS, fillNick } from '@/game/story/dialogue';
import { SpeechBubble } from '@/ui/Game';
import { GameButton } from '@/ui/Button';
import { GText } from '@/ui/Text';
import { Appear } from '@/ui/Layout';
import { useGame } from '@/state/GameProvider';
import { space } from '@/ui/tokens';
import { audio } from '@/services/audio';
import { speech } from '@/services/feedback';

/** Story scene: short lines, tap to continue. Earlier lines stay visible like a chat. */
export function DialogueStep({ script, onDone }: { script: string; onDone: () => void }) {
  const { s } = useGame();
  const lines = SCRIPTS[script] ?? [];
  const nick = s.avatar?.nickname ?? 'friend';
  const [n, setN] = useState(1);
  const last = n >= lines.length;
  const next = () => { speech.stop(); audio.play('page', 0.5); if (last) onDone(); else setN(n + 1); };
  return (
    <View style={{ gap: space.md }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Next line" onPress={next} style={{ gap: space.md }}>
        {lines.slice(Math.max(0, n - 3), n).map((l, i, arr) => (
          <Appear key={`${n}-${i}`} delay={i === arr.length - 1 ? 0 : 0} from={i === arr.length - 1 ? 14 : 0}>
            <View style={{ opacity: i === arr.length - 1 ? 1 : 0.55 }}>
              <SpeechBubble speaker={l.speaker} text={fillNick(l.text, nick)} mood={l.mood} compact={i !== arr.length - 1} />
            </View>
          </Appear>
        ))}
      </Pressable>
      <GText variant="label" center soft>{`${n} / ${lines.length}`}</GText>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        {!last ? <GameButton style={{ flex: 1 }} variant="quiet" size="sm" label="Skip story" onPress={() => { speech.stop(); onDone(); }} sound={null} /> : null}
        <GameButton style={{ flex: 2 }} label={last ? 'Continue' : 'Next'} icon="arrow" onPress={next} sound={null} testID="dialogue-next" />
      </View>
    </View>
  );
}

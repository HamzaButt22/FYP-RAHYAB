import { useEffect, useId, useState } from 'react';
import { Pressable } from 'react-native';
import { Icon } from './Icon';
import { useTheme } from '@/state/GameProvider';
import { speech } from '@/services/feedback';
import { MIN_TOUCH } from './tokens';

/** Read-aloud button. Placed on every text block in the game. Tap again to stop. */
export function SpeakButton({ text, size = MIN_TOUCH, tone = 'surface', auto = false }: { text: string; size?: number; tone?: 'surface' | 'clear'; auto?: boolean }) {
  const id = useId();
  const { c } = useTheme();
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => speech.subscribe((sid) => setSpeaking(sid === id)), [id]);
  useEffect(() => { if (auto) speech.speak(id, text); }, [auto, id, text]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={speaking ? 'Stop reading' : 'Read aloud'}
      onPress={() => speech.speak(id, text)}
      hitSlop={4}
      style={({ pressed }) => ({
        width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center',
        backgroundColor: speaking ? c.secondary : tone === 'clear' ? 'transparent' : c.surfaceRaised,
        borderWidth: tone === 'clear' ? 0 : 2, borderColor: speaking ? c.secondaryDeep : c.border,
        transform: [{ scale: pressed ? 0.92 : 1 }],
      })}
    >
      <Icon name={speaking ? 'speaking' : 'speaker'} size={size * 0.5} color={speaking ? '#FFFFFF' : c.text} />
    </Pressable>
  );
}

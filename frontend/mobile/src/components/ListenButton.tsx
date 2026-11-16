// The speaker button for read-aloud (FR-96, design/specs/accessibility.md §2): tap to hear the text with the
// phone's own English voice, tap again to stop. If the phone has no English voice, a hint says how to add
// one (once per app run); if a line cannot be spoken, it says so instead of staying silent.

import { CircleStop, Volume2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { toggleReading, useReading } from '@/speech/reader';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, touchMin } from '@/theme/tokens';
import { AppText } from './AppText';

let hintShown = false; // the "install a voice" hint appears once per app run

interface Props {
  /** Unique for this text on screen; the same id stops a reading that is going. */
  id: string;
  text: string;
}

export function ListenButton({ id, text }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const reading = useReading(id) >= 0;
  const [message, setMessage] = useState<string | null>(null);

  async function press() {
    setMessage(null);
    const result = await toggleReading(id, text);
    if (result === 'no_voice' && !hintShown) {
      hintShown = true;
      setMessage(t('listen.noVoice'));
    } else if (result === 'no_audio') {
      setMessage(t('listen.noAudio'));
    }
  }

  const Icon = reading ? CircleStop : Volume2;
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={reading ? t('listen.stop') : t('listen.start')}
        accessibilityState={{ selected: reading }}
        onPress={() => void press()}
        style={[styles.button, { backgroundColor: reading ? colors.secondary : colors.sunken }]}
      >
        <Icon
          color={reading ? colors.onSecondary : colors.text}
          size={24}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </Pressable>
      {message ? (
        <AppText variant="caption" color="muted" accessibilityLiveRegion="polite" style={styles.message}>
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'flex-end', gap: space[1] },
  button: { width: touchMin, height: touchMin, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  message: { maxWidth: 220, textAlign: 'right' },
});

// A paragraph that can be read aloud (FR-96): the text with a speaker button beside it. While it is read,
// the current sentence is highlighted. Use it for story lines, task instructions, help and explanations.

import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { sentences } from '@/speech/sentences';
import { stopReading, useReading } from '@/speech/reader';
import { useTheme } from '@/theme/ThemeProvider';
import type { ThemeColors } from '@/theme/tokens';
import { space } from '@/theme/tokens';
import { AppText, type Variant } from './AppText';
import { ListenButton } from './ListenButton';

interface Props {
  id: string;
  text: string;
  variant?: Variant;
  color?: keyof ThemeColors;
}

export function ReadableText({ id, text, variant = 'body', color = 'text' }: Props) {
  const { colors } = useTheme();
  const index = useReading(id);
  const parts = sentences(text);

  // Leaving the screen stops its reading (only when it is this text that is being read).
  const readingNow = useRef(false);
  useEffect(() => {
    readingNow.current = index >= 0;
  }, [index]);
  useEffect(
    () => () => {
      if (readingNow.current) stopReading();
    },
    [],
  );

  return (
    <View style={styles.row}>
      <AppText variant={variant} color={color} style={styles.text}>
        {parts.map((s, i) => (
          <Text key={i} style={i === index ? { backgroundColor: colors.accent, color: colors.onAccent } : undefined}>
            {i > 0 ? ' ' : ''}
            {s}
          </Text>
        ))}
      </AppText>
      <ListenButton id={id} text={text} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3] },
  text: { flex: 1 },
});

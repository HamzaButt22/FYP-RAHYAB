// Page frame: safe areas, the theme background, the size-class gutter, and scrolling so nothing is cut off
// at 200% text. On tablets the content stays at a readable width (design/specs/responsive.md).

import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

interface Props {
  children: ReactNode;
  /** Pinned to the bottom, e.g. the main button. */
  footer?: ReactNode;
  centered?: boolean;
  edges?: Edge[];
}

export function Screen({ children, footer, centered = false, edges = ['top', 'bottom'] }: Props) {
  const { colors, layout } = useTheme();
  const frame = { paddingHorizontal: layout.gutter, maxWidth: layout.contentMaxWidth, width: '100%' as const };
  return (
    <SafeAreaView edges={edges} style={[styles.fill, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, centered && styles.centered]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[frame, styles.column]}>{children}</View>
      </ScrollView>
      {footer ? <View style={[frame, styles.column, styles.footer]}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center', paddingVertical: space[5] },
  centered: { justifyContent: 'center' },
  column: { alignSelf: 'center', gap: space[4] },
  footer: { paddingBottom: space[4], paddingTop: space[2] },
});

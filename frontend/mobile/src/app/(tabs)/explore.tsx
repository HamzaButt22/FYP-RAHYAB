// S-12 Explore: the stream library (FR-60, FR-65). Every path at one level, chosen with three chips: after
// class 8 (Matric groups), after Matric and after Intermediate. It opens on the choice the student's class
// makes next. Works offline: the data is bundled with the app (src/library/).

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { joinList } from '@/i18n/joinList';
import { STREAMS } from '@/library/data';
import { LEVELS, levelForGrade, pathsAt, topTypes, type Level } from '@/library/library';
import { cachedProfile } from '@/profile/profileApi';
import { useAppState } from '@/state/AppState';
import { getKv } from '@/sync/runtime';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, touchMin } from '@/theme/tokens';

/** Keys built at run time (levels, interest types); library.test.ts checks every one exists. */
function useTx(): (key: string, options?: Record<string, unknown>) => string {
  const { t } = useTranslation();
  return t as unknown as (key: string, options?: Record<string, unknown>) => string;
}

export default function ExploreScreen() {
  const tx = useTx();
  const { colors } = useTheme();
  const { session } = useAppState();
  const studentId = session?.studentId ?? '';
  const [grade, setGrade] = useState<number | null>(null);
  const [chosen, setChosen] = useState<Level | null>(null);
  const level = chosen ?? levelForGrade(grade);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      void getKv()
        .then((kv) => live && setGrade(cachedProfile(kv, studentId)?.grade ?? null))
        .catch(() => undefined);
      return () => {
        live = false;
      };
    }, [studentId]),
  );

  const and = tx('results.and');
  return (
    <Screen edges={['top']}>
      <AppText variant="displayL" accessibilityRole="header">
        {tx('library.title')}
      </AppText>
      <AppText color="muted">{tx('library.help')}</AppText>

      <View style={styles.chips} accessibilityRole="tablist">
        {LEVELS.map((l) => {
          const on = l === level;
          return (
            <Pressable
              key={l}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => setChosen(l)}
              style={[
                styles.chip,
                {
                  backgroundColor: on ? colors.secondary : colors.surface,
                  borderColor: on ? colors.secondary : colors.border,
                },
              ]}
            >
              <AppText variant="label" color={on ? 'onSecondary' : 'text'}>
                {tx(`library.levels.${l}`)}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <AppText variant="caption" color="muted">
        {tx(`library.levelHints.${level}`)}
      </AppText>

      {pathsAt(STREAMS, level).map((p) => (
        <Pressable
          key={p.id}
          accessibilityRole="button"
          accessibilityHint={tx('library.help')}
          onPress={() => router.push({ pathname: '/stream/[id]', params: { id: p.id } })}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: pressed ? colors.sunken : colors.surface, borderColor: colors.border },
          ]}
        >
          <AppText variant="title">{p.name}</AppText>
          <AppText color="muted">
            {tx('library.suits', { list: joinList(topTypes(p, 2).map((t) => tx(`results.type.${t}`)), and) })}
          </AppText>
          {p.tests?.length ? (
            <AppText variant="caption" color="secondaryText">
              {tx('library.tests', { list: p.tests.join(', ') })}
            </AppText>
          ) : null}
          {p.verify ? (
            <AppText variant="caption" color="primaryText">
              {tx('library.checkBadge')}
            </AppText>
          ) : null}
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  chip: {
    minHeight: touchMin,
    paddingHorizontal: space[4],
    borderRadius: radius.pill,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: space[4], gap: space[1] },
});

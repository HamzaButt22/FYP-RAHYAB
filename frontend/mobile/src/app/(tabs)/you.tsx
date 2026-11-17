// S-18 You: "Your details", and You → Accessibility (FR-97, design/specs/accessibility.md §1). Every change
// applies at once, without a restart, and is saved for this student on this phone.

import { router } from 'expo-router';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { READING_SPEEDS, TEXT_SCALES, type Settings } from '@/settings/settings';
import { useSettings } from '@/settings/SettingsProvider';
import { useAppState } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, touchMin } from '@/theme/tokens';

/** Keys built at run time (speeds, sizes); settings.test.ts checks every one exists. */
function useTx(): (key: string, options?: Record<string, unknown>) => string {
  const { t } = useTranslation();
  return t as unknown as (key: string, options?: Record<string, unknown>) => string;
}

const key = (n: number) => String(n).replace('.', '_');

export default function YouScreen() {
  const tx = useTx();
  const { resetOnboarding } = useAppState();
  const { settings, effective, update } = useSettings();
  const talkBackBlocksAutoRead = settings.readAloud && settings.autoRead && !effective.autoRead;

  return (
    <Screen edges={['top']}>
      <AppText variant="displayL" accessibilityRole="header">
        {tx('you.title')}
      </AppText>
      <Button label={tx('profile.youLink')} onPress={() => router.push('/profile')} />

      <AppText variant="heading" accessibilityRole="header">
        {tx('settings.title')}
      </AppText>

      <Toggle
        label={tx('settings.readAloud')}
        hint={tx('settings.readAloudHint')}
        value={settings.readAloud}
        onChange={(readAloud) => update({ readAloud })}
      />
      {settings.readAloud ? (
        <>
          <Toggle
            label={tx('settings.autoRead')}
            hint={talkBackBlocksAutoRead ? tx('settings.autoReadTalkBack') : tx('settings.autoReadHint')}
            value={settings.autoRead}
            onChange={(autoRead) => update({ autoRead })}
          />
          <Options
            label={tx('settings.readingSpeed')}
            options={READING_SPEEDS.map((s) => ({ value: s, label: tx(`settings.speeds.${key(s)}`) }))}
            value={settings.readingSpeed}
            onChange={(readingSpeed) => update({ readingSpeed: readingSpeed as Settings['readingSpeed'] })}
          />
        </>
      ) : null}

      <Options
        label={tx('settings.textSize')}
        hint={tx('settings.textSizeHint')}
        options={TEXT_SCALES.map((s) => ({ value: s, label: tx(`settings.sizes.${key(s)}`) }))}
        value={settings.textScale}
        onChange={(textScale) => update({ textScale: textScale as Settings['textScale'] })}
      />
      <AppText color="muted">{tx('settings.sample')}</AppText>

      <Toggle
        label={tx('settings.readingFont')}
        hint={tx('settings.readingFontHint')}
        value={settings.readingFont}
        onChange={(readingFont) => update({ readingFont })}
      />
      <Toggle
        label={tx('settings.highContrast')}
        hint={tx('settings.highContrastHint')}
        value={settings.highContrast}
        onChange={(highContrast) => update({ highContrast })}
      />
      <Toggle
        label={tx('settings.reduceMotion')}
        hint={tx('settings.reduceMotionHint')}
        value={effective.reduceMotion}
        onChange={(on) => update({ reduceMotion: on ? 'on' : 'system' })}
      />

      {__DEV__ ? <Button kind="text" label={tx('you.devReset')} onPress={resetOnboarding} /> : null}
    </Screen>
  );
}

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.toggle}>
      <View style={styles.grow}>
        <AppText variant="title">{label}</AppText>
        <AppText variant="caption" color="muted">
          {hint}
        </AppText>
      </View>
      <Switch
        accessibilityLabel={label}
        accessibilityHint={hint}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.secondary, false: colors.border }}
        thumbColor={colors.surface}
      />
    </View>
  );
}

function Options({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  options: { value: number; label: string }[];
  value: number;
  onChange: (value: number) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.options}>
      <AppText variant="title">{label}</AppText>
      {hint ? (
        <AppText variant="caption" color="muted">
          {hint}
        </AppText>
      ) : null}
      <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: on, selected: on }}
              accessibilityLabel={`${label}: ${o.label}`}
              onPress={() => onChange(o.value)}
              style={[
                styles.chip,
                {
                  backgroundColor: on ? colors.secondary : colors.surface,
                  borderColor: on ? colors.secondary : colors.border,
                },
              ]}
            >
              <AppText variant="label" color={on ? 'onSecondary' : 'text'}>
                {o.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space[3], minHeight: touchMin },
  grow: { flex: 1, gap: space[1] },
  options: { gap: space[2] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  chip: {
    minHeight: touchMin,
    minWidth: touchMin,
    paddingHorizontal: space[4],
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

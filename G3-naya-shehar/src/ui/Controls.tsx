import { Pressable, View } from 'react-native';
import { GText } from './Text';
import { Icon } from './Icon';
import { useTheme } from '@/state/GameProvider';
import { MIN_TOUCH, radius, space } from './tokens';
import { audio } from '@/services/audio';

/** Big on/off switch with ON/OFF text (never colour alone). */
export function Toggle({ label, hint, value, onChange, testID }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void; testID?: string }) {
  const { c } = useTheme();
  return (
    <Pressable testID={testID} accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={label} accessibilityHint={hint}
      onPress={() => { audio.play('blip'); onChange(!value); }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: MIN_TOUCH + 8, paddingVertical: space.xs }}>
      <View style={{ flex: 1 }}>
        <GText variant="bodyBold">{label}</GText>
        {hint ? <GText variant="small" soft>{hint}</GText> : null}
      </View>
      <View style={{ width: 76, height: 40, borderRadius: 20, backgroundColor: value ? c.success : c.border, justifyContent: 'center', paddingHorizontal: 4 }}>
        <View style={{ position: 'absolute', left: value ? 10 : undefined, right: value ? undefined : 9 }}>
          <GText variant="label" color={value ? '#FFFFFF' : c.textSoft} style={{ fontSize: 11 }}>{value ? 'ON' : 'OFF'}</GText>
        </View>
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFFFFF', alignSelf: value ? 'flex-end' : 'flex-start', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={value ? 'check' : 'close'} size={16} color={value ? c.success : c.locked} />
        </View>
      </View>
    </Pressable>
  );
}

/** Segmented choice (2–4 options). */
export function Segmented<T extends string | number>({ label, options, value, onChange }: { label: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: space.xs }}>
      <GText variant="bodyBold">{label}</GText>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 6 }}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable key={String(o.value)} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`${label}: ${o.label}`}
              onPress={() => { audio.play('blip'); onChange(o.value); }}
              style={{ flex: 1, minHeight: MIN_TOUCH, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4,
                backgroundColor: on ? c.secondary : c.surfaceRaised, borderWidth: 2, borderColor: on ? c.secondaryDeep : c.border }}>
              {on ? <Icon name="check" size={16} color="#FFFFFF" /> : null}
              <GText variant="label" color={on ? '#FFFFFF' : c.text}>{o.label}</GText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

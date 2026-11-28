import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { GText } from './Text';
import { Icon, IconName } from './Icon';
import { MIN_TOUCH, radius, space } from './tokens';
import { useTheme } from '@/state/GameProvider';
import { audio, SoundName } from '@/services/audio';
import { feedback } from '@/services/feedback';

type Variant = 'primary' | 'secondary' | 'ghost' | 'quiet';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: IconName;
  iconRight?: IconName;
  disabled?: boolean;
  size?: 'md' | 'lg' | 'sm';
  style?: StyleProp<ViewStyle>;
  sound?: SoundName | null;
  accessibilityHint?: string;
  testID?: string;
}

/**
 * Chunky "toy" button: a coloured face sitting on a darker edge. Pressing
 * pushes the face down onto the edge (spring), plays a click and a light haptic.
 */
export function GameButton({ label, onPress, variant = 'primary', icon, iconRight, disabled, size = 'md', style, sound = 'tap', accessibilityHint, testID }: ButtonProps) {
  const { c, reducedMotion } = useTheme();
  const press = useSharedValue(0);
  const colors = {
    primary: { face: c.primary, edge: c.primaryDeep, text: c.textOnPrimary },
    secondary: { face: c.secondary, edge: c.secondaryDeep, text: '#FFFFFF' },
    ghost: { face: c.surfaceRaised, edge: c.border, text: c.text },
    quiet: { face: 'transparent', edge: 'transparent', text: c.text },
  }[variant];
  const h = size === 'lg' ? 62 : size === 'sm' ? MIN_TOUCH : 54;
  const edge = variant === 'quiet' ? 0 : 5;
  const face = useAnimatedStyle(() => ({ transform: [{ translateY: press.value * (edge - 1) }] }));

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      hitSlop={6}
      onPressIn={() => { press.value = reducedMotion ? withTiming(1, { duration: 1 }) : withSpring(1, { damping: 20, stiffness: 500 }); }}
      onPressOut={() => { press.value = reducedMotion ? withTiming(0, { duration: 1 }) : withSpring(0, { damping: 12, stiffness: 300 }); }}
      onPress={() => { if (sound) audio.play(sound); feedback.tap(); onPress?.(); }}
      style={[{ minHeight: h + edge, opacity: disabled ? 0.5 : 1 }, style]}
    >
      <View style={{ position: 'absolute', left: 0, right: 0, top: edge, height: h, borderRadius: radius.md, backgroundColor: colors.edge }} />
      <Animated.View
        style={[{
          height: h, borderRadius: radius.md, backgroundColor: colors.face, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          paddingHorizontal: size === 'sm' ? space.md : space.lg, gap: space.sm,
          borderWidth: variant === 'ghost' ? 2 : 0, borderColor: c.border,
        }, face]}
      >
        {icon ? <Icon name={icon} size={size === 'lg' ? 26 : 22} color={colors.text} /> : null}
        <GText variant={size === 'lg' ? 'heading' : 'sub'} color={colors.text} numberOfLines={2} style={{ flexShrink: 1, textAlign: 'center' }}>{label}</GText>
        {iconRight ? <Icon name={iconRight} size={22} color={colors.text} /> : null}
      </Animated.View>
    </Pressable>
  );
}

/** Round icon-only button (pause, read-aloud, back). Always has an accessible label. */
export function IconButton({ icon, label, onPress, tone = 'surface', size = MIN_TOUCH, testID }: { icon: IconName; label: string; onPress: () => void; tone?: 'surface' | 'primary' | 'dark'; size?: number; testID?: string }) {
  const { c } = useTheme();
  const bg = tone === 'primary' ? c.primary : tone === 'dark' ? 'rgba(43,36,51,0.75)' : c.surfaceRaised;
  const fg = tone === 'dark' ? '#FFFFFF' : tone === 'primary' ? c.textOnPrimary : c.text;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => { audio.play('blip', 0.5); feedback.tap(); onPress(); }}
      style={({ pressed }) => ({
        width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center',
        borderWidth: tone === 'surface' ? 2 : 0, borderColor: c.border, transform: [{ scale: pressed ? 0.92 : 1 }],
      })}
    >
      <Icon name={icon} size={size * 0.5} color={fg} />
    </Pressable>
  );
}

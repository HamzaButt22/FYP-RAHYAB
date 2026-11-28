import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useGame, useTheme } from '@/state/GameProvider';
import { GText } from './Text';
import { Icon, IconName } from './Icon';
import { IconButton } from './Button';
import { SpeakButton } from './Speak';
import { elevation, radius, space } from './tokens';
import { Portrait, lookForCharacter } from '@/art/Bust';
import { CHARACTERS, CharacterId, Expression } from '@/game/characters/characters';
import { ReactionValue } from '@/assessment/types';
import { audio } from '@/services/audio';
import { feedback } from '@/services/feedback';

/** Title bar for secondary screens: back, title, read-aloud. */
export function ScreenHeader({ title, speak, onBack, right }: { title: string; speak?: string; onBack?: () => void; right?: React.ReactNode }) {
  const router = useRouter();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
      <IconButton icon="back" label="Back" onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/menu')))} />
      <GText variant="title" style={{ flex: 1 }} numberOfLines={2} accessibilityRole="header">{title}</GText>
      {speak ? <SpeakButton text={speak} /> : null}
      {right}
    </View>
  );
}

/** Confetti + star burst. Static badge when reduced motion is on. */
export function Celebration({ title, subtitle, icon = 'star' }: { title: string; subtitle?: string; icon?: IconName }) {
  const { c, reducedMotion } = useTheme();
  const pop = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    if (!reducedMotion) { pop.value = withSpring(1, { damping: 9, stiffness: 160 }); audio.play('success'); feedback.success(); }
  }, [pop, reducedMotion]);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: 0.4 + pop.value * 0.6 }], opacity: pop.value }));
  const bits = useMemo(() => Array.from({ length: 18 }, (_, i) => ({ a: (i / 18) * Math.PI * 2, d: 70 + (i % 3) * 22, col: ['#F4A340', '#E2589B', '#3FAE6A', '#5B8DEF', '#FFD166'][i % 5] })), []);
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: space.lg }} accessible accessibilityLabel={`${title}. ${subtitle ?? ''}`}>
      {!reducedMotion ? bits.map((b, i) => <Confetto key={i} angle={b.a} dist={b.d} colour={b.col} delay={i * 12} />) : null}
      <Animated.View style={[{ width: 96, height: 96, borderRadius: 48, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 5, borderColor: '#FFFFFF' }, elevation(3), st]}>
        <Icon name={icon} size={52} color="#FFFFFF" fill="#FFFFFF" />
      </Animated.View>
      <GText variant="title" center style={{ marginTop: space.md }}>{title}</GText>
      {subtitle ? <GText center soft>{subtitle}</GText> : null}
    </View>
  );
}

function Confetto({ angle, dist, colour, delay }: { angle: number; dist: number; colour: string; delay: number }) {
  const v = useSharedValue(0);
  useEffect(() => { v.value = withDelay(delay, withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) })); }, [delay, v]);
  const st = useAnimatedStyle(() => ({
    opacity: 1 - v.value * v.value,
    transform: [{ translateX: Math.cos(angle) * dist * v.value }, { translateY: Math.sin(angle) * dist * v.value + v.value * v.value * 40 }, { rotate: `${v.value * 360}deg` }],
  }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: 10, height: 6, borderRadius: 2, backgroundColor: colour, top: '50%', left: '50%' }, st]} />;
}

/** The three permitted self-report reactions. Always optional: "Skip" is equally prominent. */
export function ReactionPicker({ onPick, onSkip }: { onPick: (v: ReactionValue) => void; onSkip: () => void }) {
  const { c } = useTheme();
  const [picked, setPicked] = useState<ReactionValue | null>(null);
  const options: { v: ReactionValue; label: string; face: 'meh' | 'okay' | 'loved' }[] = [
    { v: 'meh', label: 'Meh', face: 'meh' }, { v: 'okay', label: 'Okay', face: 'okay' }, { v: 'loved', label: 'Loved it', face: 'loved' },
  ];
  return (
    <View style={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <GText variant="heading" style={{ flex: 1 }}>How was that? (optional)</GText>
        <SpeakButton text="How was that? This is optional. Meh, okay, or loved it. You can also skip." size={44} />
      </View>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        {options.map((o) => (
          <Pressable key={o.v} accessibilityRole="button" accessibilityLabel={o.label} accessibilityState={{ selected: picked === o.v }}
            onPress={() => { setPicked(o.v); audio.play('select'); feedback.tap(); setTimeout(() => onPick(o.v), 250); }}
            style={[{ flex: 1, alignItems: 'center', paddingVertical: space.md, borderRadius: radius.md, backgroundColor: picked === o.v ? c.bgAlt : c.surfaceRaised, borderWidth: 3, borderColor: picked === o.v ? c.primary : c.border, gap: 4 }, elevation(1)]}>
            <Face kind={o.face} />
            <GText variant="bodyBold">{o.label}</GText>
          </Pressable>
        ))}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Skip" onPress={onSkip} style={{ alignSelf: 'center', minHeight: 48, paddingHorizontal: space.xl, justifyContent: 'center' }}>
        <GText variant="bodyBold" soft style={{ textDecorationLine: 'underline' }}>Skip</GText>
      </Pressable>
    </View>
  );
}

function Face({ kind }: { kind: 'meh' | 'okay' | 'loved' }) {
  const fill = kind === 'loved' ? '#FFD166' : kind === 'okay' ? '#FCE3B0' : '#E6DCEF';
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48">
      <Circle cx={24} cy={24} r={21} fill={fill} stroke="#2B2433" strokeWidth={2.5} />
      {kind === 'loved'
        ? <><Path d="M14 18 c0-3 5-3 5 0 c0 3-5 5-5 5 s-5-2-5-5 c0-3 5-3 5 0z" fill="#E35D5D" transform="translate(2 0)" /><Path d="M30 18 c0-3 5-3 5 0 c0 3-5 5-5 5 s-5-2-5-5 c0-3 5-3 5 0z" fill="#E35D5D" transform="translate(2 0)" /><Path d="M14 29 q10 10 20 0" stroke="#2B2433" strokeWidth={2.8} fill="none" strokeLinecap="round" /></>
        : <><Circle cx={17} cy={20} r={2.6} fill="#2B2433" /><Circle cx={31} cy={20} r={2.6} fill="#2B2433" />
          {kind === 'okay' ? <Path d="M16 30 q8 5 16 0" stroke="#2B2433" strokeWidth={2.8} fill="none" strokeLinecap="round" /> : <Path d="M16 31 h16" stroke="#2B2433" strokeWidth={2.8} strokeLinecap="round" />}</>}
    </Svg>
  );
}

/** Character speech: portrait + name tag + bubble. */
export function SpeechBubble({ speaker, text, mood = 'talk', compact }: { speaker: CharacterId | 'narrator'; text: string; mood?: Expression; compact?: boolean }) {
  const { c, reducedMotion } = useTheme();
  const { s } = useGame();
  const auto = s.settings.readAloudAuto;
  if (speaker === 'narrator') {
    return (
      <View style={[{ backgroundColor: c.surface, borderRadius: radius.lg, padding: space.lg, borderWidth: 2, borderColor: c.border, flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }, elevation(1)]}>
        <GText variant="sub" style={{ flex: 1, fontStyle: 'italic' }}>{text}</GText>
        <SpeakButton text={text} size={44} auto={auto} />
      </View>
    );
  }
  const ch = CHARACTERS[speaker];
  return (
    <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-end' }}>
      <Portrait look={lookForCharacter(speaker)} expression={mood} size={compact ? 64 : 84} reducedMotion={reducedMotion} />
      <View style={[{ flex: 1, backgroundColor: c.surfaceRaised, borderRadius: radius.lg, borderBottomLeftRadius: 4, padding: space.md, borderWidth: 2, borderColor: c.border, gap: 4 }, elevation(1)]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <GText variant="label" color={c.primaryDeep} style={{ flex: 1 }}>{ch.name.toUpperCase()}</GText>
          <SpeakButton text={`${ch.name} says: ${text}`} size={40} tone="clear" auto={auto} />
        </View>
        <GText>{text}</GText>
      </View>
    </View>
  );
}

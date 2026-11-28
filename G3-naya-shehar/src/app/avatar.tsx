import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/ui/Layout';
import { GText } from '@/ui/Text';
import { GameButton } from '@/ui/Button';
import { ScreenHeader } from '@/ui/Game';
import { Icon } from '@/ui/Icon';
import { Portrait, BustArt, lookFromAvatar } from '@/art/Bust';
import { useGame, useTheme } from '@/state/GameProvider';
import {
  ACCESSORIES, Avatar, DEFAULT_AVATAR, FACES, HAIR_COLOURS, HAIR_STYLES, LABELS, NICKNAMES, OUTFITS, OUTFIT_COLOURS, SKIN_TONES,
} from '@/game/avatar';
import { elevation, radius, space } from '@/ui/tokens';
import { audio } from '@/services/audio';
import { feedback } from '@/services/feedback';

type Tab = 'face' | 'hair' | 'clothes' | 'extras' | 'name';
const TABS: { id: Tab; label: string }[] = [
  { id: 'face', label: 'Face' }, { id: 'hair', label: 'Hair' }, { id: 'clothes', label: 'Clothes' }, { id: 'extras', label: 'Extras' }, { id: 'name', label: 'Nickname' },
];

/** Avatar creator. Every option is open to everyone — no gender is asked or assumed. */
export default function AvatarScreen() {
  const { s, act } = useGame();
  const { c, reducedMotion } = useTheme();
  const router = useRouter();
  const editing = !!s.avatar;
  const [a, setA] = useState<Avatar>(s.avatar ?? DEFAULT_AVATAR);
  const [tab, setTab] = useState<Tab>('face');
  const set = <K extends keyof Avatar>(k: K, v: Avatar[K]) => { setA({ ...a, [k]: v }); audio.play('select', 0.5); feedback.tap(); };

  const Swatch = ({ colour, on, onPress, label }: { colour: string; on: boolean; onPress: () => void; label: string }) => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: on }} onPress={onPress}
      style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colour, borderWidth: on ? 4 : 2, borderColor: on ? c.text : c.border, alignItems: 'center', justifyContent: 'center' }}>
      {on ? <Icon name="check" size={20} color="#FFFFFF" /> : null}
    </Pressable>
  );
  const Option = ({ on, onPress, label, preview }: { on: boolean; onPress: () => void; label: string; preview?: Partial<Avatar> }) => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: on }} onPress={onPress}
      style={[{ width: 98, alignItems: 'center', padding: 6, borderRadius: radius.md, backgroundColor: on ? c.bgAlt : c.surfaceRaised, borderWidth: 3, borderColor: on ? c.primary : c.border, gap: 2 }, elevation(1)]}>
      {preview ? <BustArt look={lookFromAvatar({ ...a, ...preview })} size={70} /> : null}
      <GText variant="label" center numberOfLines={2}>{label}</GText>
    </Pressable>
  );
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={{ gap: space.sm }}><GText variant="label" soft>{title.toUpperCase()}</GText><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>{children}</View></View>
  );

  return (
    <Screen footer={<GameButton label={editing ? 'Save my look' : `I'm ready, ${a.nickname}!`} icon="check" size="lg" sound="success"
      onPress={() => { act((e) => e.setAvatar(a)); if (editing) router.back(); else router.replace(s.joinAsked ? '/play' : '/join'); }} testID="avatar-save" />}>
      <ScreenHeader title={editing ? 'Change your look' : 'Create your volunteer'} speak="Create your volunteer. Choose a face, hair, clothes, extras and a nickname. All options are for everyone." />
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Portrait look={lookFromAvatar(a)} expression="happy" size={170} reducedMotion={reducedMotion} ring={c.bgAlt} />
        <View style={{ paddingHorizontal: 16, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: c.primary }}>
          <GText variant="heading" color={c.textOnPrimary}>{a.nickname}</GText>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
        {TABS.map((t) => (
          <Pressable key={t.id} accessibilityRole="tab" accessibilityState={{ selected: tab === t.id }} accessibilityLabel={t.label} onPress={() => setTab(t.id)}
            style={{ minHeight: 48, paddingHorizontal: 18, borderRadius: radius.pill, justifyContent: 'center', backgroundColor: tab === t.id ? c.secondary : c.surfaceRaised, borderWidth: 2, borderColor: tab === t.id ? c.secondaryDeep : c.border }}>
            <GText variant="bodyBold" color={tab === t.id ? '#FFFFFF' : c.text}>{t.label}</GText>
          </Pressable>
        ))}
      </ScrollView>
      <View style={{ gap: space.lg }}>
        {tab === 'face' ? <>
          <Section title="Skin tone">{SKIN_TONES.map((t, i) => <Swatch key={t} colour={t} on={a.skin === t} onPress={() => set('skin', t)} label={`Skin tone ${i + 1}`} />)}</Section>
          <Section title="Face shape">{FACES.map((f) => <Option key={f} label={LABELS[f]} on={a.face === f} onPress={() => set('face', f)} preview={{ face: f }} />)}</Section>
        </> : null}
        {tab === 'hair' ? <>
          <Section title="Hairstyle">{HAIR_STYLES.map((h) => <Option key={h} label={LABELS[h]} on={a.hair === h} onPress={() => set('hair', h)} preview={{ hair: h }} />)}</Section>
          <Section title="Hair colour">{HAIR_COLOURS.map((h, i) => <Swatch key={h} colour={h} on={a.hairColour === h} onPress={() => set('hairColour', h)} label={`Hair colour ${i + 1}`} />)}</Section>
        </> : null}
        {tab === 'clothes' ? <>
          <Section title="Clothes">{OUTFITS.map((o) => <Option key={o} label={LABELS[o]} on={a.outfit === o} onPress={() => set('outfit', o)} preview={{ outfit: o }} />)}</Section>
          <Section title="Colour">{OUTFIT_COLOURS.map((o, i) => <Swatch key={o} colour={o} on={a.outfitColour === o} onPress={() => set('outfitColour', o)} label={`Clothes colour ${i + 1}`} />)}</Section>
        </> : null}
        {tab === 'extras' ? <Section title="Accessories">{ACCESSORIES.map((x) => <Option key={x} label={LABELS[x]} on={a.accessory === x} onPress={() => set('accessory', x)} preview={{ accessory: x }} />)}</Section> : null}
        {tab === 'name' ? (
          <Section title="Pick a nickname (no real names needed)">
            {NICKNAMES.map((n) => (
              <Pressable key={n} accessibilityRole="button" accessibilityState={{ selected: a.nickname === n }} accessibilityLabel={n} onPress={() => set('nickname', n)}
                style={{ minHeight: 48, paddingHorizontal: 16, borderRadius: radius.pill, justifyContent: 'center', backgroundColor: a.nickname === n ? c.primary : c.surfaceRaised, borderWidth: 2, borderColor: a.nickname === n ? c.primaryDeep : c.border }}>
                <GText variant="bodyBold" color={a.nickname === n ? c.textOnPrimary : c.text}>{n}</GText>
              </Pressable>
            ))}
          </Section>
        ) : null}
      </View>
    </Screen>
  );
}

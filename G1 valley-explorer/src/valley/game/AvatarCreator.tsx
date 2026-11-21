/** "Choose your traveller" — shown on first launch and from the Wardrobe button. Cosmetic only. */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, Guide, Screen, Tap } from '../ui/components';
import { colors, radius, space, type } from '../ui/theme';
import { Avatar, outfitsUnlocked, OUTFITS, SKINS, type AvatarLook, type AvatarStyle } from './engine/Avatar';

const STYLES: { id: AvatarStyle; label: string }[] = [
  { id: 'hijab', label: 'Scarf' }, { id: 'braid', label: 'Long hair' }, { id: 'short', label: 'Short hair' }, { id: 'cap', label: 'Cap' },
];

export function AvatarCreator({ initial, stopsDone, onDone, first }: { initial: AvatarLook; stopsDone: number; onDone: (l: AvatarLook) => void; first: boolean }) {
  const [look, setLook] = useState(initial);
  const unlocked = outfitsUnlocked(stopsDone);
  return (
    <Screen footer={<Button label={first ? 'Start my journey' : 'Done'} onPress={() => onDone(look)} testID="avatar-done" />}>
      <Text style={[type.display, { marginTop: space.md }]} accessibilityRole="header">{first ? 'Choose your traveller' : 'Wardrobe'}</Text>
      {first ? <Guide>Welcome to the valley! Make a traveller who looks like you — or however you like.</Guide> : null}
      <Card style={{ alignItems: 'center', backgroundColor: '#DDEFD6' }}>
        <Avatar look={look} size={150} />
      </Card>
      <Text style={type.subtitle}>Style</Text>
      <View style={st.row}>
        {STYLES.map((s) => (
          <Tap key={s.id} testID={`style-${s.id}`} onPress={() => setLook({ ...look, style: s.id })} accessibilityState={{ selected: look.style === s.id }} accessibilityLabel={s.label}
            style={[st.opt, look.style === s.id && st.sel]}>
            <Avatar look={{ ...look, style: s.id }} size={52} />
            <Text style={type.small}>{s.label}</Text>
          </Tap>
        ))}
      </View>
      <Text style={type.subtitle}>Skin</Text>
      <View style={st.row}>
        {SKINS.map((c, i) => (
          <Tap key={c} testID={`skin-${i}`} onPress={() => setLook({ ...look, skin: i })} accessibilityLabel={`Skin tone ${i + 1}`} accessibilityState={{ selected: look.skin === i }}
            style={[st.swatch, { backgroundColor: c }, look.skin === i && st.swatchSel]} />
        ))}
      </View>
      <Text style={type.subtitle}>Clothes colour</Text>
      <View style={st.row}>
        {OUTFITS.map((c, i) => {
          const open = unlocked.includes(c);
          return (
            <Tap key={c} testID={`outfit-${i}`} disabled={!open} onPress={() => setLook({ ...look, outfit: c })} accessibilityLabel={open ? `Colour ${i + 1}` : `Colour ${i + 1}, unlocks later`}
              accessibilityState={{ selected: look.outfit === c }} style={[st.swatch, { backgroundColor: c }, look.outfit === c && st.swatchSel]}>
              {!open ? <Text style={st.lockTxt}>?</Text> : null}
            </Tap>
          );
        })}
      </View>
      <Text style={type.small}>New colours unlock as you finish more places on your journey.</Text>
    </Screen>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  opt: { alignItems: 'center', padding: space.sm, borderRadius: radius.md, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, width: 78 },
  sel: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  swatch: { width: 52, height: 52, borderRadius: 26, borderWidth: 3, borderColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  swatchSel: { borderColor: colors.ink },
  lockTxt: { color: '#FFFFFF', fontWeight: '900', fontSize: 18 },
});

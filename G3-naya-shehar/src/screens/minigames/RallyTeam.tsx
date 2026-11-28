import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { MiniGameProps, MiniShell } from './Shell';
import { GText } from '@/ui/Text';
import { useTheme } from '@/state/GameProvider';
import { elevation, radius, space } from '@/ui/tokens';
import { BustArt, BustLook } from '@/art/Bust';
import { audio } from '@/services/audio';
import { feedback } from '@/services/feedback';
import { Appear } from '@/ui/Layout';

const PEOPLE: { name: string; idea: string; look: BustLook }[] = [
  { name: 'Sana', idea: 'I can bring my cousins!', look: { skin: '#E0AC86', face: 'oval', hair: 'ponytail', hairColour: '#3B2416', outfit: 'kameez', outfitColour: '#E2589B', accent: '#FFD166' } },
  { name: 'Hamza', idea: 'I will make the posters.', look: { skin: '#A8714A', face: 'round', hair: 'cap', hairColour: '#1E140E', outfit: 'hoodie', outfitColour: '#3E5C76', accent: '#FFFFFF' } },
  { name: 'Mrs Akhtar', idea: 'Count me in!', look: { skin: '#C98E64', face: 'oval', hair: 'dupatta', hairColour: '#1E140E', outfit: 'kameez', outfitColour: '#2E8B57', accent: '#F4D35E' } },
  { name: 'Danish', idea: 'I have a cart we can use.', look: { skin: '#8A5A3B', face: 'square', hair: 'short', hairColour: '#1E140E', outfit: 'kurta', outfitColour: '#E9873A', accent: '#FFFFFF' } },
  { name: 'Mahnoor', idea: 'I will tell my class.', look: { skin: '#F1C9A5', face: 'round', hair: 'bun', hairColour: '#5A2E1A', outfit: 'uniform', outfitColour: '#5B8DEF', accent: '#FFFFFF' } },
  { name: 'Baba Gul', idea: 'Happy to help, beta!', look: { skin: '#B07A52', face: 'square', hair: 'grey_short', hairColour: '#D6D6D6', outfit: 'waistcoat', outfitColour: '#8A6FD1', accent: '#C9A26B', beard: 'white' } },
];

/** Lead: invite townspeople to join your team. */
export default function RallyTeam({ title, partner, onDone }: MiniGameProps) {
  const { c } = useTheme();
  const [joined, setJoined] = useState<number[]>([]);
  const done = joined.length >= PEOPLE.length;
  return (
    <MiniShell title={title} partner={partner} instructions="Tap each person to invite them to join your team." done={done} onDone={onDone} progress={`Team: ${joined.length} of ${PEOPLE.length}`}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center' }}>
        {PEOPLE.map((p, i) => {
          const isIn = joined.includes(i);
          return (
            <Pressable key={p.name} accessibilityRole="button" accessibilityLabel={isIn ? `${p.name} joined: ${p.idea}` : `Invite ${p.name}`} disabled={isIn}
              onPress={() => { setJoined((j) => [...j, i]); audio.play('select'); feedback.tap(); }}
              style={[{ width: '30%', minWidth: 96, alignItems: 'center', padding: space.sm, gap: 2, borderRadius: radius.md, backgroundColor: isIn ? '#E4F5E9' : c.surfaceRaised, borderWidth: 3, borderColor: isIn ? c.success : c.border }, elevation(1)]}>
              <BustArt look={p.look} size={60} expression={isIn ? 'proud' : 'happy'} />
              <GText variant="label">{p.name}</GText>
              {isIn ? <Appear from={6}><GText variant="small" center soft>{`“${p.idea}”`}</GText></Appear> : <GText variant="small" soft>Tap to invite</GText>}
            </Pressable>
          );
        })}
      </View>
    </MiniShell>
  );
}

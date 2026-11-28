import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { MiniGameProps, MiniShell } from './Shell';
import { GText } from '@/ui/Text';
import { Icon, IconName } from '@/ui/Icon';
import { useTheme } from '@/state/GameProvider';
import { elevation, radius, space } from '@/ui/tokens';
import { audio } from '@/services/audio';
import { feedback } from '@/services/feedback';
import { BustArt, BustLook } from '@/art/Bust';

interface Target { id: string; label: string; icon: IconName; look?: BustLook }
interface Item { id: string; label: string; icon: IconName; target: string }

/**
 * Shared "tap one, then tap where it goes" mechanic, used by the Help
 * (neighbours ↔ what they need) and Sort (papers ↔ files) activities.
 */
function Match({ title, partner, onDone, instructions, targets, items, doneWord }: MiniGameProps & { instructions: string; targets: Target[]; items: Item[]; doneWord: string }) {
  const { c } = useTheme();
  const [held, setHeld] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [hint, setHint] = useState<string | null>(null);
  const done = items.every((i) => placed[i.id]);
  const drop = (t: Target) => {
    if (!held) return;
    const it = items.find((x) => x.id === held)!;
    if (it.target === t.id) { setPlaced((p) => ({ ...p, [it.id]: t.id })); setHeld(null); setHint(null); audio.play('select'); feedback.tap(); }
    else { setHint(`Hmm, ${t.label} needs something else. Try again!`); audio.play('gentle', 0.4); }
  };
  return (
    <MiniShell title={title} partner={partner} instructions={instructions} done={done} onDone={onDone} progress={`${doneWord}: ${Object.keys(placed).length} of ${items.length}`}>
      <View style={{ flexDirection: 'row', gap: space.sm, justifyContent: 'center' }}>
        {targets.map((t) => {
          const got = items.filter((i) => placed[i.id] === t.id);
          return (
            <Pressable key={t.id} accessibilityRole="button" accessibilityLabel={`${t.label}${got.length ? `, has ${got.map((g) => g.label).join(', ')}` : ''}`} onPress={() => drop(t)}
              style={[{ flex: 1, alignItems: 'center', padding: space.sm, borderRadius: radius.md, backgroundColor: c.surfaceRaised, borderWidth: 3, borderColor: held ? c.primary : c.border, gap: 4, minHeight: 130 }, elevation(1)]}>
              {t.look ? <BustArt look={t.look} size={56} expression={got.length ? 'proud' : 'think'} /> : <Icon name={t.icon} size={36} color={c.secondaryDeep} />}
              <GText variant="label" center>{t.label}</GText>
              <View style={{ flexDirection: 'row', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                {got.map((g) => <Icon key={g.id} name={g.icon} size={20} color={c.success} />)}
              </View>
            </Pressable>
          );
        })}
      </View>
      {hint ? <GText variant="small" center soft style={{ marginTop: space.sm }}>{hint}</GText> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center', marginTop: space.md }}>
        {items.filter((i) => !placed[i.id]).map((i) => (
          <Pressable key={i.id} accessibilityRole="button" accessibilityLabel={`Pick up ${i.label}`} accessibilityState={{ selected: held === i.id }}
            onPress={() => { setHeld(i.id); audio.play('blip'); }}
            style={[{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 48, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: held === i.id ? c.primary : c.surface, borderWidth: 2, borderColor: held === i.id ? c.primaryDeep : c.border }, elevation(1)]}>
            <Icon name={i.icon} size={20} color={held === i.id ? c.textOnPrimary : c.text} />
            <GText variant="label" color={held === i.id ? c.textOnPrimary : c.text}>{i.label}</GText>
          </Pressable>
        ))}
      </View>
    </MiniShell>
  );
}

const look = (skin: string, hair: BustLook['hair'], outfitColour: string, hairColour = '#1E140E'): BustLook =>
  ({ skin, face: 'round', hair, hairColour, outfit: 'kameez', outfitColour, accent: '#FCE3B0' });

/** Help: give each neighbour what they need. */
export function HelpNeighbours(p: MiniGameProps) {
  const sets = useMemo(() => [
    [{ id: 'a', label: 'Nani Jan', icon: 'person' as IconName, look: look('#C98E64', 'dupatta', '#8A6FD1') },
     { id: 'b', label: 'Little Ali', icon: 'person' as IconName, look: look('#E0AC86', 'curly', '#5B8DEF') },
     { id: 'c', label: 'Uncle Riaz', icon: 'person' as IconName, look: { ...look('#A8714A', 'short', '#3FAE6A'), beard: 'dark' as const } }],
  ][0], []);
  const items: Item[] = [
    { id: 'i1', label: 'Warm shawl', icon: 'heart', target: 'a' }, { id: 'i2', label: 'Reading glasses', icon: 'eye', target: 'a' },
    { id: 'i3', label: 'School book', icon: 'ledger', target: 'b' }, { id: 'i4', label: 'Lunch box', icon: 'clipboard', target: 'b' },
    { id: 'i5', label: 'Water jug', icon: 'flask', target: 'c' }, { id: 'i6', label: 'Bus ticket', icon: 'bus', target: 'c' },
  ];
  return <Match {...p} instructions="Tap an item, then tap the person who needs it. (Nani Jan is cold and can't read small print. Ali has school. Uncle Riaz is thirsty and going to town.)" targets={sets} items={items} doneWord="Helped" />;
}

/** Organise: file each paper in the right box. */
export function SortRecords(p: MiniGameProps) {
  const targets: Target[] = [
    { id: 'money', label: 'Money', icon: 'coin' }, { id: 'letters', label: 'Letters', icon: 'letter' }, { id: 'maps', label: 'Maps', icon: 'map' },
  ];
  const items: Item[] = [
    { id: 'r1', label: 'Shop receipt', icon: 'coin', target: 'money' }, { id: 'r2', label: 'Grant cheque', icon: 'coin', target: 'money' },
    { id: 'r3', label: 'Thank-you note', icon: 'letter', target: 'letters' }, { id: 'r4', label: 'School invitation', icon: 'letter', target: 'letters' },
    { id: 'r5', label: 'Canal plan', icon: 'map', target: 'maps' }, { id: 'r6', label: 'Bus route', icon: 'map', target: 'maps' },
  ];
  return <Match {...p} instructions="Tap a paper, then tap the box it belongs in." targets={targets} items={items} doneWord="Filed" />;
}

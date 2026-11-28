import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Riasec, ScoredWeek } from '@/assessment/types';
import { plannerForWeek, PlannerActivity } from '@/game/content/planner';
import { shuffleWithAnswer } from '@/assessment/abilities/geometry';
import { CHARACTERS } from '@/game/characters/characters';
import { ActivityArt } from '@/art/ActivityArt';
import { GText } from '@/ui/Text';
import { GameButton, IconButton } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { SpeechBubble } from '@/ui/Game';
import { SpeakButton } from '@/ui/Speak';
import { useTheme } from '@/state/GameProvider';
import { elevation, radius, space } from '@/ui/tokens';
import { audio } from '@/services/audio';
import { feedback } from '@/services/feedback';

const RANK = ['1st', '2nd', '3rd'];

/**
 * Weekly planner: six jobs (one of each kind), pick three and put them in order.
 * Order can be changed with ↑/↓ buttons (the accessible alternative to dragging).
 * Card order is shuffled per week so position does not bias picks.
 */
export function PlannerStep({ week, onCommit }: { week: ScoredWeek; onCommit: (ranked: Riasec[]) => void }) {
  const { c } = useTheme();
  const set = plannerForWeek(week);
  const cards = useMemo(() => {
    const { options } = shuffleWithAnswer(set.activities[0], set.activities.slice(1), 500 + week);
    return options;
  }, [set, week]);
  const [picked, setPicked] = useState<PlannerActivity[]>([]);
  const toggle = (a: PlannerActivity) => {
    feedback.tap();
    if (picked.some((p) => p.id === a.id)) { setPicked(picked.filter((p) => p.id !== a.id)); audio.play('blip'); }
    else if (picked.length < 3) { setPicked([...picked, a]); audio.play('select'); }
  };
  const move = (i: number, d: -1 | 1) => {
    const j = i + d; if (j < 0 || j >= picked.length) return;
    const n = [...picked]; [n[i], n[j]] = [n[j], n[i]]; setPicked(n); audio.play('blip');
  };
  return (
    <View style={{ gap: space.md }}>
      <SpeechBubble speaker="saima" mood="talk" text="Here are this week's jobs. Pick the 3 you most want to do, and put your favourite first." />
      <View style={[{ backgroundColor: c.surface, borderRadius: radius.lg, padding: space.md, borderWidth: 2, borderColor: c.border, gap: space.sm }, elevation(1)]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="calendar" color={c.primaryDeep} />
          <GText variant="heading" style={{ flex: 1, marginLeft: 6 }}>My week plan</GText>
          <SpeakButton size={40} text={picked.length ? `Your plan: ${picked.map((p, i) => `${RANK[i]}: ${p.title}`).join('. ')}` : 'Your plan is empty. Tap jobs below to add them.'} />
        </View>
        {[0, 1, 2].map((i) => {
          const p = picked[i];
          return (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 52, borderRadius: radius.md, borderWidth: 2, borderStyle: p ? 'solid' : 'dashed', borderColor: p ? c.primary : c.border, backgroundColor: p ? c.bgAlt : 'transparent', paddingLeft: space.sm }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: p ? c.primary : c.border, alignItems: 'center', justifyContent: 'center' }}>
                <GText variant="label" color={p ? c.textOnPrimary : c.textSoft}>{RANK[i]}</GText>
              </View>
              <GText variant={p ? 'bodyBold' : 'small'} soft={!p} style={{ flex: 1 }} numberOfLines={2}>{p ? p.title : 'Tap a job below'}</GText>
              {p ? (
                <View style={{ flexDirection: 'row' }}>
                  <IconButton icon="up" label={`Move ${p.title} up`} onPress={() => move(i, -1)} size={44} />
                  <IconButton icon="down" label={`Move ${p.title} down`} onPress={() => move(i, 1)} size={44} />
                  <IconButton icon="close" label={`Remove ${p.title}`} onPress={() => toggle(p)} size={44} />
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'space-between' }}>
        {cards.map((a) => {
          const r = picked.findIndex((p) => p.id === a.id);
          return (
            <Pressable key={a.id} accessibilityRole="button" accessibilityState={{ selected: r >= 0 }}
              accessibilityLabel={`${a.title}. ${a.text} With ${CHARACTERS[a.partner].name}.${r >= 0 ? ` In your plan as ${RANK[r]}.` : ''}`}
              onPress={() => toggle(a)}
              style={({ pressed }) => [{ width: '48.5%', borderRadius: radius.md, padding: space.sm, gap: 4, backgroundColor: c.surfaceRaised, borderWidth: 3, borderColor: r >= 0 ? c.primary : c.border, transform: [{ scale: pressed ? 0.97 : 1 }] }, elevation(1)]}>
              <ActivityArt category={a.category} size={140} />
              {r >= 0 ? <View style={{ position: 'absolute', top: 6, right: 6, width: 36, height: 36, borderRadius: 18, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' }}><GText variant="label" color={c.textOnPrimary}>{RANK[r]}</GText></View> : null}
              <GText variant="bodyBold" numberOfLines={2}>{a.title}</GText>
              <GText variant="small" soft numberOfLines={4}>{a.text}</GText>
              <GText variant="label" color={c.secondaryDeep}>{`with ${CHARACTERS[a.partner].name}`}</GText>
            </Pressable>
          );
        })}
      </View>
      <GameButton label={picked.length === 3 ? 'Lock in my plan' : `Pick ${3 - picked.length} more`} icon="check" size="lg" disabled={picked.length !== 3}
        onPress={() => onCommit(picked.map((p) => p.category))} sound="success" testID="planner-commit" />
    </View>
  );
}

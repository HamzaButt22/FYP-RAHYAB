import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Panel, Pill, Appear } from '@/ui/Layout';
import { GText } from '@/ui/Text';
import { GameButton } from '@/ui/Button';
import { ScreenHeader } from '@/ui/Game';
import { Icon } from '@/ui/Icon';
import { ActivityArt } from '@/art/ActivityArt';
import { useGame, useTheme } from '@/state/GameProvider';
import { ABILITY_NAMES, INTEREST_NAMES, MatricGroup } from '@/assessment/recommendations/rules';
import { PathwayResult } from '@/assessment/recommendations/engine';
import { elevation, radius, space } from '@/ui/tokens';

const GROUP_NAMES: Record<MatricGroup, string> = { science_biology: 'Science with Biology', science_computer: 'Science with Computer', humanities: 'Arts / Humanities', olevel: 'O-Levels', not_yet: 'not chosen' };
// Labels describe HOW MUCH evidence there is (precision), not how strong the interest is.
const CONF = { high: 'Lots of clues', medium: 'Some clues', low: 'Few clues' } as const;

function Conf({ level }: { level: 'low' | 'medium' | 'high' }) {
  const { c } = useTheme();
  const n = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
  return (
    <View accessible accessibilityLabel={`Evidence: ${CONF[level]}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      {[1, 2, 3].map((i) => <View key={i} style={{ width: 8, height: 8 + i * 3, borderRadius: 2, backgroundColor: i <= n ? c.secondary : c.border }} />)}
      <GText variant="small" soft style={{ marginLeft: 4 }}>{CONF[level]}</GText>
    </View>
  );
}

function PathCard({ r, rank, plan }: { r: PathwayResult; rank?: number; plan?: boolean }) {
  const { c } = useTheme();
  const e = r.eligibility;
  return (
    <View style={[{ backgroundColor: c.surfaceRaised, borderRadius: radius.lg, padding: space.md, gap: space.sm, borderWidth: 3, borderColor: plan ? c.secondary : rank === 0 ? c.primary : c.border }, elevation(1)]}
      accessible accessibilityLabel={`${plan ? 'Plan B' : `Path ${rank! + 1}`}: ${r.pathway.name}. ${r.pathway.about} Why: ${r.reasons.join(' ')}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: plan ? c.secondary : c.primary }}>
          {plan ? <GText variant="label" color="#FFFFFF">B</GText> : <GText variant="heading" color={c.textOnPrimary}>{rank! + 1}</GText>}
        </View>
        <View style={{ flex: 1 }}>
          <GText variant="heading">{r.pathway.name}</GText>
          <GText variant="label" soft>{r.pathway.track === 'technical' ? 'HANDS-ON / TECHNICAL ROUTE' : 'ACADEMIC ROUTE'}</GText>
        </View>
      </View>
      <GText>{r.pathway.about}</GText>
      <GText variant="label" color={c.primaryDeep}>WHY THIS MIGHT SUIT YOU</GText>
      {r.reasons.map((x) => <View key={x} style={{ flexDirection: 'row', gap: 6 }}><Icon name="check" size={18} color={c.success} /><GText style={{ flex: 1 }} variant="small">{x}</GText></View>)}
      {e.status === 'needs_group' ? <GText variant="small" soft>{`To keep this open, choose a Matric group like: ${e.groups.map((g) => GROUP_NAMES[g]).join(' or ')}.`}</GText> : null}
    </View>
  );
}

/** Career discovery results. Guidance only — not a diagnosis or a guarantee. */
export default function Results() {
  const { engine, s } = useGame();
  const { c } = useTheme();
  const router = useRouter();
  const [how, setHow] = useState(false);
  const profile = useMemo(() => engine.interestProfile(), [engine]);
  const abilities = useMemo(() => engine.abilityProfile(), [engine]);
  const rec = useMemo(() => engine.recommendation(), [engine, s.student]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!engine.isFinished()) {
    return (
      <Screen><ScreenHeader title="Your paths" />
        <Panel title="Not ready yet" icon="lock"><GText>Your results open after you finish Week 4. Every week adds more clues!</GText></Panel>
        <GameButton label="Back" onPress={() => router.back()} />
      </Screen>
    );
  }
  if (!rec || !s.student) { router.replace('/about-you'); return null; }
  const measured = engine.measuredWeeks();
  const sorted = [...profile.scores].sort((a, b) => b.theta - a.theta);
  const maxRel = Math.max(...sorted.map((x) => x.relative), 1);

  return (
    <Screen>
      <ScreenHeader title="Your career paths" onBack={() => router.replace('/menu')}
        speak={`Your career paths. Top suggestions: ${rec.top.map((t) => t.pathway.name).join(', ')}. Plan B: ${rec.planB?.pathway.name ?? 'none'}. These are suggestions to talk about with your family and teachers, not a final answer.`} />
      <Panel tone="tinted">
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Icon name="eye" color={c.primaryDeep} />
          <GText style={{ flex: 1 }} variant="small">These results are guidance from a game. They are not a test score, a diagnosis or a promise. Talk about them with your family, teachers or a career counsellor.</GText>
        </View>
      </Panel>
      {s.link ? <GText variant="small" soft>{`These results are shared with your teacher (class ${s.link.classCode}, roll no. ${s.link.roll}).`}</GText> : null}
      {measured < 4 ? (
        <Panel title="Fewer measured weeks" icon="access">
          <GText variant="small">{measured === 0 ? 'All your weeks were played in accessible mode, so there is no measured evidence. The suggestions below are not based on your choices.' : `Only ${measured} of 4 weeks were measured, so these results have less evidence behind them.`}</GText>
        </Panel>
      ) : null}

      <Appear>
        <Panel title="What you enjoy" icon="heart" speak={`What you enjoy, strongest first: ${sorted.map((x) => INTEREST_NAMES[x.category]).join(', ')}.`}>
          {sorted.map((x) => (
            <View key={x.category} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 4 }}>
              <View style={{ width: 54, height: 40, borderRadius: 8, overflow: 'hidden' }}><ActivityArt category={x.category} size={56} /></View>
              <View style={{ flex: 1, gap: 3 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <GText variant="bodyBold">{INTEREST_NAMES[x.category]}</GText>
                  <Conf level={x.confidence} />
                </View>
                <View style={{ height: 12, borderRadius: 6, backgroundColor: c.border, overflow: 'hidden' }}>
                  <View style={{ width: `${Math.max(6, (x.relative / maxRel) * 100)}%`, height: '100%', backgroundColor: c.primary }} />
                </View>
              </View>
            </View>
          ))}
          <GText variant="small" soft>Bars compare your interests with each other, not with other students.</GText>
        </Panel>
      </Appear>

      <Panel title="Your puzzle strengths" icon="sparkle" speak={abilities.map((a) => `${ABILITY_NAMES[a.family]}: ${a.band}`).join('. ')}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {abilities.map((a) => (
            <View key={a.family} style={{ width: '48%', padding: space.sm, borderRadius: radius.md, backgroundColor: c.bgAlt, gap: 2 }}>
              <GText variant="bodyBold">{ABILITY_NAMES[a.family]}</GText>
              <Pill label={a.band === 'strong' ? 'Strong' : a.band === 'steady' ? 'Steady' : 'Developing'} icon={a.band === 'strong' ? 'star' : a.band === 'steady' ? 'check' : 'up'} color={c.surfaceRaised} />
              <Conf level={a.confidence} />
            </View>
          ))}
        </View>
        <GText variant="small" soft>Only your first try at each puzzle counted. Abilities grow with practice!</GText>
      </Panel>

      <GText variant="title">Paths to explore</GText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <GText variant="small" soft style={{ flex: 1 }}>{`For a class ${s.student.classLevel} student, Matric group: ${GROUP_NAMES[s.student.matricGroup]}.`}</GText>
        <Pressable accessibilityRole="button" onPress={() => router.push('/about-you')} style={{ minHeight: 44, justifyContent: 'center' }}><GText variant="label" color={c.secondaryDeep}>CHANGE</GText></Pressable>
      </View>
      <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
        <GText variant="bodyBold">Overall evidence:</GText><Conf level={rec.confidence} />
      </View>
      {rec.top.map((r, i) => <PathCard key={r.pathway.id} r={r} rank={i} />)}
      {rec.planB ? <><GText variant="heading">Plan B</GText><PathCard r={rec.planB} plan /></> : null}
      {rec.notes.map((n) => <GText key={n} variant="small" soft>{n}</GText>)}

      <Panel title="Before you decide" icon="clipboard">
        <GText variant="small">{rec.unverifiedRules ? 'Admission rules in this game are a simple guide and have not been checked against this year’s official rules. Always confirm subjects, marks and deadlines with your school, your BISE board or the college you want to join.' : 'Always confirm admission details with your school or the college you want to join.'}</GText>
        <GText variant="small" soft>{`Rules version ${rec.rulesetVersion} · scoring ${profile.model}`}</GText>
      </Panel>

      <Pressable accessibilityRole="button" accessibilityState={{ expanded: how }} onPress={() => setHow(!how)} style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name={how ? 'up' : 'down'} color={c.text} /><GText variant="bodyBold">How did the game work this out?</GText>
      </Pressable>
      {how ? (
        <Panel>
          <GText variant="small">• Each time you picked one job over another, it counted as a small clue about what you enjoy.</GText>
          <GText variant="small">• Your weekly plans (your top 3 jobs, in order) added more clues.</GText>
          <GText variant="small">• "Loved it" and "Meh" added a tiny bit. Skipping added nothing.</GText>
          <GText variant="small">• Puzzles only counted your first try, and they never changed your interest results.</GText>
          <GText variant="small">• Town meters, coins and buildings were just for fun and did not count at all.</GText>
          <GText variant="small">{`• Repeated choices matched ${profile.consistency.rate === null ? '—' : `${Math.round(profile.consistency.rate * 100)}%`} of the time.`}</GText>
        </Panel>
      ) : null}
      <GameButton label="Back to the town" icon="map" variant="ghost" onPress={() => router.replace('/town')} />
    </Screen>
  );
}

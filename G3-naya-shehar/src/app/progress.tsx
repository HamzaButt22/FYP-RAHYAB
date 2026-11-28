import { View } from 'react-native';
import { Screen, Panel } from '@/ui/Layout';
import { GText } from '@/ui/Text';
import { ScreenHeader } from '@/ui/Game';
import { Icon } from '@/ui/Icon';
import { Portrait, lookForCharacter } from '@/art/Bust';
import { useGame, useTheme } from '@/state/GameProvider';
import { Week } from '@/assessment/types';
import { weekTitle } from '@/state/flow';
import { BUILDINGS, stageOf } from '@/game/world/buildings';
import { DISTRICTS, isDistrictUnlocked } from '@/game/world/districts';
import { CHARACTERS, CharacterId } from '@/game/characters/characters';
import { meters } from '@/game/progression/town';
import { radius, space } from '@/ui/tokens';

export default function Progress() {
  const { s, engine } = useGame();
  const { c, reducedMotion } = useTheme();
  const reached = engine.reachedWeek();
  const m = meters(s.town, reached);
  const opened = BUILDINGS.filter((b) => stageOf(s.town.progress[b.id]) === 4).length;
  const statusText = { completed: 'Done', in_progress: 'In progress', available: 'Ready to play', locked: 'Locked' } as const;
  const statusIcon = { completed: 'check', in_progress: 'play', available: 'star', locked: 'lock' } as const;
  return (
    <Screen>
      <ScreenHeader title="Progress" speak={`Progress. Buildings open: ${opened} of ${BUILDINGS.length}. Homes rebuilt: ${m.homes}.`} />
      <Panel title="Your journey" icon="calendar">
        {([0, 1, 2, 3, 4] as Week[]).map((w) => {
          const st = engine.weekStatus(w);
          return (
            <View key={w} accessible accessibilityLabel={`${weekTitle(w)}: ${statusText[st]}`} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 6 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: st === 'completed' ? c.success : st === 'locked' ? c.border : c.primary }}>
                <Icon name={statusIcon[st]} size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <GText variant="bodyBold">{weekTitle(w)}</GText>
                <GText variant="small" soft>{statusText[st]}{s.unmeasuredWeeks.includes(w) ? ' · accessible mode (not measured)' : ''}</GText>
              </View>
            </View>
          );
        })}
      </Panel>
      <Panel title="Your town" icon="home">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {[['Buildings open', `${opened}/${BUILDINGS.length}`], ['Homes rebuilt', `${m.homes}`], ['Happiness', `${m.happiness}%`], ['Balance', `${m.balance}%`],
            ['Districts open', `${DISTRICTS.filter((d) => isDistrictUnlocked(d.id, reached)).length}/6`], ['Grant', `Rs ${s.town.grant}`]].map(([l, v]) => (
            <View key={l} style={{ width: '31%', padding: space.sm, borderRadius: radius.md, backgroundColor: c.bgAlt, alignItems: 'center' }}>
              <GText variant="heading">{v}</GText><GText variant="small" soft center>{l}</GText>
            </View>
          ))}
        </View>
      </Panel>
      <Panel title="People of Naya Shehar" icon="person">
        {(Object.keys(CHARACTERS) as CharacterId[]).map((id) => (
          <View key={id} style={{ flexDirection: 'row', gap: space.md, alignItems: 'center', paddingVertical: 4 }}>
            <Portrait look={lookForCharacter(id)} size={56} reducedMotion={reducedMotion} />
            <View style={{ flex: 1 }}>
              <GText variant="bodyBold">{CHARACTERS[id].name}</GText>
              <GText variant="small" soft>{CHARACTERS[id].role}</GText>
              <GText variant="small">{CHARACTERS[id].bio}</GText>
            </View>
          </View>
        ))}
      </Panel>
      <Panel title="Recent activity" icon="star">
        {s.history.length === 0 ? <GText soft>Nothing yet — start your first week!</GText> : null}
        {s.history.filter((h) => h.kind !== 'puzzle').slice(-8).reverse().map((h, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
            <Icon name={h.kind === 'build' || h.kind === 'fund' ? 'hammer' : 'hands'} size={18} color={c.primaryDeep} />
            <GText variant="small" style={{ flex: 1 }}>{h.kind === 'build' || h.kind === 'fund' ? `Built: ${BUILDINGS.find((b) => b.id === h.label)?.name ?? h.label}` : h.label}</GText>
            <GText variant="label" soft>{h.week === 0 ? 'Prologue' : `Week ${h.week}`}</GText>
          </View>
        ))}
        <GText variant="small" soft>{`Challenges completed: ${s.history.filter((h) => h.kind === 'puzzle').length}`}</GText>
      </Panel>
    </Screen>
  );
}

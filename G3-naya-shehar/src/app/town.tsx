import { useEffect, useRef, useState } from 'react';
import { ScrollView, View, useWindowDimensions, Pressable, type ScrollViewInstance } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame, useTheme } from '@/state/GameProvider';
import { TownMap, MAP_W, MAP_H, districtCenter } from '@/art/TownMap';
import { Hud } from '@/ui/Hud';
import { GameButton, IconButton } from '@/ui/Button';
import { GText } from '@/ui/Text';
import { Icon, DISTRICT_ICON } from '@/ui/Icon';
import { SpeakButton } from '@/ui/Speak';
import { DISTRICTS, DistrictId, isDistrictUnlocked } from '@/game/world/districts';
import { BUILDINGS, stageOf } from '@/game/world/buildings';
import { canFund } from '@/game/progression/town';
import { nextAction } from '@/state/flow';
import { elevation, radius, space } from '@/ui/tokens';
import { audio } from '@/services/audio';

/** Main hub: the living isometric town. Pan by dragging; district chips jump to an area. */
export default function TownScreen() {
  const { engine, s } = useGame();
  const { c, reducedMotion, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const hRef = useRef<ScrollViewInstance>(null);
  const vRef = useRef<ScrollViewInstance>(null);
  const week = engine.reachedWeek();
  const next = nextAction(engine);
  const [focus, setFocus] = useState<DistrictId>('community_square');

  useEffect(() => { audio.ambience(true); return () => audio.ambience(false); }, []);

  const jump = (id: DistrictId, animated = true) => {
    setFocus(id);
    const p = districtCenter(id);
    hRef.current?.scrollTo({ x: Math.max(0, p.x - width / 2), animated: animated && !reducedMotion });
    vRef.current?.scrollTo({ y: Math.max(0, p.y - height * 0.42), animated: animated && !reducedMotion });
  };
  useEffect(() => { const t = setTimeout(() => jump('community_square', false), 50); return () => clearTimeout(t); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fundable = BUILDINGS.filter((b) => canFund(s.town, b.id, week) && stageOf(s.town.progress[b.id]) < 4).map((b) => b.id);

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#1E2A3E' : '#BFE6FF' }}>
      <ScrollView ref={vRef} style={{ flex: 1 }} contentContainerStyle={{ paddingTop: insets.top + 54 }} showsVerticalScrollIndicator={false} bounces={false}>
        <ScrollView ref={hRef} horizontal showsHorizontalScrollIndicator={false} bounces={false}>
          <View style={{ width: MAP_W, height: MAP_H + 180 }}>
            <TownMap
              town={s.town}
              week={week}
              reducedMotion={reducedMotion}
              night={isDark}
              festive={week >= 4}
              highlight={s.session ? [] : fundable.slice(0, 3)}
              onPressBuilding={(id) => router.push({ pathname: '/building/[id]', params: { id } })}
              onPressDistrict={(id) => router.push({ pathname: '/district/[id]', params: { id } })}
            />
          </View>
        </ScrollView>
      </ScrollView>

      <Hud overlay right={<IconButton icon="map" label="Progress overview" onPress={() => router.push('/progress')} />} />

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: insets.bottom + space.md, paddingHorizontal: space.md, gap: space.sm }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingRight: space.md }}>
          {DISTRICTS.map((d) => {
            const open = isDistrictUnlocked(d.id, week);
            const active = focus === d.id;
            return (
              <Pressable key={d.id} accessibilityRole="button" accessibilityLabel={`${d.name}${open ? '' : ', locked'}`}
                onPress={() => { jump(d.id); }} onLongPress={() => router.push({ pathname: '/district/[id]', params: { id: d.id } })}
                style={[{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 48, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: active ? d.accent : c.surfaceRaised, borderWidth: 2, borderColor: active ? d.accent : c.border }, elevation(1)]}>
                <Icon name={open ? DISTRICT_ICON[d.icon] : 'lock'} size={20} color={active ? '#FFFFFF' : open ? d.accent : c.locked} />
                <GText variant="label" color={active ? '#FFFFFF' : open ? c.text : c.locked}>{d.name}</GText>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={[{ backgroundColor: c.surface, borderRadius: radius.lg, padding: space.md, borderWidth: 2, borderColor: c.border, gap: space.sm }, elevation(2)]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <View style={{ flex: 1 }}>
              <GText variant="label" soft>{next.kind === 'locked' ? 'COMING SOON' : 'NEXT UP'}</GText>
              <GText variant="sub" numberOfLines={2}>{next.detail}</GText>
            </View>
            <SpeakButton text={`${next.detail}. ${next.label}.`} size={44} />
          </View>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <GameButton style={{ flex: 1 }} label="District" icon="eye" variant="ghost" size="sm" onPress={() => router.push({ pathname: '/district/[id]', params: { id: focus } })} />
            <GameButton style={{ flex: 2 }} label={next.label} icon={next.kind === 'locked' ? 'calendar' : 'play'} size="sm" onPress={() => router.push(next.route)} testID="next-action" />
          </View>
        </View>
      </View>
    </View>
  );
}

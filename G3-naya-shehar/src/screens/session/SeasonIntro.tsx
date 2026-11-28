import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { ScoredWeek } from '@/assessment/types';
import { SEASONS } from '@/game/story/dialogue';
import { DISTRICTS } from '@/game/world/districts';
import { GText } from '@/ui/Text';
import { GameButton } from '@/ui/Button';
import { Appear, Panel, Pill } from '@/ui/Layout';
import { Icon, DISTRICT_ICON } from '@/ui/Icon';
import { space, radius } from '@/ui/tokens';
import { useTheme } from '@/state/GameProvider';

/** Season title card: big painted sky, season name, the town's problem and what opens this week. */
export function SeasonIntro({ week, onNext }: { week: ScoredWeek; onNext: () => void }) {
  const { c } = useTheme();
  const se = SEASONS[week];
  const opened = DISTRICTS.filter((d) => d.unlockWeek === week);
  return (
    <View style={{ gap: space.lg }}>
      <Appear>
        <View style={{ borderRadius: radius.xl, overflow: 'hidden' }}>
          <SeasonArt week={week} />
          <View style={{ position: 'absolute', left: space.lg, bottom: space.lg, right: space.lg }}>
            <GText variant="label" color="#FFFFFF">{`WEEK ${week}`}</GText>
            <GText variant="hero" color="#FFFFFF" style={{ textShadowColor: '#00000055', textShadowRadius: 6, textShadowOffset: { width: 0, height: 2 } }}>{se.name}</GText>
            <GText variant="heading" color="#FFFFFF">{se.theme}</GText>
          </View>
        </View>
      </Appear>
      <Appear delay={150}>
        <Panel title="The town needs you" icon="megaphone" speak={`Week ${week}, ${se.name}. ${se.theme}. ${se.problem}${opened.length ? ` New places open: ${opened.map((d) => d.name).join(' and ')}.` : ''}`}>
          <GText>{se.problem}</GText>
          {opened.length ? (
            <View style={{ gap: space.sm, marginTop: space.sm }}>
              <GText variant="label" soft>NEW PLACES OPEN</GText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                {opened.map((d) => <Pill key={d.id} label={d.name} icon={DISTRICT_ICON[d.icon]} color={d.accent} textColor="#FFFFFF" />)}
              </View>
            </View>
          ) : week === 4 ? <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}><Icon name="map" color={c.success} /><GText variant="bodyBold">The whole town is open!</GText></View> : null}
        </Panel>
      </Appear>
      <GameButton label="Let's begin" icon="play" size="lg" onPress={onNext} testID="season-begin" />
    </View>
  );
}

export function SeasonArt({ week, height = 220 }: { week: ScoredWeek; height?: number }) {
  const se = SEASONS[week];
  return (
    <Svg width="100%" height={height} viewBox="0 0 360 220" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id={`s${week}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={se.sky[0]} />
          <Stop offset="1" stopColor={se.sky[1]} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={360} height={220} fill={`url(#s${week})`} />
      {week === 3 ? <Path d="M40 50 Q60 20 100 36 Q130 10 170 34 Q210 28 205 60 H40 Z M200 70 Q230 40 270 58 Q300 44 320 70 Z" fill="#6F7F93" /> : <Circle cx={290} cy={58} r={30} fill={week === 4 ? '#FFE8B0' : '#FFD166'} />}
      <Path d="M0 150 Q60 100 130 135 T260 120 T360 128 V220 H0 Z" fill={se.ground} opacity={0.75} />
      <Path d="M0 170 Q90 140 180 165 T360 160 V220 H0 Z" fill={se.ground} />
      {/* skyline */}
      {[30, 70, 120, 200, 250, 300].map((x, i) => <Rect key={x} x={x} y={130 - (i % 3) * 14} width={34} height={50 + (i % 3) * 14} fill={['#F6D7A7', '#F2C0A2', '#DDE8C4', '#C9DDEE', '#F1D6E4', '#EBDDC3'][i]} />)}
      {[30, 70, 120, 200, 250, 300].map((x, i) => <Rect key={`r${x}`} x={x - 2} y={126 - (i % 3) * 14} width={38} height={5} fill="#FFFFFF" opacity={0.8} />)}
      {week === 1 ? [40, 90, 160, 230, 310].map((x) => <Circle key={x} cx={x} cy={190} r={6} fill="#F7A1C4" />) : null}
      {week === 3 ? Array.from({ length: 40 }, (_, i) => <Path key={i} d={`M${(i * 37) % 360} ${(i * 23) % 200} l-5 14`} stroke="#5D7A9C" strokeWidth={1.5} opacity={0.5} />) : null}
      {week === 4 ? Array.from({ length: 14 }, (_, i) => <Path key={i} d={`M${12 + i * 26} 98 l7 0 l-3.5 9z`} fill={['#E2589B', '#FFD166', '#3FAE6A', '#5B8DEF'][i % 4]} />) : null}
      {week === 4 ? <Path d="M0 96 Q180 112 360 96" stroke="#5D5468" strokeWidth={1} fill="none" /> : null}
      {week === 2 ? <Path d="M150 110 h60 v-28 l-30 -18 l-30 18 z" fill="#F6E7B8" stroke="#3FAE6A" strokeWidth={3} /> : null}
      <Rect x={0} y={150} width={360} height={70} fill="#000" opacity={0.18} />
    </Svg>
  );
}

import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame, useTheme } from '@/state/GameProvider';
import { meters } from '@/game/progression/town';
import { IconButton } from './Button';
import { Icon, IconName } from './Icon';
import { GText } from './Text';
import { elevation, radius, space } from './tokens';

function Chip({ icon, value, label, colour }: { icon: IconName; value: string; label: string; colour: string }) {
  const { c } = useTheme();
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.surfaceRaised, borderRadius: radius.pill, paddingLeft: 6, paddingRight: 10, height: 34, borderWidth: 2, borderColor: c.border }, elevation(1)]}>
      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colour, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={16} color="#FFFFFF" />
      </View>
      <GText variant="label">{value}</GText>
    </View>
  );
}

/**
 * In-game HUD: town meters, grant and an ALWAYS-visible pause button.
 * Meters are gameplay rewards only and are never used for assessment.
 */
export function Hud({ overlay = false, right }: { overlay?: boolean; right?: React.ReactNode }) {
  const { s, engine } = useGame();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const m = meters(s.town, engine.reachedWeek());
  return (
    <View style={{ position: overlay ? 'absolute' : 'relative', top: overlay ? insets.top + space.sm : 0, left: overlay ? space.md : 0, right: overlay ? space.md : 0, flexDirection: 'row', alignItems: 'center', gap: 6, zIndex: 10 }}>
      <IconButton icon="pause" label="Pause" onPress={() => router.push('/pause')} tone="primary" testID="pause" />
      <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <Chip icon="home" value={`${m.homes}`} label="Homes rebuilt" colour="#E9873A" />
        <Chip icon="smile" value={`${m.happiness}%`} label="Happiness" colour="#3FAE6A" />
        <Chip icon="balance" value={`${m.balance}%`} label="Balance" colour="#8A6FD1" />
        <Chip icon="coin" value={`${s.town.grant}`} label="Grant rupees" colour="#D9A02B" />
      </View>
      {right}
    </View>
  );
}

// Main tabs from S-07: Home, Explore, Family, You. Icons are Lucide, outline, 2 px stroke, 24 px.
// The tab order mirrors automatically in Urdu (right to left).

import { Tabs } from 'expo-router';
import { Compass, House, User, Users, type LucideIcon } from 'lucide-react-native';
import type { ColorValue } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { useTheme } from '@/theme/ThemeProvider';

export const unstable_settings = { anchor: 'home' };

const colorOf = (color: ColorValue) => (typeof color === 'string' ? color : undefined);

function icon(Icon: LucideIcon) {
  function TabIcon({ color }: { color: ColorValue }) {
    return <Icon color={colorOf(color)} size={24} strokeWidth={2} />;
  }
  return TabIcon;
}

// Labels use AppText so Urdu gets Gulzar with enough headroom (the bar of گ is otherwise cut off).
function label(text: string) {
  function TabLabel({ color }: { color: ColorValue }) {
    return (
      <AppText variant="caption" style={{ color: colorOf(color) }} numberOfLines={1}>
        {text}
      </AppText>
    );
  }
  return TabLabel;
}

export default function TabsLayout() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const urdu = i18n.language === 'ur';
  const tab = (key: 'home' | 'explore' | 'family' | 'you', Icon: LucideIcon) => ({
    title: t(`tabs.${key}`),
    tabBarLabel: label(t(`tabs.${key}`)),
    tabBarIcon: icon(Icon),
  });
  return (
    <Tabs
      backBehavior="initialRoute"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryText,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, minHeight: urdu ? 88 : 64 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="home" options={tab('home', House)} />
      <Tabs.Screen name="explore" options={tab('explore', Compass)} />
      <Tabs.Screen name="family" options={tab('family', Users)} />
      <Tabs.Screen name="you" options={tab('you', User)} />
    </Tabs>
  );
}

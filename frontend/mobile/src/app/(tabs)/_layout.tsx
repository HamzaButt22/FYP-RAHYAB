// Main tabs from S-07: Home, Explore, Family, You. Icons are Lucide, outline, 2 px stroke, 24 px.

import { Tabs } from 'expo-router';
import { Compass, House, User, Users, type LucideIcon } from 'lucide-react-native';
import { useWindowDimensions, type ColorValue } from 'react-native';
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

// Labels use AppText (the brand type scale). They stop growing at 1.3x the phone's font scale, like
// display text, and the bar grows with them, so large text settings never push them out of the bar.
const LABEL_MAX_SCALE = 1.3;

function label(text: string) {
  function TabLabel({ color }: { color: ColorValue }) {
    return (
      <AppText
        variant="caption"
        style={{ color: colorOf(color) }}
        numberOfLines={1}
        maxFontSizeMultiplier={LABEL_MAX_SCALE}
      >
        {text}
      </AppText>
    );
  }
  return TabLabel;
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const barHeight = Math.round(64 * Math.min(Math.max(fontScale, 1), LABEL_MAX_SCALE));
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
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, minHeight: barHeight },
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

// The start address ("/"): sends the student to the right place for where they are.
// Each group is also locked with Stack.Protected in _layout.tsx, so a deep link cannot skip a step.

import { Redirect } from 'expo-router';

import { useAppState } from '@/state/AppState';

export default function Start() {
  const { session, onboardingDone } = useAppState();
  if (!session) return <Redirect href="/welcome" />;
  if (!onboardingDone) return <Redirect href="/consent" />;
  return <Redirect href="/home" />;
}

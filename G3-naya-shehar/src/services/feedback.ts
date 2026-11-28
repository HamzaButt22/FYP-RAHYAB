import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

let hapticsOn = true;
let rate = 0.95;

export const feedback = {
  setHaptics(on: boolean) { hapticsOn = on; },
  setSpeechRate(r: number) { rate = r; },
  tap() { if (hapticsOn && Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {}); },
  success() { if (hapticsOn && Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); },
  soft() { if (hapticsOn && Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); },
};

type Listener = (speakingId: string | null) => void;
const listeners = new Set<Listener>();
let current: string | null = null;
const emit = (id: string | null) => { current = id; listeners.forEach((l) => l(id)); };

/** Read-aloud using the device's on-board text-to-speech (works offline where the voice is installed). */
export const speech = {
  speak(id: string, text: string) {
    Speech.stop();
    if (current === id) { emit(null); return; }
    emit(id);
    Speech.speak(text.replace(/[—–]/g, ', '), {
      language: 'en', rate, pitch: 1.0,
      onDone: () => emit(null), onStopped: () => { if (current === id) emit(null); }, onError: () => emit(null),
    });
  },
  stop() { Speech.stop(); emit(null); },
  subscribe(l: Listener) { listeners.add(l); return () => { listeners.delete(l); }; },
  get speakingId() { return current; },
};

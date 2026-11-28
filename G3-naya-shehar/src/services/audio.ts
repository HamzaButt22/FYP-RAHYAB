import { createAudioPlayer, AudioPlayer, setAudioModeAsync } from 'expo-audio';

const SOURCES = {
  tap: require('../../assets/sounds/tap.wav'),
  select: require('../../assets/sounds/select.wav'),
  success: require('../../assets/sounds/success.wav'),
  gentle: require('../../assets/sounds/gentle.wav'),
  build: require('../../assets/sounds/build.wav'),
  fanfare: require('../../assets/sounds/fanfare.wav'),
  page: require('../../assets/sounds/page.wav'),
  blip: require('../../assets/sounds/blip.wav'),
  ambience: require('../../assets/sounds/ambience.wav'),
} as const;
export type SoundName = keyof typeof SOURCES;

/**
 * Optional sound. Never required to understand gameplay: every sound has a
 * visual equivalent. Players are created lazily and reused (no leaks).
 */
class AudioService {
  private players = new Map<SoundName, AudioPlayer>();
  private enabled = true;
  private ready = false;

  async init() {
    if (this.ready) return;
    this.ready = true;
    try { await setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }); } catch { /* not fatal */ }
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (!on) this.players.forEach((p) => { try { p.pause(); } catch { /* ignore */ } });
    else this.ambience(true);
  }

  private get(name: SoundName) {
    let p = this.players.get(name);
    if (!p) {
      p = createAudioPlayer(SOURCES[name]);
      this.players.set(name, p);
    }
    return p;
  }

  play(name: SoundName, volume = 0.7) {
    if (!this.enabled) return;
    try {
      const p = this.get(name);
      p.volume = volume;
      p.seekTo(0);
      p.play();
    } catch { /* audio is decorative */ }
  }

  ambience(on: boolean) {
    try {
      const p = this.get('ambience');
      p.loop = true;
      p.volume = 0.25;
      if (on && this.enabled) p.play(); else p.pause();
    } catch { /* ignore */ }
  }

  dispose() {
    this.players.forEach((p) => { try { p.remove(); } catch { /* ignore */ } });
    this.players.clear();
  }
}

export const audio = new AudioService();

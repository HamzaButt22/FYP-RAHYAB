/** Music + sound effects with expo-audio. Every call is wrapped so a sound problem can never crash the game. */
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { AUDIO } from '../assets/registry';
import { Settings } from './settings';

export class AudioManager {
  private music: AudioPlayer | null = null;
  private musicName: string | null = null;
  private sfxPlayers: Record<string, AudioPlayer> = {};
  private fadeTimer: ReturnType<typeof setInterval> | null = null;
  private suspended = false;

  constructor(private getSettings: () => Settings) {
    setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false }).catch(() => undefined);
  }

  private get musicVol() {
    const s = this.getSettings();
    return s.music_on ? s.music_volume * 0.55 : 0;
  }

  playMusic(name: string | null | undefined) {
    if (!name || name === this.musicName) return;
    this.musicName = name;
    try {
      const src = AUDIO[name];
      if (!src) return;
      if (!this.music) {
        this.music = createAudioPlayer(src);
      } else {
        this.music.replace(src);
      }
      this.music.loop = true;
      this.music.volume = 0;
      if (!this.suspended && this.musicVol > 0) this.music.play();
      this.fadeTo(this.musicVol);
    } catch {
      /* ignore */
    }
  }

  private fadeTo(target: number) {
    if (this.fadeTimer) clearInterval(this.fadeTimer);
    const p = this.music;
    if (!p) return;
    const start = p.volume ?? 0;
    let k = 0;
    this.fadeTimer = setInterval(() => {
      k += 1;
      try {
        p.volume = start + (target - start) * Math.min(1, k / 8);
      } catch {
        /* ignore */
      }
      if (k >= 8 && this.fadeTimer) {
        clearInterval(this.fadeTimer);
        this.fadeTimer = null;
      }
    }, 50);
  }

  /** Called after settings change. */
  apply() {
    try {
      if (!this.music) return;
      if (this.musicVol <= 0) this.music.pause();
      else if (!this.suspended) {
        this.music.volume = this.musicVol;
        this.music.play();
      }
    } catch {
      /* ignore */
    }
  }

  play(name: string, vol = 1) {
    const s = this.getSettings();
    if (!s.sfx_on || this.suspended) return;
    try {
      const src = AUDIO[name];
      if (!src) return;
      let p = this.sfxPlayers[name];
      if (!p) {
        p = createAudioPlayer(src);
        this.sfxPlayers[name] = p;
      }
      p.volume = Math.max(0, Math.min(1, vol * s.sfx_volume));
      p.seekTo(0).catch(() => undefined);
      p.play();
    } catch {
      /* ignore */
    }
  }

  /** App went to the background / came back. */
  suspend(v: boolean) {
    this.suspended = v;
    try {
      if (v) this.music?.pause();
      else if (this.music && this.musicVol > 0) this.music.play();
    } catch {
      /* ignore */
    }
  }
}

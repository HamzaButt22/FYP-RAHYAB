// Pure helpers for read-aloud (FR-96), tested with `pnpm test` (speech.test.ts): split text into the
// sentences that are read and highlighted one at a time, and choose an English voice.

/** Sentences in reading order. A line break also ends a sentence; empty pieces are dropped. */
export function sentences(text: string): string[] {
  return text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?…])\s+(?=\S)/))
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export type VoiceInfo = { identifier: string; language: string; quality?: string };

/**
 * The English voice to use, or null when the phone lists voices but none is English. An empty list means
 * "not known yet" (some phones list voices only after the engine starts), so the default voice is tried.
 */
export function chooseVoice(voices: readonly VoiceInfo[]): { voice: string | undefined } | null {
  if (voices.length === 0) return { voice: undefined };
  const english = voices.filter((v) => v.language.toLowerCase().replace('_', '-').startsWith('en'));
  if (english.length === 0) return null;
  // Prefer an enhanced voice, then a South Asian or British English one, then any English voice.
  const rank = (v: VoiceInfo) =>
    (v.quality === 'Enhanced' ? 0 : 2) + (/^en-(in|pk|gb)/i.test(v.language.replace('_', '-')) ? 0 : 1);
  return { voice: [...english].sort((a, b) => rank(a) - rank(b))[0].identifier };
}

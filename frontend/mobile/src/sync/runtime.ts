// The app's one outbox and one sync worker, and when they run (RFC-0002):
// - when the app comes to the foreground, every 15 minutes while it is open, and after a run ends;
// - only after the family's consent; before it, nothing is sent and events older than 14 days are
//   deleted on the phone (FR-05);
// - when consent arrives, at once.

import { useEffect } from 'react';
import { AppState } from 'react-native';

import { randomHex } from '../../modules/device-key';
import { postJson } from '../api/client';
import type { EventSink } from '../game/run';
import { getAccessToken, type ConsentState } from '../state/session';
import { KEEP_UNCONSENTED_MS, type OutboxStore } from './outbox';
import { uuidv7 } from '../game/run';
import { openLocal, type SqliteKv } from './sqliteOutbox';
import { Syncer, type BatchResult, type SendResult, type SyncOutcome } from './sync';

const EVERY_MS = 15 * 60_000;

let local: ReturnType<typeof openLocal> | null = null;
let syncer: Promise<Syncer> | null = null;

/** One sitting per app launch: every run started while the app is open shares it (envelope session_id). */
export const SESSION_ID = uuidv7(Date.now());

function getLocal(): ReturnType<typeof openLocal> {
  local ??= openLocal();
  return local;
}

export async function getOutbox(): Promise<OutboxStore> {
  return (await getLocal()).outbox;
}

/** Week progress and modules' saved state (src/game/progress.ts). */
export async function getKv(): Promise<SqliteKv> {
  return (await getLocal()).kv;
}

/** Writes each event to the encrypted outbox before the game moves on (FR-35). */
export function outboxSink(store: OutboxStore): EventSink {
  return { add: (event) => store.add(event, Date.now()) };
}

function uuid4(): string {
  const h = randomHex(16).split('');
  h[12] = '4';
  h[16] = ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16);
  const s = h.join('');
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

async function send(events: unknown[], idempotencyKey: string): Promise<SendResult> {
  const access = await getAccessToken();
  if (!access.ok) return access.reason === 'offline' ? { ok: false, kind: 'offline' } : { ok: false, kind: 'signed_out' };
  const r = await postJson<BatchResult>(
    '/events:batch',
    { events },
    { accessToken: access.token, headers: { 'Idempotency-Key': idempotencyKey } }
  );
  if (r.ok) return { ok: true, data: r.data };
  if (r.kind === 'offline') return r;
  return { ok: false, kind: 'problem', status: r.status, code: r.code, retryAfterSeconds: r.retryAfterSeconds };
}

export function getSyncer(): Promise<Syncer> {
  syncer ??= getOutbox().then(
    (store) => new Syncer({ store, send, now: Date.now, random: Math.random, newKey: uuid4 })
  );
  return syncer;
}

export async function syncNow(): Promise<SyncOutcome> {
  return (await getSyncer()).syncNow();
}

/** Runs the sync while a student is signed in. Put once in the root layout. */
export function useBackgroundSync(consentState: ConsentState | null): void {
  useEffect(() => {
    if (consentState === null) return; // nobody signed in
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      try {
        if (consentState === 'granted') {
          await syncNow();
        } else {
          (await getOutbox()).dropQueuedBefore(Date.now() - KEEP_UNCONSENTED_MS);
        }
      } catch (error) {
        if (__DEV__) console.warn('sync failed', error); // the next trigger tries again
      }
    };
    if (consentState === 'granted') void getSyncer().then((s) => s.wake());
    void run();
    const timer = setInterval(run, EVERY_MS);
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') void run();
    });
    return () => {
      cancelled = true;
      clearInterval(timer);
      listener.remove();
    };
  }, [consentState]);
}

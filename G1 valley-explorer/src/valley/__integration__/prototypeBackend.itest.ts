/**
 * @jest-environment node
 *
 * End-to-end: real level machines -> GameSession -> outbox -> PrototypeBackendSink -> real Flask backend.
 * Run with: npm run test:integration  (starts the Python backend; see tools/run_integration.sh)
 */
import { GameSession } from '../services/session';
import { PrototypeBackendSink } from '../services/sinks';
import { MemoryStore } from '../services/storage';
import { PERSONAS, playJourney } from '../testing/bots';

const BASE = process.env.VE_BACKEND_URL;
const maybe = BASE ? describe : describe.skip;

maybe('Prototype backend integration', () => {
  it('uploads a full journey exactly once, even when batches are re-sent', async () => {
    let mapping: { playerId: number; serverSessionId: string } | null = null;
    const sink = new PrototypeBackendSink({ baseUrl: BASE!, loadMapping: async () => mapping, saveMapping: async (m) => { mapping = m; } });
    let clock = 0;
    const { session } = await GameSession.open({
      studentId: 'P-INTEG-1', consentGranted: true, language: 'en', mode: 'research', eventSink: sink, storage: new MemoryStore(),
      onComplete: () => {}, onExit: () => {}, now: () => clock,
    });
    await playJourney(session, PERSONAS.organiser, (ms) => { clock += ms; });
    const output = await session.finish();
    await session.sync.flush();
    session.sync.stop();
    const local = await session.events();
    expect(await session.store.countUnsent(session.sessionId)).toBe(0);

    const res = await fetch(`${BASE}/api/sessions/${mapping!.serverSessionId}/events?limit=5000`);
    const body = await res.json();
    expect(body.total).toBe(local.length);

    // simulate a crash after send but before markSent: everything is sent again
    await sink.send(local);
    const again = await (await fetch(`${BASE}/api/sessions/${mapping!.serverSessionId}/events?limit=1`)).json();
    expect(again.total).toBe(local.length);

    // the backend's Big Five (Python port) agrees exactly with the app's own result
    const b5 = await (await fetch(`${BASE}/api/sessions/${mapping!.serverSessionId}/bigfive`)).json();
    for (const t of ['O', 'C', 'E', 'A', 'N'] as const) {
      expect(b5.questionnaire.traits[t].score).toBe(output.bigfive.questionnaire.traits[t].score);
      expect(b5.questionnaire.traits[t].answered).toBe(output.bigfive.questionnaire.traits[t].answered);
      expect(b5.behaviour[t].score).toBe(output.bigfive.behaviour[t].score);
    }
    expect(b5.comparison).toEqual(output.bigfive.comparison);
    expect(b5.questionnaire.answered + b5.questionnaire.skipped).toBe(20);

    // the server never received a real name
    const players = await (await fetch(`${BASE}/api/players`)).json();
    expect(players.find((p: any) => p.player_id === mapping!.playerId).name).toBe('participant-P-INTEG-1');
  }, 60000);
});

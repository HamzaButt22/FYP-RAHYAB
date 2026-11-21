/**
 * Background upload of the outbox with exponential back-off.
 * - Batches of up to 50 events, oldest first.
 * - Only one flush runs at a time (re-entrant calls join the running flush).
 * - Events are marked sent only after the sink confirms; a crash between send and mark simply resends,
 *   which is safe because sinks de-duplicate by event_id.
 * - Non-retryable errors (e.g. HTTP 4xx validation) stop the loop and are reported via onError; the
 *   events stay in the outbox for inspection rather than being dropped.
 */
import type { EventStore } from './eventStore';
import { SinkError, type EventSink } from './sinks';

export interface SyncStatus {
  pending: number;
  lastError: string | null;
  syncing: boolean;
}

export class SyncWorker {
  private running: Promise<void> | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private failures = 0;
  private stopped = false;
  status: SyncStatus = { pending: 0, lastError: null, syncing: false };

  constructor(
    private store: EventStore,
    private sink: EventSink,
    private sessionId: string,
    private opts: { batchSize?: number; baseDelayMs?: number; maxDelayMs?: number; onStatus?: (s: SyncStatus) => void; onError?: (e: unknown) => void } = {},
  ) {}

  /** Request a flush soon (debounced). */
  schedule(delayMs = 1500) {
    if (this.stopped || this.timer) return;
    this.timer = setTimeout(() => { this.timer = null; void this.flush(); }, delayMs);
  }

  async flush(): Promise<void> {
    if (this.stopped) return;
    if (this.running) return this.running;
    this.running = this.doFlush().finally(() => { this.running = null; });
    return this.running;
  }

  private emit(patch: Partial<SyncStatus>) {
    this.status = { ...this.status, ...patch };
    this.opts.onStatus?.(this.status);
  }

  private async doFlush() {
    const size = this.opts.batchSize ?? 50;
    this.emit({ syncing: true });
    try {
      for (;;) {
        const batch = await this.store.unsent(this.sessionId, size);
        if (!batch.length) break;
        await this.sink.send(batch);
        await this.store.markSent(this.sessionId, batch);
        this.failures = 0;
      }
      this.emit({ lastError: null });
    } catch (err) {
      this.failures++;
      const retryable = !(err instanceof SinkError) || err.retryable;
      this.emit({ lastError: String((err as Error)?.message ?? err) });
      this.opts.onError?.(err);
      if (retryable && !this.stopped) {
        const delay = Math.min(this.opts.maxDelayMs ?? 60000, (this.opts.baseDelayMs ?? 2000) * 2 ** (this.failures - 1));
        this.schedule(delay);
      }
    } finally {
      this.emit({ syncing: false, pending: await this.store.countUnsent(this.sessionId) });
    }
  }

  stop() {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
}

import type { PullRequestEvent } from '@surf/types';

/**
 * Scheduler interface — the "downgrade seam" between demo (instant) and
 * production (throttled) modes.
 *
 * Coalescing key: `prUrl` — uniquely identifies a pull request. Two enqueues
 * for the same prUrl before the flush window fires are collapsed into one
 * invocation; the last enqueued event wins (last-write-wins semantics).
 */
export interface Scheduler {
  enqueue(event: PullRequestEvent): void;
  runNow(): Promise<void>;
}

// ---------------------------------------------------------------------------
// InstantScheduler — demo mode
//
// Behaviour:
//   - Coalesces pending events per prUrl (last-write-wins).
//   - Schedules execution on the next macrotask tick via setTimeout(0).
//   - runNow() cancels any pending timer and flushes immediately.
// ---------------------------------------------------------------------------

export class InstantScheduler implements Scheduler {
  private readonly run: (event: PullRequestEvent) => Promise<void>;
  /** Pending events keyed by prUrl — last write wins. */
  private pending: Map<string, PullRequestEvent> = new Map();
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(run: (event: PullRequestEvent) => Promise<void>) {
    this.run = run;
  }

  enqueue(event: PullRequestEvent): void {
    // Last-write-wins coalescing: overwrite any prior event for this PR.
    this.pending.set(event.prUrl, event);

    // Arm a single next-tick flush if not already armed.
    if (this.timer === null) {
      this.timer = setTimeout(() => {
        this.timer = null;
        void this.flush();
      }, 0);
    }
  }

  async runNow(): Promise<void> {
    // Cancel any scheduled timer so flush doesn't double-fire.
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    await this.flush();
  }

  private async flush(): Promise<void> {
    const snapshot = new Map(this.pending);
    this.pending.clear();
    for (const event of snapshot.values()) {
      await this.run(event);
    }
  }
}

// ---------------------------------------------------------------------------
// ThrottledScheduler — production mode
//
// Behaviour:
//   - Coalesces pending events per prUrl (last-write-wins).
//   - Does NOT fire until the debounce window elapses without a new enqueue
//     (restarts the timer on each enqueue, standard debounce semantics).
//   - stabilize() is a no-op placeholder; Task 11 may use it as a hook before
//     the pipeline runs (e.g. wait for CI checks to settle).
//   - runNow() cancels the debounce timer and flushes immediately.
// ---------------------------------------------------------------------------

export interface ThrottledSchedulerConfig {
  debounceMs: number;
}

export class ThrottledScheduler implements Scheduler {
  private readonly run: (event: PullRequestEvent) => Promise<void>;
  private readonly debounceMs: number;
  /** Pending events keyed by prUrl — last write wins. */
  private pending: Map<string, PullRequestEvent> = new Map();
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    run: (event: PullRequestEvent) => Promise<void>,
    config: ThrottledSchedulerConfig,
  ) {
    this.run = run;
    this.debounceMs = config.debounceMs;
  }

  enqueue(event: PullRequestEvent): void {
    // Last-write-wins coalescing.
    this.pending.set(event.prUrl, event);

    // Reset / restart the debounce timer on each enqueue.
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.stabilize().then(() => this.flush());
    }, this.debounceMs);
  }

  async runNow(): Promise<void> {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    await this.stabilize();
    await this.flush();
  }

  /**
   * No-op placeholder. Task 11 may replace or extend this with a real
   * stabilization step (e.g. poll GitHub CI status before triggering the
   * pipeline).
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async stabilize(): Promise<void> {
    // no-op for now
  }

  private async flush(): Promise<void> {
    const snapshot = new Map(this.pending);
    this.pending.clear();
    for (const event of snapshot.values()) {
      await this.run(event);
    }
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export type SchedulerMode = 'instant' | 'throttled';

export interface SchedulerFactoryConfig {
  schedulerMode: SchedulerMode;
  debounceMs?: number;
}

/**
 * Returns the correct Scheduler implementation based on config.schedulerMode.
 *
 * @param config  - Must include schedulerMode; optionally debounceMs for
 *                  throttled mode (defaults to 30 000 ms / 30 s).
 * @param run     - The pipeline callback. Injected here so the scheduler has
 *                  no import-time dependency on the pipeline (which isn't
 *                  implemented until Task 11).
 */
export function makeScheduler(
  config: SchedulerFactoryConfig,
  run: (event: PullRequestEvent) => Promise<void>,
): Scheduler {
  if (config.schedulerMode === 'throttled') {
    return new ThrottledScheduler(run, {
      debounceMs: config.debounceMs ?? 30_000,
    });
  }
  return new InstantScheduler(run);
}

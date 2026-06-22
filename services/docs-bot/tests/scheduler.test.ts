import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PullRequestEvent } from '@surf/types';
import { InstantScheduler, ThrottledScheduler } from '../src/pipeline/scheduler.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<PullRequestEvent> = {}): PullRequestEvent {
  return {
    prUrl: 'https://github.com/org/repo/pull/1',
    mergedSha: 'abc123',
    changedPaths: [],
    title: 'feat: test pr',
    body: '',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// InstantScheduler
// ---------------------------------------------------------------------------

describe('InstantScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls run once with the enqueued event after flush (next tick)', async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const scheduler = new InstantScheduler(run);
    const event = makeEvent();

    scheduler.enqueue(event);
    await vi.runAllTimersAsync();

    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith(event);
  });

  it('coalesces two enqueues for the same PR into a single run call', async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const scheduler = new InstantScheduler(run);

    const event1 = makeEvent({ prUrl: 'https://github.com/org/repo/pull/1', title: 'first' });
    const event2 = makeEvent({ prUrl: 'https://github.com/org/repo/pull/1', title: 'second' });

    scheduler.enqueue(event1);
    scheduler.enqueue(event2);
    await vi.runAllTimersAsync();

    expect(run).toHaveBeenCalledTimes(1);
    // Last write wins: the second enqueue should be the one that fires
    expect(run).toHaveBeenCalledWith(event2);
  });

  it('runNow() flushes the pending event immediately without waiting for timer', async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const scheduler = new InstantScheduler(run);
    const event = makeEvent();

    scheduler.enqueue(event);
    // runNow — do NOT advance timers; run should still fire synchronously / await
    await scheduler.runNow();

    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith(event);
  });
});

// ---------------------------------------------------------------------------
// ThrottledScheduler
// ---------------------------------------------------------------------------

describe('ThrottledScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does NOT call run before the debounce window elapses, then calls it once after', async () => {
    const DEBOUNCE_MS = 5_000;
    const run = vi.fn().mockResolvedValue(undefined);
    const scheduler = new ThrottledScheduler(run, { debounceMs: DEBOUNCE_MS });
    const event = makeEvent();

    scheduler.enqueue(event);

    // Before debounce window: run must NOT have been called
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS - 1);
    expect(run).not.toHaveBeenCalled();

    // After debounce window: run must have been called exactly once
    await vi.advanceTimersByTimeAsync(2);
    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith(event);
  });
});

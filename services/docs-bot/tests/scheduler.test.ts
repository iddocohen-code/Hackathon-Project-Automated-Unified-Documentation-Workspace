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

  it('runs twice for two different PRs enqueued before flush', async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const scheduler = new InstantScheduler(run);

    const eventA = makeEvent({ prUrl: 'https://github.com/org/repo/pull/1' });
    const eventB = makeEvent({ prUrl: 'https://github.com/org/repo/pull/2' });

    scheduler.enqueue(eventA);
    scheduler.enqueue(eventB);
    await vi.runAllTimersAsync();

    expect(run).toHaveBeenCalledTimes(2);
    const calledUrls = run.mock.calls.map((call: [PullRequestEvent]) => call[0].prUrl);
    expect(calledUrls).toContain(eventA.prUrl);
    expect(calledUrls).toContain(eventB.prUrl);
  });

  it('logs via injected logger when run rejects, does not throw from timer path, scheduler remains usable', async () => {
    const error = new Error('pipeline boom');
    const run = vi.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue(undefined);
    const logger = { error: vi.fn() };
    const scheduler = new InstantScheduler(run, logger);

    // First enqueue — run will reject; error should be logged, not thrown
    scheduler.enqueue(makeEvent({ prUrl: 'https://github.com/org/repo/pull/1' }));
    await vi.runAllTimersAsync();

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(error, 'scheduler flush failed');

    // Scheduler must remain usable after the failure
    const eventB = makeEvent({ prUrl: 'https://github.com/org/repo/pull/2' });
    scheduler.enqueue(eventB);
    await vi.runAllTimersAsync();

    expect(run).toHaveBeenCalledTimes(2);
    expect(run).toHaveBeenLastCalledWith(eventB);
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

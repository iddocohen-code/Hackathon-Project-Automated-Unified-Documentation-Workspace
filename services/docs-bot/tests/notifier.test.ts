import { describe, it, expect, vi } from 'vitest';

// Import createNotifier via a fresh module so the singleton isn't shared
// between tests. We reconstruct a notifier in each test using the factory
// logic, which we replicate locally for isolation.

import type { ChangeEntry } from '@surf/types';

// Minimal ChangeEntry fixture
function makeEntry(id = 'chg-001'): ChangeEntry {
  return {
    id,
    docId: 'shark-mitigation',
    summary: {
      headline: 'Test change',
      detail: 'Something changed',
      intentSource: 'PR #1',
    },
    severity: 'critical',
    prUrl: 'https://github.com/example/surf-zone/pull/1',
    contextRefs: [],
    createdAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// We test the Notifier interface directly by importing the module-level singleton
// and a factory equivalent. Since the singleton is shared, use separate
// subscribe / unsubscribe lifetimes for isolation.
// ---------------------------------------------------------------------------

import { notifier } from '../src/events/notifier.js';

describe('notifier', () => {
  it('calls a subscribed callback when emit() is called', () => {
    const cb = vi.fn();
    const entry = makeEntry('chg-subscribe-receive');

    const unsubscribe = notifier.subscribe(cb);
    notifier.emit(entry);
    unsubscribe();

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(entry);
  });

  it('does NOT call the callback after unsubscribe()', () => {
    const cb = vi.fn();
    const entry = makeEntry('chg-after-unsub');

    const unsubscribe = notifier.subscribe(cb);
    unsubscribe(); // immediately remove
    notifier.emit(entry);

    expect(cb).not.toHaveBeenCalled();
  });

  it('calls multiple subscribers independently', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const entry = makeEntry('chg-multi');

    const unsub1 = notifier.subscribe(cb1);
    const unsub2 = notifier.subscribe(cb2);

    notifier.emit(entry);

    unsub1();
    unsub2();

    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
  });

  it('does not call cb1 after its unsubscribe while cb2 still receives', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const entry = makeEntry('chg-partial-unsub');

    const unsub1 = notifier.subscribe(cb1);
    const unsub2 = notifier.subscribe(cb2);

    unsub1(); // only unsubscribe cb1
    notifier.emit(entry);
    unsub2();

    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).toHaveBeenCalledTimes(1);
  });
});

/**
 * lock.ts — per-docId in-process mutex.
 *
 * The publisher is the only writer of content/docs, but two write paths now
 * exist (the bot pipeline's publish() and the admin saveManualEdit()). A manual
 * save and a bot job targeting the SAME doc must not interleave on manifest.json.
 *
 * withLock serializes callers by docId: same docId → run one at a time, in
 * arrival order; different docIds → run concurrently. The lock is per-process,
 * which is sufficient because both write paths run inside the single docs-bot
 * process.
 */

/** Tail of the promise chain per docId. Cleared when a chain fully drains. */
const chains = new Map<string, Promise<unknown>>();

/**
 * Run `fn` with exclusive access to `docId`. Returns fn's result. Rejections
 * propagate to the caller but never break the chain for subsequent waiters.
 */
export async function withLock<T>(docId: string, fn: () => Promise<T>): Promise<T> {
  const prev = chains.get(docId) ?? Promise.resolve();

  // The next tail resolves after fn settles (success OR failure), so a failing
  // critical section never deadlocks later waiters.
  const run = prev.then(fn, fn);
  chains.set(
    docId,
    run.then(
      () => undefined,
      () => undefined,
    ),
  );

  try {
    return await run;
  } finally {
    // Best-effort cleanup: if we're the last in line, drop the entry so the
    // map doesn't grow unbounded across many distinct docIds.
    queueMicrotask(() => {
      const tail = chains.get(docId);
      if (tail !== undefined) {
        void tail.then(() => {
          // Only delete if no newer waiter replaced the tail in the meantime.
          if (chains.get(docId) === tail) chains.delete(docId);
        });
      }
    });
  }
}

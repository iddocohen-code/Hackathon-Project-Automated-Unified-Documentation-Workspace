import type { ChangeEntry } from '@surf/types';

// ---------------------------------------------------------------------------
// Notifier interface + in-memory singleton
//
// subscribe(cb) returns an unsubscribe function.
// emit(entry) calls all currently-subscribed callbacks synchronously.
// ---------------------------------------------------------------------------

export interface Notifier {
  subscribe(cb: (e: ChangeEntry) => void): () => void;
  emit(e: ChangeEntry): void;
}

function createNotifier(): Notifier {
  const subscribers = new Set<(e: ChangeEntry) => void>();

  return {
    subscribe(cb) {
      subscribers.add(cb);
      return () => {
        subscribers.delete(cb);
      };
    },
    emit(e) {
      for (const cb of subscribers) {
        cb(e);
      }
    },
  };
}

/** Module-level singleton — shared between GET /events and runJob. */
export const notifier: Notifier = createNotifier();

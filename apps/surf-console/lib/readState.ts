"use client";

/**
 * readState.ts — SSR-safe localStorage persistence for What's New read-state.
 *
 * Storage: key="surf.docs.readEntries", value=JSON array of ChangeEntry ids.
 *
 * Same-tab synchronization: every mutating call dispatches a custom
 * "surf:readstate" event so all subscribers (WhatsNewFeed + TopBar badge)
 * re-render within the same tab. The native "storage" event only fires in
 * *other* tabs — we subscribe to both so cross-tab refreshes also work.
 *
 * useSyncExternalStore snapshot stability: we store the serialized JSON
 * string (not a Set) as the snapshot value. The hook memoizes the last
 * string → Set pair so the same string returns the same Set reference,
 * preventing infinite re-render loops.
 */

import { useSyncExternalStore, useCallback } from "react";

export const STORAGE_KEY = "surf.docs.readEntries";

// ---------------------------------------------------------------------------
// Pure helpers (safe to call server-side — they all guard window access)
// ---------------------------------------------------------------------------

/** Read the persisted set of read ids. Returns empty Set when unavailable. */
export function getRead(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function persist(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  // Notify same-tab subscribers (native "storage" only fires cross-tab)
  window.dispatchEvent(new Event("surf:readstate"));
}

/** Mark a single entry as read. */
export function markRead(id: string): void {
  const ids = getRead();
  ids.add(id);
  persist(ids);
}

/** Mark all provided ids as read. */
export function markAllRead(ids: string[]): void {
  const current = getRead();
  for (const id of ids) current.add(id);
  persist(current);
}

/** Clear all read-state (programmatic / operator helper — not a UI button). */
export function clearRead(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("surf:readstate"));
}

// ---------------------------------------------------------------------------
// useSyncExternalStore wiring
// ---------------------------------------------------------------------------

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("surf:readstate", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener("surf:readstate", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

/** Returns a stable JSON string snapshot of the current read-set.
 *  Must NOT return a new object/Set each call or useSyncExternalStore will loop. */
function getSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

/** Server snapshot: always empty so SSR HTML matches first client paint. */
function getServerSnapshot(): string {
  return "[]";
}

// Memoize last (snapshotStr → Set) pair to keep referential stability.
let _lastStr = "";
let _lastSet: Set<string> = new Set();

function snapshotToSet(str: string): Set<string> {
  if (str === _lastStr) return _lastSet;
  try {
    _lastStr = str;
    _lastSet = new Set(JSON.parse(str) as string[]);
  } catch {
    _lastStr = str;
    _lastSet = new Set();
  }
  return _lastSet;
}

// ---------------------------------------------------------------------------
// Public hook
// ---------------------------------------------------------------------------

export interface ReadStateHook {
  /** True if the given entry id has been marked read. */
  isRead: (id: string) => boolean;
  /** Mark a single entry read. */
  markRead: (id: string) => void;
  /** Mark all provided ids read. */
  markAllRead: (ids: string[]) => void;
  /** Number of entries in allIds that are NOT yet read. */
  unreadCount: (allIds: string[]) => number;
}

export function useReadState(): ReadStateHook {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const readSet = snapshotToSet(snapshot);

  const isRead = useCallback((id: string) => readSet.has(id), [readSet]);

  const handleMarkRead = useCallback((id: string) => {
    markRead(id);
  }, []);

  const handleMarkAllRead = useCallback((ids: string[]) => {
    markAllRead(ids);
  }, []);

  const unreadCount = useCallback(
    (allIds: string[]) => allIds.filter((id) => !readSet.has(id)).length,
    [readSet]
  );

  return { isRead, markRead: handleMarkRead, markAllRead: handleMarkAllRead, unreadCount };
}

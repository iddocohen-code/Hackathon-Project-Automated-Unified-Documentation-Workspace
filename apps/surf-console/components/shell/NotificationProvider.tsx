"use client";

/**
 * NotificationProvider.tsx — client context seam for live notifications.
 *
 * Exposes:
 *   { critical: ChangeEntry | null, show(entry): void, dismiss(): void, unreadCount: number }
 *
 * Plan 1: local/manual trigger only (?demoToast=1 query param on mount).
 * Plan 3: live SSE subscription via EventSource when NEXT_PUBLIC_BOT_URL is set.
 *   - onmessage → parse ChangeEntry → show() if severity is 'critical' or 'high'
 *   - onerror → silent (EventSource auto-reconnects)
 *   - closes on unmount
 *
 * Task 6B: accepts recentEntryIds prop (ids of RECENTLY-created changelog
 * entries) and computes unreadCount via useReadState() over just those — so the
 * badge reflects only fresh, still-unread updates (pre-existing 2025 history
 * never lights it). Consumers read unreadCount via useNotifications().
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import type { ChangeEntry } from "@surf/types";
import { useReadState } from "../../lib/readState";

interface NotificationContextValue {
  critical: ChangeEntry | null;
  show: (entry: ChangeEntry) => void;
  dismiss: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextValue>({
  critical: null,
  show: () => {},
  dismiss: () => {},
  unreadCount: 0,
});

/** Sample ChangeEntry used by the local demo trigger (?demoToast=1). */
const DEMO_ENTRY: ChangeEntry = {
  id: "demo-1",
  docId: "shark-mitigation",
  summary: {
    headline: "Shark Mitigation protocol updated",
    detail: "Emergency Shark Siren button added — docs and screenshot regenerated.",
    intentSource: "PR #42 – add-shark-siren",
  },
  severity: "critical",
  prUrl: "https://github.com/example/surf-zone/pull/42",
  contextRefs: [],
  createdAt: new Date().toISOString(),
};

interface NotificationProviderProps {
  children: React.ReactNode;
  /**
   * ids of RECENTLY-created changelog entries — the unread badge counts only
   * these, so old history never lights it and a fresh automation entry does.
   */
  recentEntryIds?: string[];
}

export function NotificationProvider({
  children,
  recentEntryIds = [],
}: NotificationProviderProps) {
  const [critical, setCritical] = useState<ChangeEntry | null>(null);

  const show = (entry: ChangeEntry) => setCritical(entry);
  const dismiss = () => setCritical(null);

  // Unread badge = recent entries that the user hasn't read yet (live read-state
  // sync via custom event). Recency keeps pre-existing history from alarming;
  // read-state keeps "mark all read" working.
  const { unreadCount: computeUnreadCount } = useReadState();
  const unreadCount = computeUnreadCount(recentEntryIds);

  /** Plan 1 local trigger: ?demoToast=1 on mount shows the demo entry. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("demoToast") === "1") {
      setCritical(DEMO_ENTRY);
    }
  }, []);

  /** Plan 3 SSE subscription — active only when NEXT_PUBLIC_BOT_URL is configured. */
  useEffect(() => {
    const botUrl = process.env.NEXT_PUBLIC_BOT_URL;
    if (!botUrl) return;

    const es = new EventSource(`${botUrl}/events`);

    es.onmessage = (event) => {
      try {
        const entry = JSON.parse(event.data as string) as ChangeEntry;
        if (entry.severity === "critical" || entry.severity === "high") {
          show(entry);
        }
      } catch {
        // Silently ignore malformed frames
      }
    };

    // Silent error handler — EventSource will auto-reconnect on its own
    es.onerror = () => {};

    return () => {
      es.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <NotificationContext.Provider value={{ critical, show, dismiss, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

/** Hook to consume notification state. Safe to call outside the provider (returns null defaults). */
export function useNotifications(): NotificationContextValue {
  return useContext(NotificationContext);
}

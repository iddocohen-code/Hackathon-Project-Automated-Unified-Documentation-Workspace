"use client";

/**
 * NotificationProvider.tsx — client context seam for live notifications.
 *
 * Exposes:
 *   { critical: ChangeEntry | null, show(entry): void, dismiss(): void }
 *
 * Plan 1: local/manual trigger only (?demoToast=1 query param on mount).
 * Plan 3 will call show() from an EventSource/SSE handler — the seam is clean.
 * NO SSE / fetch / polling here.
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import type { ChangeEntry } from "@surf/types";

interface NotificationContextValue {
  critical: ChangeEntry | null;
  show: (entry: ChangeEntry) => void;
  dismiss: () => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  critical: null,
  show: () => {},
  dismiss: () => {},
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

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [critical, setCritical] = useState<ChangeEntry | null>(null);

  /** Plan 1 local trigger: ?demoToast=1 on mount shows the demo entry. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("demoToast") === "1") {
      setCritical(DEMO_ENTRY);
    }
  }, []);

  const show = (entry: ChangeEntry) => setCritical(entry);
  const dismiss = () => setCritical(null);

  return (
    <NotificationContext.Provider value={{ critical, show, dismiss }}>
      {children}
    </NotificationContext.Provider>
  );
}

/** Hook to consume notification state. Safe to call outside the provider (returns null defaults). */
export function useNotifications(): NotificationContextValue {
  return useContext(NotificationContext);
}

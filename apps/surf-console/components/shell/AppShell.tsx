"use client";

/**
 * AppShell.tsx — outer flex layout composing Sidebar + (TopBar + main slot).
 * Reproduces .dc.html lines 30–169 wrapper + closing ~496–497.
 */

import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import LiveToast from "../docs/LiveToast";

interface AppShellProps {
  children: React.ReactNode;
  hasCriticalUpdate?: boolean;
}

export default function AppShell({
  children,
  hasCriticalUpdate = false,
}: AppShellProps) {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100%",
        background: "var(--bg-secondary)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-default-family)",
        overflow: "hidden",
      }}
    >
      <Sidebar />

      {/* Main column: TopBar + scrollable content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <TopBar hasCriticalUpdate={hasCriticalUpdate} />

        <main style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </main>
      </div>

      {/* Toast overlay — rendered outside the scroll column so it stays fixed */}
      <LiveToast />
    </div>
  );
}

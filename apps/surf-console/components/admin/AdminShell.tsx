"use client";

/**
 * AdminShell — dedicated chrome for the /admin workspace (not the console
 * Sidebar/TopBar). A slim top bar with an "Admin" badge and a Log out action.
 */

import { useRouter } from "next/navigation";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function logout() {
    await fetch("/admin/api/logout", { method: "POST" }).catch(() => {});
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-secondary, #F8FAFC)",
        color: "var(--text-primary, #0F172A)",
        fontFamily: "var(--font-default-family, system-ui)",
      }}
    >
      <header
        style={{
          height: 52,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 16px",
          borderBottom: "1px solid var(--border-subtle, #E2E8F0)",
          background: "var(--bg-primary, #fff)",
        }}
      >
        <span style={{ fontWeight: 700 }}>Surf Docs</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 999,
            background: "var(--uw-primary-05, #EEF2FF)",
            color: "var(--uw-primary-01, #4f46e5)",
          }}
        >
          Admin
        </span>
        <button
          onClick={logout}
          style={{
            marginLeft: "auto",
            fontSize: 13,
            padding: "6px 12px",
            borderRadius: "var(--radius-md, 8px)",
            border: "1px solid var(--border-subtle, #CBD5E1)",
            background: "transparent",
            color: "var(--text-primary, #0F172A)",
            cursor: "pointer",
          }}
        >
          Log out
        </button>
      </header>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}

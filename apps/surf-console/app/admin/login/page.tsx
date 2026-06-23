"use client";

/**
 * /admin/login — single-operator password gate.
 * Posts to /admin/api/login; on success the server sets the httpOnly session
 * cookie and we navigate to the workspace. Unauthenticated entry (allowlisted
 * in middleware).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/admin/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace("/admin");
        router.refresh();
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error === "invalid password" ? "Incorrect password." : "Sign-in failed.");
      }
    } catch {
      setError("Network error - is the app running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-secondary, #F8FAFC)",
        fontFamily: "var(--font-default-family, system-ui)",
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          width: 360,
          background: "var(--bg-primary, #fff)",
          border: "1px solid var(--border-subtle, #E2E8F0)",
          borderRadius: "var(--radius-lg, 16px)",
          boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.08))",
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary, #0F172A)" }}>
          Surf Docs Admin
        </div>
        <label style={{ fontSize: 13, color: "var(--text-secondary, #475569)" }} htmlFor="admin-password">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          autoFocus
          onChange={(e) => setPassword(e.target.value)}
          style={{
            padding: "10px 12px",
            borderRadius: "var(--radius-md, 10px)",
            border: "1px solid var(--border-subtle, #CBD5E1)",
            fontSize: 14,
            outline: "none",
          }}
        />
        {error && (
          <div role="alert" style={{ color: "var(--severity-high, #f2583c)", fontSize: 13 }}>
            ⚠ {error}
          </div>
        )}
        <button
          type="submit"
          disabled={busy || password.length === 0}
          style={{
            marginTop: 4,
            padding: "10px 12px",
            borderRadius: "var(--radius-md, 10px)",
            border: "none",
            background: "var(--action-primary, #4f46e5)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: busy ? "default" : "pointer",
            opacity: busy || password.length === 0 ? 0.6 : 1,
          }}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}

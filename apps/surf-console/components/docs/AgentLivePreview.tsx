"use client";

/**
 * AgentLivePreview — interactive "see it as an agent sees it" demo component.
 *
 * Renders two buttons that fetch the portal's same-origin proxy routes
 * (/docs/agent/api/llms and /docs/agent/api/corpus) and display the real
 * bot output inline. The bot URL is never exposed to the browser — all
 * fetches go through the Next.js server-side proxy routes.
 */

import { useState } from "react";

type ViewMode = "llms" | "corpus" | null;
type LoadingState = "idle" | "loading" | "done" | "error";

export default function AgentLivePreview() {
  const [activeView, setActiveView] = useState<ViewMode>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [content, setContent] = useState<string>("");

  async function fetchEndpoint(mode: ViewMode) {
    if (!mode) return;
    setActiveView(mode);
    setLoadingState("loading");
    setContent("");

    const url =
      mode === "llms" ? "/docs/agent/api/llms" : "/docs/agent/api/corpus";

    try {
      const res = await fetch(url);
      if (!res.ok) {
        setLoadingState("error");
        return;
      }

      if (mode === "llms") {
        const text = await res.text();
        setContent(text);
      } else {
        const json = await res.json();
        setContent(JSON.stringify(json, null, 2));
      }
      setLoadingState("done");
    } catch {
      setLoadingState("error");
    }
  }

  const buttonBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 16px",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    border: "1px solid var(--border-subtle, rgba(255,255,255,0.12))",
    background: "var(--surface-code, rgba(255,255,255,0.06))",
    color: "var(--text-primary)",
    transition: "background 0.15s",
  };

  const buttonActive: React.CSSProperties = {
    ...buttonBase,
    background: "var(--uw-primary-05, rgba(99,102,241,0.15))",
    border: "1px solid var(--uw-primary-01, #6366f1)",
    color: "var(--uw-primary-01, #6366f1)",
  };

  return (
    <section
      style={{
        background: "var(--surface-card, #1a1a2e)",
        borderRadius: 10,
        padding: "20px 24px",
        border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
      }}
    >
      <h2
        style={{
          fontSize: 17,
          fontWeight: 500,
          margin: "0 0 6px",
        }}
      >
        Live agent view
      </h2>
      <p
        style={{
          fontSize: 14,
          color: "var(--text-secondary)",
          margin: "0 0 16px",
          lineHeight: 1.65,
        }}
      >
        See exactly what an AI agent receives from this docs engine — the live
        output, fetched right now, with no transformation.
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <button
          style={activeView === "llms" ? buttonActive : buttonBase}
          onClick={() => fetchEndpoint("llms")}
        >
          View llms.txt
        </button>
        <button
          style={activeView === "corpus" ? buttonActive : buttonBase}
          onClick={() => fetchEndpoint("corpus")}
        >
          View JSON corpus
        </button>
      </div>

      {loadingState === "loading" && (
        <div
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            padding: "12px 0",
          }}
        >
          Fetching from docs engine…
        </div>
      )}

      {loadingState === "error" && (
        <div
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            padding: "12px 16px",
            borderRadius: 8,
            background: "rgba(255,80,80,0.07)",
            border: "1px solid rgba(255,80,80,0.18)",
          }}
        >
          Docs engine offline — start the bot to preview
        </div>
      )}

      {loadingState === "done" && content && (
        <pre
          style={{
            fontSize: 12,
            fontFamily:
              "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            background: "var(--surface-code, rgba(255,255,255,0.04))",
            padding: "14px 16px",
            borderRadius: 8,
            border: "1px solid var(--border-subtle, rgba(255,255,255,0.07))",
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: 420,
            margin: 0,
            color: "var(--text-primary)",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {content}
        </pre>
      )}
    </section>
  );
}

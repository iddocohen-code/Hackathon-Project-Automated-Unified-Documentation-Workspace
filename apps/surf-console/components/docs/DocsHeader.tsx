/**
 * DocsHeader — title "Documentation" + "Auto-generated" badge + subtitle.
 * Source: design-mock lines 302–305.
 */

import React from "react";

export default function DocsHeader() {
  return (
    <div style={{ marginBottom: 22 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 6,
        }}
      >
        <h1
          style={{
            fontSize: 30,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            margin: 0,
          }}
        >
          Documentation
        </h1>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            fontWeight: 500,
            padding: "4px 10px",
            borderRadius: 50,
            background: "var(--uw-primary-05)",
            color: "var(--uw-primary-01)",
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 4l1.7 4.6L18 10l-4.3 1.4L12 16l-1.7-4.6L6 10l4.3-1.4Z" />
          </svg>
          Auto-generated
        </span>
        {/* Disabled "Agent View" pill — roadmap teaser (links to /docs/agent explainer) */}
        <a
          href="/docs/agent"
          title="Coming soon: a machine-readable docs surface for AI agents"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 500,
            padding: "4px 10px",
            borderRadius: 50,
            background: "var(--surface-card, rgba(255,255,255,0.05))",
            color: "var(--text-tertiary, rgba(255,255,255,0.35))",
            border: "1px dashed var(--border-subtle, rgba(255,255,255,0.12))",
            textDecoration: "none",
            userSelect: "none",
          }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 9h6M9 12h6M9 15h4" />
          </svg>
          Agent View
        </a>
      </div>
      <div style={{ fontSize: 15, color: "var(--text-secondary)" }}>
        Always current — the docs engine regenerates pages, screenshots, and
        context on every UI change.
      </div>
    </div>
  );
}

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
      </div>
      <div style={{ fontSize: 15, color: "var(--text-secondary)" }}>
        Always current — the docs engine regenerates pages, screenshots, and
        context on every UI change.
      </div>
    </div>
  );
}

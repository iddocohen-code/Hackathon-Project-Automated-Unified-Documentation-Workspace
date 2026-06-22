"use client";

/**
 * SearchBar — decorative search with RAG affordance.
 * Source: design-mock lines 363–368.
 * DECORATIVE: no submit behavior yet. Plan 3 will wire up real RAG.
 */

import React from "react";

export default function SearchBar() {
  return (
    <div
      style={{
        maxWidth: 760,
        margin: "4px auto 28px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        height: 56,
        padding: "0 20px",
        background: "var(--surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 14,
        boxShadow: "var(--shadow-sm)",
      }}
      className="uw-searchinput"
    >
      {/* Search icon */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--text-tertiary)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>

      {/* Placeholder text */}
      <span style={{ flex: 1, fontSize: 16, color: "var(--text-tertiary)" }}>
        Ask anything about the console (RAG)…
      </span>

      {/* "Answered by AI" badge */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          fontWeight: 500,
          padding: "5px 10px",
          borderRadius: 50,
          background: "var(--upwind-theme-gradient-light)",
          color: "var(--uw-purple-01)",
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
        Answered by AI
      </span>

      {/* Keyboard shortcut hint */}
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          padding: "3px 7px",
          borderRadius: 5,
          background: "var(--bg-secondary)",
          color: "var(--text-tertiary)",
        }}
      >
        ⌘K
      </span>
    </div>
  );
}

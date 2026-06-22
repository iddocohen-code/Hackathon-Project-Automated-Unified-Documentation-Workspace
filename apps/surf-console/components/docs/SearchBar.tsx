"use client";

/**
 * SearchBar — interactive RAG search bar.
 * Source: design-mock lines 363–368.
 *
 * Status machine:
 *   idle      → user hasn't submitted a query yet (or cleared input)
 *   loading   → POST /docs/api/search in flight
 *   answered  → bot returned a RagAnswer (may have empty citations)
 *   offline   → proxy returned non-OK or network error → 502
 */

import React, { useState, useRef, FormEvent } from "react";
import type { RagAnswer } from "@surf/types";
import SearchResults from "./SearchResults";

type Status = "idle" | "loading" | "answered" | "offline";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [answer, setAnswer] = useState<RagAnswer | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setStatus("loading");
    setAnswer(null);

    try {
      const res = await fetch("/docs/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });

      if (res.ok) {
        const data: RagAnswer = await res.json();
        setAnswer(data);
        setStatus("answered");
      } else {
        setStatus("offline");
      }
    } catch {
      setStatus("offline");
    }
  }

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    // Clearing the input resets to idle
    if (val === "") {
      setStatus("idle");
      setAnswer(null);
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
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
        {/* Search icon — clicking focuses the input */}
        <button
          type="submit"
          aria-label="Search"
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={status === "loading" ? "var(--uw-purple-01)" : "var(--text-tertiary)"}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>

        {/* Controlled input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleQueryChange}
          placeholder="Ask anything about the console (RAG)…"
          disabled={status === "loading"}
          style={{
            flex: 1,
            fontSize: 16,
            color: query ? "var(--text-primary)" : "var(--text-tertiary)",
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: "inherit",
            cursor: status === "loading" ? "wait" : "text",
          }}
        />

        {/* Loading spinner or "Answered by AI" badge */}
        {status === "loading" ? (
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
              style={{ animation: "spin 1s linear infinite" }}
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            Searching…
          </span>
        ) : (
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
        )}

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
      </form>

      {/* Inline keyframe for spinner */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Results card — only when answered or offline */}
      {(status === "answered" || status === "offline") && (
        <SearchResults status={status} answer={answer} />
      )}
    </>
  );
}

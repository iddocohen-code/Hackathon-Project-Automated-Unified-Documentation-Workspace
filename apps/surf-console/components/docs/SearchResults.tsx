"use client";

/**
 * SearchResults — frosted answer card with AI answer and citation deep-links.
 *
 * Renders when status is 'answered' or 'offline'.
 * - answered: shows the AI answer + citation rows with "Jump to section →" links.
 * - offline: shows a brief "Search engine offline" notice.
 */

import React from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { RagAnswer } from "@surf/types";

interface SearchResultsProps {
  status: "answered" | "offline";
  answer: RagAnswer | null;
}

export default function SearchResults({ status, answer }: SearchResultsProps) {
  if (status === "offline") {
    return (
      <div
        style={{
          maxWidth: 760,
          margin: "0 auto 24px",
          padding: "16px 20px",
          background: "var(--surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 12,
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: "var(--text-secondary)",
          fontSize: 14,
        }}
      >
        {/* Warning icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0, color: "var(--severity-high)" }}
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span>Search engine offline — please try again later.</span>
      </div>
    );
  }

  if (!answer) return null;

  return (
    <div
      style={{
        maxWidth: 760,
        margin: "0 auto 24px",
        background: "var(--surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 12,
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Card header */}
      <div
        style={{
          padding: "14px 20px",
          background: "var(--upwind-theme-gradient-light)",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--uw-purple-01)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 4l1.7 4.6L18 10l-4.3 1.4L12 16l-1.7-4.6L6 10l4.3-1.4Z" />
        </svg>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--uw-purple-01)",
          }}
        >
          ✨ Answered by AI
        </span>
      </div>

      {/* Answer body — rendered as Markdown (synthesis emits **bold**, lists, etc.) */}
      <div style={{ padding: "16px 20px" }}>
        <div
          className="uw-rag-answer"
          style={{
            fontSize: 14.5,
            lineHeight: 1.65,
            color: "var(--text-primary)",
            margin: "0 0 16px",
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {answer.answer}
          </ReactMarkdown>
        </div>

        {/* Citation rows */}
        {answer.citations.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              borderTop: "1px solid var(--border-subtle)",
              paddingTop: 14,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 4,
              }}
            >
              Sources
            </span>
            {answer.citations.map((citation, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "10px 14px",
                  background: "var(--bg-secondary)",
                  borderRadius: 8,
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      marginBottom: 3,
                    }}
                  >
                    {citation.title}
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {citation.snippet}
                  </div>
                </div>
                <Link
                  href={citation.deepLink}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    whiteSpace: "nowrap",
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: "var(--uw-purple-01)",
                    textDecoration: "none",
                    padding: "5px 10px",
                    borderRadius: 6,
                    background: "var(--upwind-theme-gradient-light)",
                    flexShrink: 0,
                  }}
                >
                  Jump to section →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

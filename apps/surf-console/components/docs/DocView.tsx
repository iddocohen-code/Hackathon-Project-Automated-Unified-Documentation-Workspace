/**
 * DocView.tsx — Presentational renderer for a single documentation page.
 * Source mock: design-mock/.../Surf-Zone Console.dc.html lines ~433–492.
 *
 * Props:
 *   doc — Doc (from getDoc); bodyMarkdown is the real content, screenshots[] may be empty.
 *
 * Layout:
 *   - Back button + breadcrumb row
 *   - Card: header (category chip, updated time, version tag, title, "What changed" callout)
 *   - Card body: rendered bodyMarkdown, then — ONLY when screenshots.length > 0 — the
 *     embedded screenshot browser-chrome frame with screenshot + caption.
 */

"use client";

import React from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Doc } from "@surf/types";
import Icon from "@/components/ui/Icon";
import Hoverable from "@/components/ui/Hoverable";

interface DocViewProps {
  doc: Doc;
}

/** Format an ISO date string as a human-readable relative or absolute string. */
function formatUpdated(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 2) return "just now";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Format a capturedAt ISO string for the screenshot caption bar. */
function formatCaptured(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMs / 3_600_000);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DocView({ doc }: DocViewProps) {
  const updatedLabel = formatUpdated(doc.updatedAt);

  return (
    <div style={{ maxWidth: 920 }}>
      {/* Top row: Back button + breadcrumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <Hoverable
          as="a"
          href="/docs"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            height: 38,
            padding: "0 16px",
            background: "var(--surface)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-primary)",
            borderRadius: 8,
            fontFamily: "inherit",
            fontSize: 13.5,
            fontWeight: 500,
            cursor: "pointer",
            textDecoration: "none",
          }}
          hoverStyle={{ background: "var(--interactive-hover)" }}
        >
          {/* chevron-left */}
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          {/* grid icon */}
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Back to App Directory
        </Hoverable>

        {/* Breadcrumb */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13.5,
            color: "var(--text-secondary)",
          }}
        >
          <Link href="/docs" style={{ cursor: "pointer", color: "inherit", textDecoration: "none" }}>
            Docs
          </Link>
          <span style={{ color: "var(--text-tertiary)" }}>/</span>
          <Link href="/docs" style={{ cursor: "pointer", color: "inherit", textDecoration: "none" }}>
            {doc.category.name}
          </Link>
          <span style={{ color: "var(--text-tertiary)" }}>/</span>
          <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{doc.title}</span>
        </div>
      </div>

      {/* Main card */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 12,
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
        }}
      >
        {/* Card header */}
        <div
          style={{
            padding: "24px 28px",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          {/* Meta row: category chip, updated time, version */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                padding: "3px 9px",
                borderRadius: 50,
                background: "var(--severity-high-bg)",
                color: "var(--severity-high)",
              }}
            >
              {doc.category.name}
            </span>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12.5,
                color: "var(--text-tertiary)",
              }}
            >
              {/* clock icon */}
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 7v5l3 2" strokeLinecap="round" />
              </svg>
              Updated {updatedLabel}
            </span>

            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                padding: "3px 9px",
                borderRadius: 50,
                background: "var(--bg-secondary)",
                color: "var(--text-secondary)",
                fontFamily: "var(--font-mono-family)",
              }}
            >
              v{doc.version}
            </span>
          </div>

          {/* Title */}
          <h2
            style={{
              fontSize: 26,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              margin: "0 0 16px",
            }}
          >
            {doc.title}
          </h2>

          {/* "What changed" callout — only when lastChange exists */}
          {doc.lastChange && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 14px",
                borderRadius: 10,
                background: "var(--upwind-theme-gradient-light)",
              }}
            >
              <Icon name="sparkles" size={17} stroke="var(--uw-purple-01)" />
              <span style={{ fontSize: 13.5, color: "var(--uw-purple-01)" }}>
                <strong style={{ fontWeight: 600 }}>What changed:</strong>{" "}
                {doc.lastChange.headline}
              </span>
              <Link
                href="/docs/whats-new"
                style={{
                  marginLeft: "auto",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--uw-purple-01)",
                  textDecoration: "underline",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                See What&apos;s New →
              </Link>
            </div>
          )}
        </div>

        {/* Card body: markdown + optional screenshot */}
        <div style={{ padding: "24px 28px" }}>
          <div className="doc-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.65,
                      color: "var(--text-primary)",
                      margin: "0 0 22px",
                    }}
                  >
                    {children}
                  </p>
                ),
                h1: ({ children }) => (
                  <h1
                    style={{
                      fontSize: 22,
                      fontWeight: 500,
                      margin: "0 0 16px",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2
                    style={{
                      fontSize: 18,
                      fontWeight: 500,
                      margin: "0 0 14px",
                    }}
                  >
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 500,
                      margin: "0 0 12px",
                    }}
                  >
                    {children}
                  </h3>
                ),
                ol: ({ children }) => (
                  <ol
                    style={{
                      margin: "0 0 24px",
                      paddingLeft: 0,
                      listStyle: "none",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      counterReset: "step-counter",
                    }}
                  >
                    {children}
                  </ol>
                ),
                ul: ({ children }) => (
                  <ul
                    style={{
                      margin: "0 0 20px",
                      paddingLeft: 20,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {children}
                  </ul>
                ),
                li: ({ children, ...props }) => {
                  // Detect if inside an ordered list by checking parent node
                  // We use a wrapper that handles both ol and ul li styling
                  const isOrdered = (props as { ordered?: boolean }).ordered;
                  if (isOrdered) {
                    return (
                      <li
                        style={{
                          display: "flex",
                          gap: 12,
                          alignItems: "flex-start",
                        }}
                      >
                        {children}
                      </li>
                    );
                  }
                  return (
                    <li style={{ fontSize: 15, lineHeight: 1.55, color: "var(--text-primary)" }}>
                      {children}
                    </li>
                  );
                },
                strong: ({ children }) => (
                  <strong style={{ fontWeight: 600 }}>{children}</strong>
                ),
                em: ({ children }) => <em>{children}</em>,
                hr: () => (
                  <hr
                    style={{
                      border: "none",
                      borderTop: "1px solid var(--border-subtle)",
                      margin: "24px 0",
                    }}
                  />
                ),
                code: ({ children }) => (
                  <code
                    style={{
                      fontFamily: "var(--font-mono-family)",
                      fontSize: 13,
                      background: "var(--bg-secondary)",
                      padding: "2px 5px",
                      borderRadius: 4,
                    }}
                  >
                    {children}
                  </code>
                ),
                blockquote: ({ children }) => (
                  <blockquote
                    style={{
                      borderLeft: "3px solid var(--border-primary)",
                      margin: "0 0 20px",
                      paddingLeft: 16,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {children}
                  </blockquote>
                ),
              }}
            >
              {doc.bodyMarkdown}
            </ReactMarkdown>
          </div>

          {/* Embedded screenshot frame — ONLY when screenshots exist */}
          {doc.screenshots.length > 0 && (
            <>
              {doc.screenshots.map((screenshot, idx) => (
                <div
                  key={idx}
                  style={{
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 10,
                    overflow: "hidden",
                    marginBottom: 10,
                  }}
                >
                  {/* Browser chrome bar */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      padding: "8px 12px",
                      background: "var(--bg-secondary)",
                      borderBottom: "1px solid var(--border-subtle)",
                    }}
                  >
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        background: "#FF5F57",
                      }}
                    />
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        background: "#FEBC2E",
                      }}
                    />
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        background: "#28C840",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--text-tertiary)",
                        marginLeft: 8,
                        fontFamily: "var(--font-mono-family)",
                      }}
                    >
                      {screenshot.path} · captured {formatCaptured(screenshot.capturedAt)}
                    </span>
                  </div>

                  {/* Screenshot inner area */}
                  <div
                    style={{
                      padding: 18,
                      background: "#fbfcfe",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={screenshot.path}
                      alt={screenshot.alt}
                      style={{
                        display: "block",
                        maxWidth: "100%",
                        borderRadius: 8,
                        border: "1px solid var(--border-subtle)",
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* Caption below the last screenshot */}
              {doc.screenshots.length > 0 && doc.screenshots[doc.screenshots.length - 1] && (
                <div
                  style={{
                    fontSize: 12.5,
                    color: "var(--text-tertiary)",
                    marginTop: 10,
                    fontStyle: "italic",
                  }}
                >
                  {doc.screenshots[doc.screenshots.length - 1]!.alt}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

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

import React from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import type { Doc } from "@surf/types";
import Icon from "@/components/ui/Icon";
import Hoverable from "@/components/ui/Hoverable";

interface DocViewProps {
  doc: Doc;
  isAdmin?: boolean;
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

/** Whether a doc was updated recently enough to surface "freshly updated" UI.
 *  Same 7-day rule the App Directory grid uses, so all "updated" signals agree:
 *  the bot stamps updatedAt = now on publish; seeded baseline docs are dated 2025. */
function isRecentlyUpdated(isoDate: string): boolean {
  const t = new Date(isoDate).getTime();
  return Number.isFinite(t) && Date.now() - t < 7 * 24 * 60 * 60 * 1000;
}

export default function DocView({ doc, isAdmin = false }: DocViewProps) {
  const updatedLabel = formatUpdated(doc.updatedAt);
  // The "What changed" callout shows only when this doc was actually just
  // regenerated (recent updatedAt) — not merely because it carries change history.
  const showWhatChanged = doc.lastChange != null && isRecentlyUpdated(doc.updatedAt);

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

          {/* Title row: title + optional admin edit link */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 14,
              margin: "0 0 16px",
              flexWrap: "wrap",
            }}
          >
            <h2
              style={{
                fontSize: 26,
                fontWeight: 500,
                letterSpacing: "-0.01em",
                margin: 0,
                flex: "none",
              }}
            >
              {doc.title}
            </h2>

            {/* Admin-only: server-gated — never reaches HTML for non-admins */}
            {isAdmin && (
              <Link
                href={`/admin?doc=${doc.id}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 6,
                  padding: "3px 10px",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {/* pencil icon */}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit this doc
              </Link>
            )}
          </div>

          {/* "What changed" callout — only when this doc was recently regenerated */}
          {showWhatChanged && doc.lastChange && (
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
              rehypePlugins={[rehypeSlug]}
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
                      margin: "0 0 22px",
                      paddingLeft: 28,
                      listStyle: "decimal",
                    }}
                  >
                    {children}
                  </ol>
                ),
                ul: ({ children }) => (
                  <ul
                    style={{
                      margin: "0 0 22px",
                      paddingLeft: 24,
                      listStyle: "disc",
                    }}
                  >
                    {children}
                  </ul>
                ),
                li: ({ children }) => (
                  <li
                    style={{
                      fontSize: 15,
                      lineHeight: 1.65,
                      color: "var(--text-primary)",
                      marginBottom: 6,
                    }}
                  >
                    {children}
                  </li>
                ),
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

          {/* Looping interaction clip (GIF-like, silent) — only when doc.video is set.
              Never a gate: when absent, nothing extra renders (stills only). */}
          {doc.video && (
            <div style={{ marginTop: 24 }}>
              <div
                style={{
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  overflow: "hidden",
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
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#FF5F57" }} />
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#FEBC2E" }} />
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#28C840" }} />
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-tertiary)",
                      marginLeft: 8,
                      fontFamily: "var(--font-mono-family)",
                    }}
                  >
                    {doc.video.path} · interaction clip
                  </span>
                </div>
                <div style={{ padding: 18, background: "#fbfcfe" }}>
                  {/* doc.video.path is a web-resolvable public path set by the publisher.
                      Looping + muted + autoPlay makes it behave like a silent GIF. */}
                  <video
                    src={doc.video.path}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    aria-label={doc.video.alt}
                    style={{
                      display: "block",
                      maxWidth: "100%",
                      borderRadius: 8,
                      border: "1px solid var(--border-subtle)",
                    }}
                  />
                </div>
              </div>
              {doc.video.alt && (
                <div
                  style={{
                    fontSize: 12.5,
                    color: "var(--text-tertiary)",
                    marginTop: 8,
                    fontStyle: "italic",
                  }}
                >
                  {doc.video.alt}
                </div>
              )}
            </div>
          )}

          {/* Screenshot gallery — renders ALL captured states, each with its own caption */}
          {doc.screenshots.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 24 }}>
              {doc.screenshots.map((screenshot, idx) => (
                <div key={idx}>
                  <div
                    style={{
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 10,
                      overflow: "hidden",
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
                      {/* screenshot.path is set by the docs-bot publisher; it must be a
                          web-resolvable URL/public path when populated. */}
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

                  {/* Per-screenshot caption — only rendered when alt is non-empty */}
                  {screenshot.alt && (
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "var(--text-tertiary)",
                        marginTop: 8,
                        fontStyle: "italic",
                      }}
                    >
                      {screenshot.alt}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

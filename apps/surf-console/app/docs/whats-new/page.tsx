/**
 * /docs/whats-new — What's New feed (server component).
 * Source: design-mock lines 308–356.
 *
 * Loads the changelog (newest-first) and renders the WhatsNewFeed.
 * Before-state: only the two "info" entries exist in changelog.json.
 */

import Link from "next/link";
import { getChangelog } from "@/lib/content";
import WhatsNewFeed from "@/components/docs/WhatsNewFeed";

export default async function WhatsNewPage() {
  const entries = await getChangelog();

  return (
    <div style={{ padding: "28px 28px 60px", maxWidth: 1380 }}>
      <div style={{ maxWidth: 880 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div>
            {/* "Latest updates" eyebrow */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  position: "relative",
                  display: "inline-flex",
                  width: 7,
                  height: 7,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    background: "var(--severity-high)",
                    opacity: 0.4,
                    animation: "uwpulse 1.6s ease-out infinite",
                  }}
                />
                <span
                  style={{
                    position: "relative",
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--severity-high)",
                  }}
                />
              </span>
              Latest updates
            </div>

            <h2
              style={{
                fontSize: 24,
                fontWeight: 500,
                letterSpacing: "-0.01em",
                margin: 0,
              }}
            >
              What&apos;s new
            </h2>
            <div
              style={{
                fontSize: 14,
                color: "var(--text-secondary)",
                marginTop: 4,
              }}
            >
              Every console change, documented automatically — newest first.
            </div>
          </div>

          {/* Back to All folders */}
          <Link
            href="/docs"
            style={{
              flex: "none",
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
            className="uw-btn-secondary"
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
            All folders
          </Link>
        </div>

        {/* Feed */}
        <WhatsNewFeed entries={entries} />
      </div>
    </div>
  );
}

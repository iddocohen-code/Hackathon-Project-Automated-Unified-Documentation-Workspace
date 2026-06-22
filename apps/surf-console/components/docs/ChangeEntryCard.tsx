"use client";

/**
 * ChangeEntryCard — severity-driven changelog entry card.
 * Source: design-mock lines 321–356.
 *
 * Props:
 *   entry — ChangeEntry from @surf/types
 *
 * Severity mapping:
 *   critical | high → red stripe (--severity-high border + badge)
 *   everything else (info, medium, low) → primary (--uw-primary)
 */

import React from "react";
import Link from "next/link";
import type { ChangeEntry } from "@surf/types";

interface ChangeEntryCardProps {
  entry: ChangeEntry;
}

function isHighSeverity(severity: string): boolean {
  return severity === "critical" || severity === "high";
}

function severityLabel(severity: string): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function ChangeEntryCard({ entry }: ChangeEntryCardProps) {
  const high = isHighSeverity(entry.severity);

  const borderColor = high ? "var(--severity-high)" : "var(--border-subtle)";
  const badgeBg = high ? "var(--severity-high)" : "var(--uw-primary-05)";
  const badgeColor = high ? "#fff" : "var(--uw-primary-01)";
  const jumpBg = high ? "var(--action-primary)" : "var(--surface)";
  const jumpColor = high ? "#fff" : "var(--text-primary)";
  const jumpBorder = high ? "var(--action-primary)" : "var(--border-primary)";
  const jumpStroke = high ? "#fff" : "currentColor";

  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        alignItems: "center",
        background: "var(--surface)",
        border: `1px solid ${borderColor}`,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 14,
        padding: "16px 18px",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Badge row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              padding: "2px 8px",
              borderRadius: 50,
              background: badgeBg,
              color: badgeColor,
            }}
          >
            {severityLabel(entry.severity)}
          </span>
          <span style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>
            {formatRelativeTime(entry.createdAt)}
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 15.5,
            fontWeight: 500,
            lineHeight: 1.45,
          }}
        >
          {entry.summary.headline}
        </div>

        {/* Provenance chips */}
        {entry.contextRefs.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginTop: 10,
            }}
          >
            {entry.contextRefs.map((ref) => (
              <span
                key={ref.ref}
                style={{
                  fontSize: 10.5,
                  padding: "2px 8px",
                  borderRadius: 50,
                  background: "var(--bg-tertiary)",
                  color: "var(--text-secondary)",
                  fontFamily: ref.kind === "slack" ? "inherit" : "var(--font-mono-family)",
                }}
              >
                {ref.ref}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Jump to Updated Doc button */}
      <Link
        href={`/docs/${entry.docId}`}
        style={{
          flex: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          height: 38,
          padding: "0 16px",
          background: jumpBg,
          color: jumpColor,
          border: `1px solid ${jumpBorder}`,
          borderRadius: 8,
          fontFamily: "inherit",
          fontSize: 13.5,
          fontWeight: 500,
          cursor: "pointer",
          whiteSpace: "nowrap",
          textDecoration: "none",
        }}
        className={high ? "uw-btn-primary" : "uw-btn-secondary"}
      >
        Jump to Updated Doc{" "}
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke={jumpStroke}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>
    </div>
  );
}

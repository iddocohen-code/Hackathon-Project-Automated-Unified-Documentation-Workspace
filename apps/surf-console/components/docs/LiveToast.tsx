"use client";

/**
 * LiveToast.tsx — top-right toast overlay.
 * Reproduces design-mock lines 534–544:
 *   fixed top-right; red left-border accent; ⚠ icon; title; one-line subtitle;
 *   "View update →" → /docs/whats-new; dismiss button; toastin animation.
 *
 * Renders only when critical !== null (from NotificationContext).
 * NO SSE/fetch/polling — Plan 3 will call show() from an EventSource handler.
 */

import Link from "next/link";
import { useNotifications } from "../shell/NotificationProvider";

export default function LiveToast() {
  const { critical, dismiss } = useNotifications();

  if (!critical) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 74,
        right: 24,
        width: 340,
        background: "var(--surface)",
        border: "1px solid var(--severity-high)",
        borderLeft: "4px solid var(--severity-high)",
        borderRadius: 12,
        boxShadow: "var(--menu-shadow)",
        padding: "14px 14px 14px 16px",
        display: "flex",
        gap: 11,
        alignItems: "flex-start",
        zIndex: 100,
        animation: "toastin 280ms cubic-bezier(.2,.8,.2,1)",
      }}
      role="alert"
      aria-live="assertive"
    >
      {/* Warning icon */}
      <span
        style={{
          display: "inline-flex",
          width: 30,
          height: 30,
          borderRadius: 8,
          background: "var(--severity-high-bg)",
          color: "var(--severity-high)",
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
        }}
      >
        {/* alert-triangle inline — exact paths from mock line 537 */}
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      </span>

      {/* Text body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 3,
          }}
        >
          {critical.summary.headline}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: "var(--text-secondary)",
            lineHeight: 1.45,
            marginBottom: 9,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {critical.summary.detail}
        </div>
        <Link
          href="/docs/whats-new"
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--severity-high)",
            textDecoration: "none",
            cursor: "pointer",
          }}
        >
          View update →
        </Link>
      </div>

      {/* Dismiss button */}
      <button
        onClick={dismiss}
        className="uw-closebtn"
        aria-label="Dismiss notification"
        style={{
          display: "inline-flex",
          width: 24,
          height: 24,
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          background: "transparent",
          color: "var(--text-tertiary)",
          borderRadius: 6,
          cursor: "pointer",
          flex: "none",
        }}
      >
        {/* X / close icon — exact paths from mock line 542 */}
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
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

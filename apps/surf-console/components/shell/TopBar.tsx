"use client";

/**
 * TopBar.tsx — reproduces .dc.html lines 126–166.
 * Global Scope dropdown, search, icon cluster, org pill, MR avatar.
 * Bell red-dot reads from NotificationContext (critical !== null).
 * Falls back to hasCriticalUpdate prop if rendered outside the provider.
 * The docs icon links to /docs.
 */

import Link from "next/link";
import Icon from "../ui/Icon";
import Hoverable from "../ui/Hoverable";
import { useNotifications } from "./NotificationProvider";

interface TopBarProps {
  hasCriticalUpdate?: boolean;
  orgName?: string;
}

export default function TopBar({
  hasCriticalUpdate = false,
  orgName = "Surf-Zone Org",
}: TopBarProps) {
  // Prefer the live context value; fall back to the static prop so TopBar
  // still works correctly if rendered outside <NotificationProvider>.
  const { critical } = useNotifications();
  const showBellDot = critical !== null || hasCriticalUpdate;

  return (
    <header
      style={{
        height: 60,
        flex: "none",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 18px",
      }}
    >
      {/* Global Scope selector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          fontSize: 14,
          color: "var(--text-primary)",
          cursor: "pointer",
        }}
      >
        <span style={{ display: "inline-flex", color: "var(--text-secondary)" }}>
          <Icon name="target" size={16} strokeWidth={1.9} />
        </span>
        Global Scope
        <span style={{ display: "inline-flex", color: "var(--text-tertiary)" }}>
          <Icon name="chevron-down" size={15} strokeWidth={2} />
        </span>
      </div>

      {/* Search bar */}
      <div
        className="uw-searchinput"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: 34,
          padding: "0 12px",
          border: "1px solid var(--border-subtle)",
          borderRadius: 8,
          color: "var(--text-tertiary)",
          fontSize: 13,
          minWidth: 220,
          cursor: "text",
        }}
      >
        <Icon name="search" size={15} strokeWidth={2} />
        <span style={{ flex: 1 }}>Search zones, alerts, docs…</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 6px",
            borderRadius: 5,
            background: "var(--bg-secondary)",
            color: "var(--text-tertiary)",
          }}
        >
          ⌘K
        </span>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Gift / what's new icon with badge "3" */}
      <button
        className="uw-iconbtn"
        title="What's new"
        style={{
          position: "relative",
          width: 34,
          height: 34,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          background: "transparent",
          borderRadius: 8,
          color: "var(--text-secondary)",
          cursor: "pointer",
        }}
      >
        <Icon name="gift" size={19} strokeWidth={1.9} />
        <span
          style={{
            position: "absolute",
            top: 3,
            right: 4,
            minWidth: 15,
            height: 15,
            padding: "0 3px",
            borderRadius: 8,
            background: "var(--uw-primary-02)",
            color: "#fff",
            fontSize: 10,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          3
        </span>
      </button>

      {/* Plus / add */}
      <button
        className="uw-iconbtn"
        title="Add"
        style={{
          width: 34,
          height: 34,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          background: "transparent",
          borderRadius: 8,
          color: "var(--text-secondary)",
          cursor: "pointer",
        }}
      >
        <Icon name="plus" size={19} strokeWidth={2} />
      </button>

      {/* Docs link icon → /docs */}
      <Link
        href="/docs"
        role="button"
        className="uw-iconbtn"
        title="Documentation"
        style={{
          width: 34,
          height: 34,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          borderRadius: 8,
          color: "var(--text-secondary)",
          cursor: "pointer",
          textDecoration: "none",
        }}
      >
        <Icon name="book-open" size={19} strokeWidth={1.9} />
      </Link>

      {/* Message / chat */}
      <button
        className="uw-iconbtn"
        title="Messages"
        style={{
          width: 34,
          height: 34,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          background: "transparent",
          borderRadius: 8,
          color: "var(--text-secondary)",
          cursor: "pointer",
        }}
      >
        <Icon name="message-circle" size={19} strokeWidth={1.9} />
      </button>

      {/* AI Copilot — gradient sparkles */}
      <button
        className="uw-iconbtn"
        title="AI Copilot"
        style={{
          position: "relative",
          width: 34,
          height: 34,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          background: "transparent",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        <Icon name="sparkles-gradient" size={19} />
      </button>

      {/* Notifications bell — red dot bound to hasCriticalUpdate */}
      <button
        className="uw-iconbtn"
        title="Notifications"
        style={{
          position: "relative",
          width: 34,
          height: 34,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          background: "transparent",
          borderRadius: 8,
          color: "var(--text-secondary)",
          cursor: "pointer",
        }}
      >
        <Icon name="bell" size={19} strokeWidth={1.9} />
        {showBellDot && (
          <span
            style={{
              position: "absolute",
              top: 5,
              right: 6,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--severity-high)",
              border: "1.5px solid var(--surface)",
            }}
          />
        )}
      </button>

      {/* Org pill */}
      <Hoverable
        as="div"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: 34,
          padding: "0 8px 0 11px",
          border: "1px solid var(--border-subtle)",
          borderRadius: 8,
          fontSize: 13,
          color: "var(--text-primary)",
          cursor: "pointer",
          marginLeft: 4,
          background: "transparent",
        }}
        hoverStyle={{ background: "var(--interactive-hover)" }}
      >
        <span style={{ display: "inline-flex", color: "var(--severity-safe)" }}>
          {/* circle from mock line 161: just a circle */}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
          </svg>
        </span>
        {orgName}
        <span style={{ display: "inline-flex", color: "var(--text-tertiary)" }}>
          <Icon name="chevron-down" size={14} strokeWidth={2} />
        </span>
      </Hoverable>

      {/* MR Avatar */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "#0E9E8E",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 600,
          flex: "none",
        }}
      >
        MR
      </div>
    </header>
  );
}

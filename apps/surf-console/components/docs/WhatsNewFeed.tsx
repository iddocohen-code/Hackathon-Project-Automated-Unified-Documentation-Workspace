"use client";

/**
 * WhatsNewFeed — client component that splits ChangeEntry[] into unread/read
 * using localStorage-backed read-state, and renders:
 *   - Primary feed: unread entries (newest-first)
 *   - Header controls: "Read all" button + "Show read" toggle
 *   - Read section: dimmed earlier entries revealed by "Show read"
 *   - Empty state: "You're all caught up" when nothing is unread
 *
 * Source: design-mock lines 319–356.
 *
 * Props:
 *   entries — ChangeEntry[] (newest-first, sorted by caller)
 */

import React, { useState } from "react";
import type { ChangeEntry } from "@surf/types";
import ChangeEntryCard from "./ChangeEntryCard";
import { useReadState } from "../../lib/readState";

interface WhatsNewFeedProps {
  entries: ChangeEntry[];
}

export default function WhatsNewFeed({ entries }: WhatsNewFeedProps) {
  const { isRead, markRead, markAllRead } = useReadState();
  const [showRead, setShowRead] = useState(false);

  const unread = entries.filter((e) => !isRead(e.id));
  const read = entries.filter((e) => isRead(e.id));

  const allCaughtUp = unread.length === 0 && !showRead;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header controls row */}
      {(unread.length > 0 || read.length > 0) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 10,
            paddingBottom: 4,
          }}
        >
          {unread.length > 0 && (
            <button
              onClick={() => markAllRead(entries.map((e) => e.id))}
              style={{
                fontSize: 12.5,
                fontWeight: 500,
                color: "var(--uw-primary-01)",
                background: "transparent",
                border: "1px solid var(--uw-primary-02)",
                borderRadius: 6,
                padding: "4px 12px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Read all
            </button>
          )}
          {read.length > 0 && (
            <button
              onClick={() => setShowRead((v) => !v)}
              style={{
                fontSize: 12.5,
                fontWeight: 500,
                color: "var(--text-secondary)",
                background: "transparent",
                border: "1px solid var(--border-subtle)",
                borderRadius: 6,
                padding: "4px 12px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {showRead ? "Hide read" : "Show read"}
            </button>
          )}
        </div>
      )}

      {/* Unread entries — primary feed */}
      {unread.map((entry) => (
        <ChangeEntryCard
          key={entry.id}
          entry={entry}
          onMarkRead={markRead}
        />
      ))}

      {/* Empty / all-caught-up state */}
      {allCaughtUp && (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "var(--text-tertiary)",
            fontSize: 14,
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 10 }}>✓</div>
          You&apos;re all caught up
        </div>
      )}

      {/* Read section revealed by "Show read" toggle */}
      {showRead && read.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              paddingTop: 8,
              paddingBottom: 2,
            }}
          >
            Earlier
          </div>
          {read.map((entry) => (
            <ChangeEntryCard
              key={entry.id}
              entry={entry}
              read
              onMarkRead={markRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}

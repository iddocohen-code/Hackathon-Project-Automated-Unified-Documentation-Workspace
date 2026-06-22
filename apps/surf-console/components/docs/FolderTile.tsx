"use client";

/**
 * FolderTile — iOS-style folder tile with 2×2 gradient icon mini-grid.
 * Source: design-mock lines 382–429.
 *
 * Props:
 *   categoryId   — used to select the correct icon set + gradient theme
 *   name         — display label
 *   count        — number of docs
 *   isUpdated    — show pulsing "Updated" badge (only incident-protocols)
 *   onOpen?      — click handler (only wired for incident-protocols; others decorative)
 */

import React, { useState } from "react";

interface FolderTileProps {
  categoryId: string;
  name: string;
  count: number;
  isUpdated?: boolean;
  onOpen?: () => void;
}

/* ── Per-category icon cells (2×2 grid) ───────────────────────── */

type IconCell = {
  gradient: string;
  path: React.ReactNode;
};

const TILE_CONFIGS: Record<string, { background: string; shadow: string; cells: IconCell[] }> = {
  "telemetry-metrics": {
    background:
      "linear-gradient(160deg,rgba(255,255,255,.78),rgba(232,238,246,.92))",
    shadow:
      "inset 0 1px 1px rgba(255,255,255,.85),0 10px 22px rgba(15,23,42,.09)",
    cells: [
      {
        gradient: "linear-gradient(160deg,#3d82ec,#2052b8)",
        path: (
          <>
            <path d="M3 3v16a2 2 0 0 0 2 2h16" />
            <path d="m7 14 4-4 4 4 5-5" />
          </>
        ),
      },
      {
        gradient: "linear-gradient(160deg,#26c9ec,#0090b0)",
        path: (
          <>
            <path d="m12 14 4-4" />
            <path d="M3.34 19a10 10 0 1 1 17.32 0" />
          </>
        ),
      },
      {
        gradient: "linear-gradient(160deg,#8b76fb,#5a44e0)",
        path: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
      },
      {
        gradient: "linear-gradient(160deg,#33b277,#147045)",
        path: (
          <>
            <path d="M16 7h6v6" />
            <path d="m22 7-8.5 8.5-5-5L2 17" />
          </>
        ),
      },
    ],
  },
  "network-currents": {
    background:
      "linear-gradient(160deg,rgba(255,255,255,.78),rgba(232,238,246,.92))",
    shadow:
      "inset 0 1px 1px rgba(255,255,255,.85),0 10px 22px rgba(15,23,42,.09)",
    cells: [
      {
        gradient: "linear-gradient(160deg,#2fd1ee,#0095b5)",
        path: (
          <>
            <path d="M2 6c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" />
            <path d="M2 12c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" />
            <path d="M2 18c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" />
          </>
        ),
      },
      {
        gradient: "linear-gradient(160deg,#22b9a0,#0e8a76)",
        path: (
          <>
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
          </>
        ),
      },
      {
        gradient: "linear-gradient(160deg,#4d8bff,#1f5fe0)",
        path: (
          <>
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.2 7.8 14.1 14.1 7.8 16.2 9.9 9.9" />
          </>
        ),
      },
      {
        gradient: "linear-gradient(160deg,#7da0ff,#3d63d8)",
        path: <path d="M5 12h14M12 5l7 7-7 7" />,
      },
    ],
  },
  "alerts-remediation": {
    background:
      "linear-gradient(160deg,rgba(255,255,255,.78),rgba(232,238,246,.92))",
    shadow:
      "inset 0 1px 1px rgba(255,255,255,.85),0 10px 22px rgba(15,23,42,.09)",
    cells: [
      {
        gradient: "linear-gradient(160deg,#ffa23a,#e06f00)",
        path: (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ),
      },
      {
        gradient: "linear-gradient(160deg,#f7c948,#d19a00)",
        path: (
          <>
            <path d="M10.3 21a2 2 0 0 0 3.4 0" />
            <path d="M3.3 15.3A1 1 0 0 0 4 17h16a1 1 0 0 0 .7-1.7C19.4 14 18 12.5 18 8A6 6 0 0 0 6 8c0 4.5-1.4 6-2.7 7.3" />
          </>
        ),
      },
      {
        gradient: "linear-gradient(160deg,#33b277,#147045)",
        path: (
          <>
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            <path d="m9 12 2 2 4-4" />
          </>
        ),
      },
      {
        gradient: "linear-gradient(160deg,#2fd1ee,#0095b5)",
        path: (
          <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C4 11.1 3 13 3 15a7 7 0 0 0 7 7z" />
        ),
      },
    ],
  },
  "incident-protocols": {
    background:
      "linear-gradient(160deg,rgba(255,238,235,.9),rgba(255,224,219,.92))",
    shadow:
      "inset 0 1px 1px rgba(255,255,255,.85),0 10px 22px rgba(242,88,60,.16)",
    cells: [
      {
        gradient: "linear-gradient(160deg,#f47158,#cc3014)",
        path: (
          <>
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </>
        ),
      },
      {
        gradient: "linear-gradient(160deg,#ff7a63,#e5483d)",
        path: (
          <>
            <path d="M7 18v-6a5 5 0 0 1 10 0v6M5 18h14M12 2v2M3 10 5 8M21 10l-2-2" />
          </>
        ),
      },
      {
        gradient: "linear-gradient(160deg,#ffa23a,#e06f00)",
        path: (
          <>
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <path d="M4 22v-7" />
          </>
        ),
      },
      {
        gradient: "linear-gradient(160deg,#5a86f5,#2052b8)",
        path: (
          <>
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v5h5" />
            <path d="M9 13h6M9 17h4" />
          </>
        ),
      },
    ],
  },
};

export default function FolderTile({
  categoryId,
  name,
  count,
  isUpdated = false,
  onOpen,
}: FolderTileProps) {
  const [hovered, setHovered] = useState(false);
  const config = TILE_CONFIGS[categoryId] ?? TILE_CONFIGS["telemetry-metrics"]!;

  const countLabel =
    categoryId === "incident-protocols"
      ? `${count} docs · tap to open`
      : `${count} docs`;

  return (
    <div
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={
        onOpen
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onOpen();
            }
          : undefined
      }
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 11,
        cursor: onOpen ? "pointer" : "default",
        transition: "transform 170ms cubic-bezier(.2,.8,.2,1)",
        transform: hovered ? "translateY(-5px)" : "translateY(0)",
      }}
    >
      {/* Folder icon tile */}
      <div
        style={{
          position: "relative",
          aspectRatio: "1/1",
          width: "100%",
          borderRadius: 24,
          padding: 13,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: 9,
          background: config.background,
          border: "1px solid rgba(255,255,255,.7)",
          boxShadow: config.shadow,
        }}
      >
        {config.cells.map((cell, i) => (
          <span
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 13,
              background: cell.gradient,
              boxShadow: "0 1px 2px rgba(15,23,42,.2)",
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {cell.path}
            </svg>
          </span>
        ))}

        {/* "Updated" badge — only for incident-protocols */}
        {isUpdated && (
          <span
            style={{
              position: "absolute",
              top: -7,
              right: -7,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 9.5,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 50,
              background: "var(--uw-primary-02)",
              color: "#fff",
              border: "2px solid var(--surface)",
              animation: "badgepulse 1.8s ease-in-out infinite",
            }}
          >
            Updated
          </span>
        )}
      </div>

      {/* Label */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{name}</div>
        <div
          style={{
            fontSize: 12,
            color: "var(--text-secondary)",
            marginTop: 2,
          }}
        >
          {countLabel}
        </div>
      </div>
    </div>
  );
}

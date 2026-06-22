"use client";

/**
 * FolderGrid — 4-up responsive grid of FolderTile.
 * Source: design-mock lines 369–429.
 *
 * Props:
 *   categories         — array of { id, name } objects from the manifest
 *   counts             — map of categoryId → doc count
 *   incidentProtocolDocs — Doc[] for the incident-protocols category (loaded
 *                          server-side in app/docs/page.tsx; passed here to
 *                          keep the server/client boundary clean)
 *
 * "What's New" button lives in the row above the grid, linking to /docs/whats-new.
 */

import React, { useState } from "react";
import Link from "next/link";
import FolderTile from "./FolderTile";
import FolderModal from "./FolderModal";
import type { DocCategory, Doc } from "@surf/types";

interface FolderGridProps {
  categories: DocCategory[];
  counts: Record<string, number>;
  incidentProtocolDocs: Doc[];
}

export default function FolderGrid({
  categories,
  counts,
  incidentProtocolDocs,
}: FolderGridProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const incidentCategory = categories.find(
    (c) => c.id === "incident-protocols"
  );

  return (
    <div>
      {/* "App directory" row + What's New button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
          }}
        >
          App directory
        </div>

        {/* What's New button — links to /docs/whats-new */}
        <Link
          href="/docs/whats-new"
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            gap: 9,
            height: 40,
            padding: "0 18px",
            background: "var(--severity-high)",
            color: "#fff",
            border: "1px solid var(--severity-high)",
            borderRadius: 10,
            fontFamily: "inherit",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            textDecoration: "none",
            animation: "sirenpulse 1.4s ease-in-out infinite",
          }}
          className="uw-btn-siren"
        >
          <span
            style={{
              position: "relative",
              display: "inline-flex",
              width: 9,
              height: 9,
            }}
          >
            <span
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "#fff",
                opacity: 0.55,
                animation: "uwpulse 1.4s ease-out infinite",
              }}
            />
            <span
              style={{
                position: "relative",
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: "#fff",
              }}
            />
          </span>
          What&apos;s New
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 18,
              height: 18,
              padding: "0 5px",
              borderRadius: 50,
              background: "#fff",
              color: "var(--severity-high)",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            1
          </span>
        </Link>
      </div>

      {/* 4-up folder tile grid — responsive via .surf-folder-grid in globals.css */}
      <div className="surf-folder-grid">
        {categories.map((cat) => (
          <FolderTile
            key={cat.id}
            categoryId={cat.id}
            name={cat.name}
            count={counts[cat.id] ?? 0}
            isUpdated={cat.id === "incident-protocols"}
            onOpen={
              cat.id === "incident-protocols"
                ? () => setModalOpen(true)
                : undefined
            }
          />
        ))}
      </div>

      {/* FolderModal — mounts only when open */}
      {modalOpen && incidentCategory && (
        <FolderModal
          category={incidentCategory}
          docs={incidentProtocolDocs}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

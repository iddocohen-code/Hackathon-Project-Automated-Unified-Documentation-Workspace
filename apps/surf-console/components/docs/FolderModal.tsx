"use client";

/**
 * FolderModal — iOS-style frosted pop-open overlay for a doc category.
 * Source: design-mock lines 500–531.
 *
 * Props:
 *   category — DocCategory to display
 *   docs     — Doc[] belonging to this category (passed from server)
 *   onClose  — callback to dismiss the modal
 *
 * Behaviour:
 *   - Closes on ESC key or backdrop click
 *   - Each doc tile links to /docs/<id>
 *   - Shark Mitigation doc (id: "shark-mitigation") shows the "Updated" badge
 */

import React, { useEffect } from "react";
import Link from "next/link";
import type { DocCategory, Doc } from "@surf/types";

interface FolderModalProps {
  category: DocCategory;
  docs: Doc[];
  /** doc ids that were recently updated (by the automation) — drive "Updated" badges */
  updatedDocIds?: string[];
  onClose: () => void;
}

/** Per-doc visual config: gradient + icon path */
function getDocVisual(docId: string): {
  gradient: string;
  shadow: string;
  path: React.ReactNode;
} {
  if (docId === "shark-mitigation") {
    return {
      gradient: "linear-gradient(160deg,#f47158,#cc3014)",
      shadow: "0 8px 20px rgba(242,88,60,0.32)",
      path: (
        <>
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <path d="M14 2v5h5" />
          <path d="M9 13h6M9 17h4" />
        </>
      ),
    };
  }
  // Storm Surge Response and any other incident-protocol docs
  return {
    gradient: "linear-gradient(160deg,#5a86f5,#2052b8)",
    shadow: "0 8px 20px rgba(44,114,221,0.28)",
    path: (
      <>
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v5h5" />
        <path d="M9 13h6M9 17h4" />
      </>
    ),
  };
}

export default function FolderModal({
  category,
  docs,
  updatedDocIds = [],
  onClose,
}: FolderModalProps) {
  // Close on ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 210,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "rgba(18,26,38,0.38)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        animation: "overlayfade 200ms ease",
      }}
    >
      {/* Card — stop propagation so clicking inside doesn't close */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: 560,
          maxWidth: "100%",
          background: "rgba(255,255,255,0.74)",
          backdropFilter: "blur(30px) saturate(180%)",
          WebkitBackdropFilter: "blur(30px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.65)",
          borderRadius: 32,
          boxShadow: "0 30px 90px rgba(15,23,42,0.4)",
          padding: "32px 32px 38px",
          animation: "folderpop 340ms cubic-bezier(.2,.9,.25,1)",
          transformOrigin: "center",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="uw-closebtn"
          style={{
            position: "absolute",
            top: 18,
            right: 18,
            width: 30,
            height: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            borderRadius: "50%",
            background: "rgba(120,130,145,0.16)",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "var(--severity-high)",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                width: 18,
                height: 18,
                borderRadius: 6,
                background: "var(--severity-high-bg)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
              </svg>
            </span>
            Folder
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "var(--text-primary)",
            }}
          >
            {category.name}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              marginTop: 3,
            }}
          >
            {docs.length} document{docs.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Doc tiles */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 40,
          }}
        >
          {docs.map((doc) => {
            const visual = getDocVisual(doc.id);
            // "Updated" shows only when the automation actually regenerated this
            // doc (recent updatedAt), computed server-side — never hardcoded.
            const isUpdated = updatedDocIds.includes(doc.id);

            return (
              <Link
                key={doc.id}
                href={`/docs/${doc.id}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 11,
                  width: 120,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textDecoration: "none",
                  transition: "transform 150ms ease",
                }}
                className="uw-doc-tile"
              >
                <div
                  style={{
                    position: "relative",
                    width: 82,
                    height: 82,
                    borderRadius: 21,
                    background: visual.gradient,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: visual.shadow,
                  }}
                >
                  <svg
                    width="34"
                    height="34"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {visual.path}
                  </svg>

                  {isUpdated && (
                    <span
                      style={{
                        position: "absolute",
                        top: -8,
                        right: -10,
                        display: "inline-flex",
                        alignItems: "center",
                        fontSize: 9.5,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 50,
                        background: "var(--uw-primary-02)",
                        color: "#fff",
                        border: "2px solid #fff",
                        animation: "badgepulse 1.8s ease-in-out infinite",
                      }}
                    >
                      Updated
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    textAlign: "center",
                    lineHeight: 1.3,
                  }}
                >
                  {doc.title}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

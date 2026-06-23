/**
 * DocTree — the left pane: categories → docs, built from the manifest.
 * Pure server-renderable (no hooks); active doc highlighted via selectedId.
 * Each doc links to /admin?doc=<id>.
 */

import Link from "next/link";
import type { DocCategory, Doc } from "@surf/types";

interface DocTreeProps {
  categories: DocCategory[];
  docs: Doc[];
  selectedId: string | null;
}

export default function DocTree({ categories, docs, selectedId }: DocTreeProps) {
  return (
    <nav
      style={{
        width: 260,
        flexShrink: 0,
        borderRight: "1px solid var(--border-subtle, #E2E8F0)",
        overflowY: "auto",
        padding: "12px 0",
        background: "var(--bg-primary, #fff)",
      }}
    >
      {categories.map((cat) => {
        const inCat = docs.filter((d) => d.category.id === cat.id);
        return (
          <div key={cat.id} style={{ marginBottom: 10 }}>
            <div
              style={{
                padding: "6px 16px",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--text-secondary, #64748B)",
              }}
            >
              {cat.name}
            </div>
            {inCat.length === 0 && (
              <div style={{ padding: "4px 16px 4px 24px", fontSize: 13, color: "var(--text-secondary, #94A3B8)" }}>
                (no editable docs)
              </div>
            )}
            {inCat.map((d) => {
              const active = d.id === selectedId;
              return (
                <Link
                  key={d.id}
                  href={`/admin?doc=${encodeURIComponent(d.id)}`}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 6,
                    padding: "7px 16px 7px 22px",
                    fontSize: 14,
                    textDecoration: "none",
                    color: active ? "var(--uw-primary-01, #4f46e5)" : "var(--text-primary, #0F172A)",
                    background: active ? "var(--uw-primary-05, #EEF2FF)" : "transparent",
                    borderLeft: active ? "2px solid var(--uw-primary-01, #4f46e5)" : "2px solid transparent",
                  }}
                >
                  <span>{d.title}</span>
                  <span style={{ marginLeft: "auto", color: "var(--text-secondary, #94A3B8)", fontSize: 12 }}>
                    v{d.version}
                  </span>
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

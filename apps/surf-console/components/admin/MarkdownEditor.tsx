"use client";

/**
 * MarkdownEditor — the center+right panes: a plain <textarea> bound to the doc
 * body, a live preview using the SAME Markdown renderer as the portal, an
 * optional change-note field, and a Save action that POSTs to the authenticated
 * proxy (-> bot -> atomic publisher). Optimistic concurrency via baseVersion.
 *
 * Mounted with key={docId} by the page so switching docs resets state cleanly.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Markdown from "../docs/Markdown";

interface MarkdownEditorProps {
  docId: string;
  title: string;
  category: string;
  version: number;
  initialBody: string;
}

type SaveStatus = { kind: "ok" | "err"; msg: string } | null;

export default function MarkdownEditor({
  docId,
  title,
  category,
  version,
  initialBody,
}: MarkdownEditorProps) {
  const router = useRouter();
  const [body, setBody] = useState(initialBody);
  const [savedBody, setSavedBody] = useState(initialBody);
  const [changeNote, setChangeNote] = useState("");
  const [baseVersion, setBaseVersion] = useState(version);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<SaveStatus>(null);

  const dirty = body !== savedBody;

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch(`/admin/api/docs/${encodeURIComponent(docId)}/save`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bodyMarkdown: body, changeNote, baseVersion }),
      });

      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }

      const data = (await res.json().catch(() => ({}))) as {
        version?: number;
        currentVersion?: number;
        error?: string;
      };

      if (res.ok) {
        const newVersion = data.version ?? baseVersion + 1;
        setSavedBody(body);
        setBaseVersion(newVersion);
        setChangeNote("");
        setStatus({ kind: "ok", msg: `Saved v${newVersion}` });
        router.refresh(); // refresh the server-rendered tree (version labels)
      } else if (res.status === 409) {
        setStatus({
          kind: "err",
          msg: `This doc changed underneath you (now v${data.currentVersion}). Reload to edit the latest.`,
        });
      } else {
        setStatus({ kind: "err", msg: data.error ?? "Save failed; nothing was written." });
      }
    } catch {
      setStatus({ kind: "err", msg: "Network error; nothing was written." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
      {/* Toolbar */}
      <div
        style={{
          flexShrink: 0,
          padding: "12px 20px",
          borderBottom: "1px solid var(--border-subtle, #E2E8F0)",
          background: "var(--bg-primary, #fff)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary, #64748B)" }}>{category}</div>
          <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            <span>{title}</span>
            <span style={{ fontSize: 12, color: "var(--text-secondary, #94A3B8)" }}>
              v{baseVersion}
              {dirty ? ` → v${baseVersion + 1}` : ""}
            </span>
            {dirty && (
              <span
                title="Unsaved changes"
                style={{ width: 8, height: 8, borderRadius: 999, background: "var(--severity-high, #f2583c)" }}
              />
            )}
          </div>
        </div>

        <input
          value={changeNote}
          onChange={(e) => setChangeNote(e.target.value)}
          placeholder="Change note (optional)"
          style={{
            marginLeft: "auto",
            width: 240,
            padding: "7px 10px",
            fontSize: 13,
            borderRadius: "var(--radius-md, 8px)",
            border: "1px solid var(--border-subtle, #CBD5E1)",
          }}
        />
        <button
          onClick={save}
          disabled={saving || !dirty}
          style={{
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            borderRadius: "var(--radius-md, 8px)",
            border: "none",
            background: "var(--action-primary, #4f46e5)",
            color: "#fff",
            cursor: saving || !dirty ? "default" : "pointer",
            opacity: saving || !dirty ? 0.5 : 1,
          }}
        >
          {saving ? "Saving…" : `Save v${baseVersion + 1}`}
        </button>
      </div>

      {status && (
        <div
          role="status"
          style={{
            flexShrink: 0,
            padding: "8px 20px",
            fontSize: 13,
            color: status.kind === "ok" ? "var(--severity-safe, #16a34a)" : "var(--severity-high, #f2583c)",
            background: status.kind === "ok" ? "rgba(22,163,74,0.08)" : "rgba(242,88,60,0.08)",
          }}
        >
          {status.kind === "ok" ? "✓ " : "⚠ "}
          {status.msg}
        </div>
      )}

      {/* Split: editor | preview */}
      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          spellCheck={false}
          style={{
            flex: 1,
            minWidth: 0,
            resize: "none",
            border: "none",
            outline: "none",
            padding: "20px 24px",
            fontFamily: "var(--font-mono-family, ui-monospace, monospace)",
            fontSize: 14,
            lineHeight: 1.6,
            background: "var(--bg-primary, #fff)",
            color: "var(--text-primary, #0F172A)",
            borderRight: "1px solid var(--border-subtle, #E2E8F0)",
          }}
        />
        <div
          style={{
            flex: 1,
            minWidth: 0,
            overflowY: "auto",
            padding: "20px 28px",
            background: "var(--bg-secondary, #F8FAFC)",
          }}
        >
          <Markdown>{body}</Markdown>
        </div>
      </div>
    </div>
  );
}

import React from "react";

const steps = [
  "Sound the alert across all zone speakers.",
  "Clear all swimmers and surfers from the water.",
  "Notify lifeguard command.",
  "Log the incident.",
];

export default function SharkMitigationCard() {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 8, boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Shark mitigation procedures</div>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 50, background: "var(--severity-safe-bg)", color: "var(--severity-safe)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--severity-safe)" }} />
          Clear
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: 16 }}>
        {/* Zone status */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 8 }}>Zone status</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500, color: "var(--severity-safe)" }}>
            <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8 }}>
              <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--severity-safe)", opacity: 0.4, animation: "uwpulse 1.6s ease-out infinite" }} />
              <span style={{ position: "relative", width: 8, height: 8, borderRadius: "50%", background: "var(--severity-safe)" }} />
            </span>
            Clear — no shark activity detected
          </div>
        </div>

        {/* Procedure steps */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 8 }}>Response procedure</div>
          <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            {steps.map((step, i) => (
              <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "var(--text-secondary)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 20, height: 20, borderRadius: "50%", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", flex: "none" }}>
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 32, padding: "0 14px", background: "var(--surface)", color: "var(--text-primary)", border: "1px solid var(--border-primary)", borderRadius: 4, fontFamily: "inherit", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <path d="M4 22v-7" />
            </svg>
            Raise flag
          </button>
          <button style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 32, padding: "0 14px", background: "var(--surface)", color: "var(--text-primary)", border: "1px solid var(--border-primary)", borderRadius: 4, fontFamily: "inherit", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
            </svg>
            Notify command
          </button>
        </div>
      </div>
    </div>
  );
}

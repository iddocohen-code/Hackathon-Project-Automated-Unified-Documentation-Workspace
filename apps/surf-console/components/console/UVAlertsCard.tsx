import React from "react";

export default function UVAlertsCard() {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 8, boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>UV index alerts</div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 50, background: "var(--severity-medium-bg)", color: "var(--severity-medium)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--severity-medium)" }} />
          Very high
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: 16 }}>
        {/* UV donut + description */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "conic-gradient(var(--severity-medium) 0deg 270deg, var(--bg-secondary) 270deg 360deg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "none",
          }}>
            <div style={{ width: 62, height: 62, borderRadius: "50%", background: "var(--surface)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 28, fontWeight: 600, color: "var(--severity-medium)", lineHeight: 1 }}>9</span>
              <span style={{ fontSize: 9, color: "var(--text-tertiary)" }}>UV index</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500, color: "var(--text-primary)" }}>UV 9 — Very high</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.45 }}>
              Peak exposure 11:00–15:00. Advise sun protection across all zones.
            </div>
          </div>
        </div>

        {/* Alert box */}
        <div style={{ border: "1px solid var(--severity-medium)", background: "var(--severity-medium-bg)", borderRadius: 8, padding: 13, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--severity-medium)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
            <span style={{ fontSize: 13.5, fontWeight: 500 }}>High UV exposure detected</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 32, padding: "0 14px", background: "var(--action-primary)", color: "#fff", border: "1px solid var(--action-primary)", borderRadius: 4, fontFamily: "inherit", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>
              Apply sunscreen protocol
            </button>
            <button style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 32, padding: "0 14px", background: "var(--surface)", color: "var(--text-primary)", border: "1px solid var(--border-primary)", borderRadius: 4, fontFamily: "inherit", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>
              Resolve
            </button>
          </div>
        </div>

        {/* Resolved item */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-tertiary)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--severity-safe)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <span style={{ textDecoration: "line-through" }}>Morning UV advisory resolved · 08:10</span>
        </div>
      </div>
    </div>
  );
}

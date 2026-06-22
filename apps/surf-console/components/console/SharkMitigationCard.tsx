import React from "react";
import Icon from "../ui/Icon";

const steps = [
  "Sound the alert across all zone speakers.",
  "Clear all swimmers and surfers from the water.",
  "Notify lifeguard command.",
  "Log the incident.",
];

export default function SharkMitigationCard() {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 8, boxShadow: "var(--shadow-sm)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
        <span style={{ display: "inline-flex", width: 26, height: 26, borderRadius: 6, background: "var(--severity-high-bg)", color: "var(--severity-high)", alignItems: "center", justifyContent: "center", flex: "none" }}>
          <Icon name="shield" size={16} />
        </span>
        <div style={{ fontSize: 14, fontWeight: 500 }}>Shark mitigation procedures</div>
      </div>

      {/* Body */}
      <div style={{ padding: 16, display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Zone status inline */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 14 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)" }}>
            Zone status:{" "}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 500, padding: "2px 9px", borderRadius: 50, background: "var(--severity-safe-bg)", color: "var(--severity-safe)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--severity-safe)" }} />
              Clear
            </span>
          </span>
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Last drill: 3d ago</span>
        </div>

        {/* Procedure steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--bg-secondary)", color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 13.5, lineHeight: 1.4 }}>{step}</span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
          <button style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 34, padding: "0 13px", background: "var(--surface)", color: "var(--text-primary)", border: "1px solid var(--border-primary)", borderRadius: 4, fontFamily: "inherit", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>
            <Icon name="flag" size={14} />
            Raise flag
          </button>
          <button style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 34, padding: "0 13px", background: "var(--surface)", color: "var(--text-primary)", border: "1px solid var(--border-primary)", borderRadius: 4, fontFamily: "inherit", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>
            <Icon name="message-circle" size={14} />
            Notify command
          </button>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import WaveHeightCard from "./WaveHeightCard";
import CurrentsCard from "./CurrentsCard";
import UVAlertsCard from "./UVAlertsCard";
import SharkMitigationCard from "./SharkMitigationCard";

export default function Dashboard() {
  return (
    <div style={{ padding: "26px 28px 60px" }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 500, letterSpacing: "-0.01em", margin: "0 0 4px" }}>
            Surf-Zone Operations
          </h1>
          <div style={{ fontSize: 15, color: "var(--text-secondary)" }}>
            Real-time conditions &amp; safety
          </div>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 500, padding: "5px 12px", borderRadius: 50, background: "var(--severity-safe-bg)", color: "var(--severity-safe)" }}>
          <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8 }}>
            <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--severity-safe)", opacity: 0.4, animation: "uwpulse 1.6s ease-out infinite" }} />
            <span style={{ position: "relative", width: 8, height: 8, borderRadius: "50%", background: "var(--severity-safe)" }} />
          </span>
          Live
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
          Updated just now · North Coast district
        </span>
      </div>

      {/* Cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <WaveHeightCard />
        <CurrentsCard />
        <UVAlertsCard />
        <SharkMitigationCard />
      </div>
    </div>
  );
}

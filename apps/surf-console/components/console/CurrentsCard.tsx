import React from "react";

interface CurrentRow {
  time: string;
  zone: string;
  dir: string;
  speed: string;
  status: "Normal" | "Rip current" | "Caution";
  highlight?: boolean;
}

const rows: CurrentRow[] = [
  { time: "09:42", zone: "North Break", dir: "NW", speed: "2.1 kn", status: "Normal" },
  { time: "09:43", zone: "Cove", dir: "W", speed: "1.4 kn", status: "Normal" },
  { time: "09:44", zone: "Pier", dir: "Offshore", speed: "4.6 kn", status: "Rip current", highlight: true },
  { time: "09:46", zone: "South Point", dir: "SW", speed: "3.2 kn", status: "Caution" },
  { time: "09:48", zone: "North Break", dir: "NW", speed: "2.3 kn", status: "Normal" },
  { time: "09:51", zone: "Cove", dir: "NW", speed: "3.8 kn", status: "Caution" },
  { time: "09:53", zone: "South Point", dir: "S", speed: "2.7 kn", status: "Normal" },
];

function StatusBadge({ status }: { status: CurrentRow["status"] }) {
  let bg: string, color: string, dotBg: string;
  if (status === "Normal") {
    bg = "var(--severity-safe-bg)";
    color = "var(--severity-safe)";
    dotBg = "var(--severity-safe)";
  } else if (status === "Rip current") {
    bg = "var(--severity-high)";
    color = "#fff";
    dotBg = "#fff";
  } else {
    bg = "var(--severity-medium-bg)";
    color = "var(--severity-medium)";
    dotBg = "var(--severity-medium)";
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-default-family)", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 50, background: bg, color }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotBg }} />
      {status}
    </span>
  );
}

const COL = "0.7fr 1.1fr 0.7fr 0.8fr 1fr";

export default function CurrentsCard() {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 8, boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Currents &amp; drifts</div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-secondary)" }}>
            <span style={{ position: "relative", display: "inline-flex", width: 7, height: 7 }}>
              <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--severity-safe)", opacity: 0.4, animation: "uwpulse 1.6s ease-out infinite" }} />
              <span style={{ position: "relative", width: 7, height: 7, borderRadius: "50%", background: "var(--severity-safe)" }} />
            </span>
            Live
          </span>
        </div>
        <a style={{ color: "var(--text-link)", fontSize: 13, textDecoration: "none", cursor: "pointer" }}>View log</a>
      </div>

      {/* Column headers */}
      <div style={{ display: "grid", gridTemplateColumns: COL, padding: "9px 16px", background: "var(--bg-secondary)", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
        <span>Time</span>
        <span>Zone</span>
        <span>Dir</span>
        <span>Speed</span>
        <span>Status</span>
      </div>

      {/* Rows */}
      <div style={{ fontFamily: "var(--font-mono-family)", fontSize: 12.5 }}>
        {rows.map((row) => (
          <div
            key={`${row.time}-${row.zone}`}
            style={{
              display: "grid",
              gridTemplateColumns: COL,
              alignItems: "center",
              padding: "10px 16px",
              borderTop: "1px solid var(--border-subtle)",
              background: row.highlight ? "var(--severity-high-bg)" : undefined,
            }}
          >
            <span style={{ color: "var(--text-secondary)" }}>{row.time}</span>
            <span style={{ fontWeight: row.highlight ? 500 : undefined }}>{row.zone}</span>
            <span>{row.dir}</span>
            <span>{row.speed}</span>
            <span><StatusBadge status={row.status} /></span>
          </div>
        ))}
      </div>
    </div>
  );
}

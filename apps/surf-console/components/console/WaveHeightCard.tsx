import React from "react";

export default function WaveHeightCard() {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 8, boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Wave height over time</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>North Break · meters</div>
        </div>
        <div style={{ display: "flex", gap: 2, padding: 2, background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: 7 }}>
          <span style={{ padding: "4px 11px", borderRadius: 5, color: "var(--text-secondary)", fontSize: 12, cursor: "pointer" }}>1h</span>
          <span style={{ padding: "4px 11px", borderRadius: 5, background: "var(--surface)", color: "var(--text-primary)", fontSize: 12, fontWeight: 500, boxShadow: "var(--shadow-sm)", cursor: "pointer" }}>24h</span>
          <span style={{ padding: "4px 11px", borderRadius: 5, color: "var(--text-secondary)", fontSize: 12, cursor: "pointer" }}>7d</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 40, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1 }}>
            1.8{" "}
            <span style={{ fontSize: 18, color: "var(--text-secondary)", fontWeight: 400 }}>m</span>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 13, padding: "3px 8px", borderRadius: 6, background: "var(--severity-safe-bg)", color: "var(--severity-safe)", marginBottom: 6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
            0.2 m vs prev
          </div>
        </div>

        <svg viewBox="0 0 700 190" preserveAspectRatio="none" style={{ width: "100%", height: 190, display: "block" }}>
          <defs>
            <linearGradient id="waveFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2C72DD" stopOpacity="0.22" />
              <stop offset="1" stopColor="#2C72DD" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="0" y1="48" x2="700" y2="48" stroke="#EEF2F7" strokeWidth="1" />
          <line x1="0" y1="95" x2="700" y2="95" stroke="#EEF2F7" strokeWidth="1" />
          <line x1="0" y1="142" x2="700" y2="142" stroke="#EEF2F7" strokeWidth="1" />
          <path
            d="M0,138 L30,149 L61,126 L91,104 L122,115 L152,92 L183,80 L213,97 L243,120 L274,131 L304,143 L335,126 L365,109 L396,86 L426,69 L457,92 L487,104 L517,120 L548,109 L578,92 L609,115 L639,126 L670,138 L700,104 L700,190 L0,190 Z"
            fill="url(#waveFill)"
          />
          <path
            d="M0,138 L30,149 L61,126 L91,104 L122,115 L152,92 L183,80 L213,97 L243,120 L274,131 L304,143 L335,126 L365,109 L396,86 L426,69 L457,92 L487,104 L517,120 L548,109 L578,92 L609,115 L639,126 L670,138 L700,104"
            fill="none"
            stroke="#2C72DD"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <circle cx="700" cy="104" r="4" fill="#2C72DD" stroke="#fff" strokeWidth="2" />
        </svg>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-tertiary)", marginTop: 8 }}>
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>now</span>
        </div>
      </div>
    </div>
  );
}

"use client";

/**
 * Sidebar.tsx — reproduces .dc.html lines 33–120.
 * Logo + 12 nav items + footer (Documentation Portal, Settings, 14 buoys streaming).
 * Only Home (/) and Documentation Portal (/docs) are routed + active-state aware.
 * All other nav items are decorative <button> no-ops.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "../ui/Icon";

export default function Sidebar() {
  const pathname = usePathname();

  const homeActive = pathname === "/";
  const docsActive = pathname === "/docs" || pathname.startsWith("/docs/");

  const activeStyle: React.CSSProperties = {
    background: "var(--uw-primary-05)",
    color: "var(--uw-primary-01)",
    fontWeight: 600,
  };

  const inactiveStyle: React.CSSProperties = {
    background: "transparent",
    color: "var(--text-secondary)",
    fontWeight: 400,
  };

  const navBtnBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 11,
    width: "100%",
    height: 36,
    padding: "0 11px",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
    fontSize: "13.5px",
  };

  const iconActive: React.CSSProperties = { display: "inline-flex", flex: "none", color: "var(--uw-primary-01)" };
  const iconInactive: React.CSSProperties = { display: "inline-flex", flex: "none", color: "var(--text-tertiary)" };

  return (
    <aside
      style={{
        width: 224,
        flex: "none",
        background: "var(--surface)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header / Logo */}
      <div
        style={{
          height: 60,
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 14px 0 18px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: "var(--upwind-theme-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
            }}
          >
            <Icon name="waves" size={16} stroke="#fff" strokeWidth={2.2} />
          </span>
          <span
            style={{
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            Surf-Zone
          </span>
        </div>
        <span style={{ display: "inline-flex", color: "var(--text-tertiary)", cursor: "pointer" }}>
          <Icon name="chevrons-left" size={16} strokeWidth={2} />
        </span>
      </div>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          padding: "12px 12px 6px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          overflowY: "auto",
        }}
      >
        {/* Home — routed */}
        <Link
          href="/"
          role="button"
          className="uw-navbtn"
          style={{
            textDecoration: "none",
            ...navBtnBase,
            ...(homeActive ? activeStyle : inactiveStyle),
          }}
        >
          <span style={homeActive ? iconActive : iconInactive}>
            <Icon name="home" size={18} />
          </span>
          <span style={{ flex: 1 }}>Home</span>
        </Link>

        {/* Conditions — decorative */}
        <button className="uw-navbtn" style={{ ...navBtnBase, ...inactiveStyle }}>
          <span style={iconInactive}><Icon name="activity" size={18} /></span>
          <span style={{ flex: 1 }}>Conditions</span>
        </button>

        {/* Beach Zones — decorative */}
        <button className="uw-navbtn" style={{ ...navBtnBase, ...inactiveStyle }}>
          <span style={iconInactive}><Icon name="layers" size={18} /></span>
          <span style={{ flex: 1 }}>Beach Zones</span>
        </button>

        {/* Hazard Map — decorative (has blue dot badge) */}
        <button className="uw-navbtn" style={{ ...navBtnBase, position: "relative", ...inactiveStyle }}>
          <span style={{ position: "relative", display: "inline-flex", flex: "none", color: "var(--text-tertiary)" }}>
            <Icon name="globe" size={18} />
            <span
              style={{
                position: "absolute",
                top: -1,
                right: -2,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--uw-primary-02)",
              }}
            />
          </span>
          <span style={{ flex: 1 }}>Hazard Map</span>
        </button>

        {/* Forecast — decorative */}
        <button className="uw-navbtn" style={{ ...navBtnBase, ...inactiveStyle }}>
          <span style={iconInactive}><Icon name="cloud" size={18} /></span>
          <span style={{ flex: 1 }}>Forecast</span>
        </button>

        {/* Hazards — decorative */}
        <button className="uw-navbtn" style={{ ...navBtnBase, ...inactiveStyle }}>
          <span style={iconInactive}><Icon name="alert-triangle" size={18} /></span>
          <span style={{ flex: 1 }}>Hazards</span>
        </button>

        {/* Equipment — decorative (has blue dot badge) */}
        <button className="uw-navbtn" style={{ ...navBtnBase, position: "relative", ...inactiveStyle }}>
          <span style={{ position: "relative", display: "inline-flex", flex: "none", color: "var(--text-tertiary)" }}>
            <Icon name="sliders" size={18} />
            <span
              style={{
                position: "absolute",
                top: -1,
                right: -2,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--uw-primary-02)",
              }}
            />
          </span>
          <span style={{ flex: 1 }}>Equipment</span>
        </button>

        {/* Lifeguards — decorative */}
        <button className="uw-navbtn" style={{ ...navBtnBase, ...inactiveStyle }}>
          <span style={iconInactive}><Icon name="user" size={18} /></span>
          <span style={{ flex: 1 }}>Lifeguards</span>
        </button>

        {/* Telemetry — decorative */}
        <button className="uw-navbtn" style={{ ...navBtnBase, ...inactiveStyle }}>
          <span style={iconInactive}><Icon name="line-chart" size={18} /></span>
          <span style={{ flex: 1 }}>Telemetry</span>
        </button>

        {/* AI Copilot — decorative */}
        <button className="uw-navbtn" style={{ ...navBtnBase, ...inactiveStyle }}>
          <span style={iconInactive}><Icon name="sparkles" size={18} /></span>
          <span style={{ flex: 1 }}>AI Copilot</span>
        </button>

        {/* Buoys — decorative */}
        <button className="uw-navbtn" style={{ ...navBtnBase, ...inactiveStyle }}>
          <span style={iconInactive}><Icon name="share2" size={18} /></span>
          <span style={{ flex: 1 }}>Buoys</span>
        </button>

        {/* Shark Watch — decorative (has severity-high red dot) */}
        <button className="uw-navbtn" style={{ ...navBtnBase, position: "relative", ...inactiveStyle }}>
          <span style={{ position: "relative", display: "inline-flex", flex: "none", color: "var(--text-tertiary)" }}>
            <Icon name="alert-circle" size={18} />
            <span
              style={{
                position: "absolute",
                top: -1,
                right: -2,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--severity-high)",
              }}
            />
          </span>
          <span style={{ flex: 1 }}>Shark Watch</span>
        </button>
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "8px 12px 12px",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {/* Documentation Portal — routed */}
        <Link
          href="/docs"
          role="button"
          className="uw-navbtn"
          style={{
            textDecoration: "none",
            ...navBtnBase,
            ...(docsActive ? activeStyle : inactiveStyle),
          }}
        >
          <span style={docsActive ? iconActive : iconInactive}>
            <Icon name="book-open" size={18} />
          </span>
          <span style={{ flex: 1 }}>Documentation Portal</span>
        </Link>

        {/* Settings — decorative */}
        <button className="uw-navbtn" style={{ ...navBtnBase, ...inactiveStyle }}>
          <span style={iconInactive}><Icon name="settings" size={18} /></span>
          <span style={{ flex: 1 }}>Settings</span>
        </button>

        {/* 14 buoys streaming status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontSize: 12,
            color: "var(--text-secondary)",
            padding: "8px 11px 2px",
          }}
        >
          <span
            style={{
              position: "relative",
              display: "inline-flex",
              width: 8,
              height: 8,
              flex: "none",
            }}
          >
            <span
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "var(--severity-safe)",
                opacity: 0.4,
                animation: "uwpulse 1.6s ease-out infinite",
              }}
            />
            <span
              style={{
                position: "relative",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--severity-safe)",
              }}
            />
          </span>
          14 buoys streaming
        </div>
      </div>
    </aside>
  );
}

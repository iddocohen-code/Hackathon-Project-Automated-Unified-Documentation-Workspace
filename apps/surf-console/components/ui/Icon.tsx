/**
 * Icon.tsx — inline-SVG helper keyed by the lucide icon path set used in the shell.
 * Only the icons actually used by the shell are included (YAGNI).
 */

import React from "react";

type IconName =
  | "waves"        // logo / surf wave icon
  | "chevrons-left"
  | "home"
  | "activity"     // Conditions
  | "layers"       // Beach Zones
  | "globe"        // Hazard Map
  | "cloud"        // Forecast
  | "alert-triangle" // Hazards
  | "sliders"      // Equipment
  | "user"         // Lifeguards
  | "line-chart"   // Telemetry
  | "sparkles"     // AI Copilot
  | "share2"       // Buoys
  | "alert-circle" // Shark Watch
  | "book-open"    // Documentation Portal
  | "settings"     // Settings
  | "target"       // Global Scope
  | "chevron-down"
  | "search"
  | "gift"         // TopBar gift/welcome icon
  | "plus"         // TopBar add icon
  | "message-circle" // TopBar chat icon
  | "sparkles-gradient" // AI Copilot TopBar (gradient)
  | "bell"         // Notifications
  | "flag"         // Raise flag action
  | "shield"       // Shark mitigation header
  | "siren";       // Emergency Shark Siren

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
  stroke?: string;
}

const PATHS: Record<IconName, React.ReactNode> = {
  waves: (
    <>
      <path d="M2 16c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" />
      <path d="M2 11c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" />
    </>
  ),
  "chevrons-left": (
    <>
      <path d="m11 17-5-5 5-5" />
      <path d="m18 17-5-5 5-5" />
    </>
  ),
  home: (
    <>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9" />
      <path d="M9 21v-6h6v6" />
    </>
  ),
  activity: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  layers: (
    <>
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m6.08 9.5-3.48 1.59a1 1 0 0 0 0 1.81l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9a1 1 0 0 0 0-1.83L17.92 9.5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a14.5 14.5 0 0 0 0 18 14.5 14.5 0 0 0 0-18" />
      <path d="M3 12h18" />
    </>
  ),
  cloud: <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />,
  "alert-triangle": (
    <>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 21v-7" />
      <path d="M4 10V3" />
      <path d="M12 21v-9" />
      <path d="M12 8V3" />
      <path d="M20 21v-5" />
      <path d="M20 12V3" />
      <path d="M2 14h4" />
      <path d="M10 8h4" />
      <path d="M18 16h4" />
    </>
  ),
  user: (
    <>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  "line-chart": (
    <>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="m7 14 4-4 4 4 5-5" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 4l1.7 4.6L18 10l-4.3 1.4L12 16l-1.7-4.6L6 10l4.3-1.4Z" />
      <path d="M19 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
    </>
  ),
  share2: (
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </>
  ),
  "alert-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </>
  ),
  "book-open": (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
  settings: (
    <>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </>
  ),
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  gift: (
    <>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8M16.5 8a2.5 2.5 0 0 0 0-5C13 3 12 8 12 8" />
    </>
  ),
  plus: <path d="M5 12h14M12 5v14" />,
  "message-circle": <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />,
  "sparkles-gradient": (
    <>
      <defs>
        <linearGradient id="szgrad" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0" stopColor="#F2583C" />
          <stop offset="0.5" stopColor="#9214C4" />
          <stop offset="1" stopColor="#1E71ED" />
        </linearGradient>
      </defs>
      <path
        d="M12 4l1.7 4.6L18 10l-4.3 1.4L12 16l-1.7-4.6L6 10l4.3-1.4Z"
        stroke="url(#szgrad)"
      />
      <path
        d="M19 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"
        stroke="url(#szgrad)"
      />
    </>
  ),
  bell: (
    <>
      <path d="M10.3 21a2 2 0 0 0 3.4 0" />
      <path d="M3.3 15.3A1 1 0 0 0 4 17h16a1 1 0 0 0 .7-1.7C19.4 14 18 12.5 18 8A6 6 0 0 0 6 8c0 4.5-1.4 6-2.7 7.3" />
    </>
  ),
  flag: (
    <>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <path d="M4 22v-7" />
    </>
  ),
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  siren: (
    <>
      <path d="M12 2a7 7 0 0 1 7 7v5H5V9a7 7 0 0 1 7-7z" />
      <path d="M5 14h14v2H5z" />
      <path d="M9 17h6v2a3 3 0 0 1-6 0v-2z" />
      <path d="M2 8.5l1.5 1" />
      <path d="M22 8.5l-1.5 1" />
      <path d="M12 2V0" />
    </>
  ),
};

export default function Icon({ name, size = 18, stroke, ...rest }: IconProps) {
  // For sparkles-gradient, we skip the parent stroke so child paths handle it
  const isGradient = name === "sparkles-gradient";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={isGradient ? "none" : stroke ?? "currentColor"}
      strokeWidth={isGradient ? undefined : 1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}

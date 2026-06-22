# Frontend Design Spec — Smart Surf-Zone Console & Docs Portal

**Date:** 2026-06-22
**Purpose:** A self-contained visual + structural brief to feed into a Claude design tool (Claude
artifacts, Figma Make, or Figma MCP) to generate the **mock frontend**. Tool-agnostic. After
generation, the mock is delivered back and integrated into the monorepo (`apps/surf-console`).

> Read this as a design brief, not code. Every screen, component, state, and visual token below
> should be reflected in the generated mock. Sample content is provided so the mock looks real, not
> lorem-ipsum.

---

## 0. What we're designing

One web app with **two surfaces**:
1. **The Surf-Zone Management Console** — a cloud-security-style operations dashboard, themed as a
   beach/surf safety console. This is the "product."
2. **The embedded Docs Portal** — a beautiful documentation experience inside the same app
   (iOS-style folder navigation, natural-language search, and a "What's New" feed).

The two share a top navigation so you can move between **Console** and **Docs**.

---

## 1. Brand & visual direction

**Personality:** modern, trustworthy cloud-security console — clean, data-dense but calm — with a
fresh coastal/surf accent. Think "Linear/Vercel dashboard meets a lifeguard tower." Professional
first, playful second.

**Aesthetic anchors**
- Crisp cards with soft shadows and generous rounding (the docs portal leans into an **iOS**
  feel: rounded-2xl tiles, frosted/translucent surfaces, spring animations).
- Light mode primary; a dark mode is a nice-to-have, not required for the mock.
- Subtle ocean gradient accents; never cartoonish.

## 2. Design tokens

**Color**
- Background: `#F7F9FB` (app), `#FFFFFF` (cards)
- Primary / brand (ocean blue): `#0A84FF` (iOS-blue family) with hover `#0066CC`
- Teal/aqua accent: `#14B8A6`
- Text: `#0B1320` (primary), `#5B6573` (secondary), `#8A94A6` (muted)
- Severity: info `#0A84FF`, success `#16A34A`, warning/UV `#F59E0B`, **critical/shark** `#E5484D`
- Borders/dividers: `#E6EAF0`

**Typography**
- Font: Inter (or system `-apple-system`) — clean, modern.
- Scale: page title 28/600, section 20/600, card title 16/600, body 14/400, caption 12/500.

**Shape & depth**
- Radius: cards `16px`, tiles `20px`, buttons/inputs `10px`, chips `999px`.
- Shadow: `0 1px 2px rgba(11,19,32,.06), 0 8px 24px rgba(11,19,32,.06)`.
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32.

**Motion**
- Spring-based open/close for folders; toast slides+fades in from top-right; chart/number subtle
  count-up on load. Keep it tasteful.

## 3. App shell / global layout

- **Top bar:** left = product logo + name "Surf-Zone Console"; center/left tabs = **Console** |
  **Docs**; right = global search icon, a notification bell (with a red dot when a critical update
  exists), and a user avatar.
- **Content area:** max-width container, comfortable padding.
- The **Docs** tab opens the docs portal (Section 5); **Console** opens the dashboard (Section 4).

---

## 4. Surface A — The Surf-Zone Console (dashboard)

A responsive grid (2 columns desktop, 1 column mobile) of four cards. Header row: page title
"Surf-Zone Operations" + a subtitle "Real-time conditions & safety" + a small live "● Live" pill.

### 4.1 Wave Height Over Time — *(maps to Metrics & Telemetry)*
- Card with title + a time-range segmented control (1h / 24h / 7d).
- An area/line **time-series chart** of wave height (meters) over time.
- A current value big-number ("1.8 m") with a small up/down delta vs previous.
- Sample data: gentle wave between 0.8–2.4 m across 24 points.

### 4.2 Currents & Drifts — *(maps to Logs & Network Traffic)*
- Card titled "Currents & Drifts" with a live-updating **log/flow table**.
- Columns: Time · Zone · Direction · Speed (kn) · Status.
- Status pills: Normal (teal), Caution (amber), Rip Current (red).
- Sample rows: 6–8 entries, e.g. `09:42 · North Break · NW · 2.1 kn · Normal`,
  `09:44 · Pier · Offshore · 4.6 kn · Rip Current`.

### 4.3 UV Index Alerts — *(maps to Runtime Security Alerts & Remediation)*
- Card titled "UV Index Alerts."
- A prominent UV index gauge/number ("UV 9 — Very High", amber/red).
- One **alert card** with a remediation action: "High UV exposure detected" + a recommended
  action button **"Apply Sunscreen Protocol"** (this is the "remediation/resolve" analog) and a
  "Resolve" secondary action. Show one resolved item struck-through to imply history.

### 4.4 Shark Mitigation Procedures ⭐ — *(maps to Critical Incident Protocols — THE HERO)*
This is the most important card; it's where the demo's new button lands.
- Card titled "Shark Mitigation Procedures" with a small red **shield/critical** icon.
- A short status line: "Zone status: **Clear**" (green) with a "Last drill: 3d ago."
- A vertical list of **procedure steps** (numbered): e.g. 1) Sound the alert, 2) Clear the water,
  3) Notify lifeguard command, 4) Log the incident.
- A row of **action buttons** at the bottom: e.g. **"Raise Flag"**, **"Notify Command"**.
  - IMPORTANT: design the button row so it can comfortably accommodate **one additional button**
    later (the demo adds an **"Emergency Shark Siren"** button — red/critical styled). Please
    include a mock of this red **"Emergency Shark Siren"** button as a variant/second state so we
    can show before/after. (Two versions of this card: *before* = without the siren button,
    *after* = with the red "Emergency Shark Siren" button.)

---

## 5. Surface B — The Docs Portal (the showcase)

Three blocks. This is where polish matters most.

### 5.1 iOS-style hierarchical navigation (the landing view of Docs)
- A header: "Documentation" + a subtitle + a prominent **search bar** (see 5.2).
- A **grid of folder tiles** (rounded-2xl, ~3 across desktop). Each tile: a colored icon chip, a
  folder name, and an item count ("4 docs"). Hover lifts the tile slightly.
- **Top-level folders (sample):**
  - 📈 **Telemetry & Metrics** (4 docs)
  - 🌊 **Network & Currents** (3 docs)
  - ☀️ **Alerts & Remediation** (3 docs)
  - 🛡️ **Incident Protocols** (2 docs) — contains **"Shark Mitigation Procedures"**
- **Progressive disclosure:** clicking a folder animates it open (spring) to reveal its contents —
  either sub-folders or document rows. Show a **breadcrumb** (Docs / Incident Protocols) and a back
  affordance. Design both states: (a) the folder grid, (b) an opened folder showing a list of doc
  rows (title + "updated 2m ago" + a small "Updated" badge on recently changed docs).

### 5.2 Smart RAG search
- A natural-language search bar ("Ask anything about the console…").
- Design the **results/answer state**: a synthesized answer card at the top (a short paragraph
  answer) followed by **cited source rows** (doc title + matched snippet + a "Jump to section →"
  deep link). Include a subtle "Answered by AI" label.
- Sample query to mock: *"How do I trigger the shark siren?"* → answer paragraph + a citation to
  "Shark Mitigation Procedures → Emergency Siren."

### 5.3 A rendered document page
- Left: a slim contextual tree/breadcrumb. Main: the doc.
- Doc header: title, category chip, "Updated 2 minutes ago," a version tag, and a small **"What
  changed" callout** linking to the What's New entry.
- Body: markdown-style content — headings, numbered procedure steps, and an **embedded screenshot**
  (show a placeholder screenshot of the Shark panel inline, with a caption).
- Design it for the Shark Mitigation doc specifically (sample content below).

### 5.4 "What's New" feed
- A reverse-chronological **timeline** of update cards. Each card:
  - A severity indicator (a red dot/badge for **critical**, blue for info).
  - Headline (e.g. **"New Emergency Shark Siren button added"**).
  - 1–2 line detail of the business intent.
  - **Provenance chips:** small pill tags like `JIRA SURF-142`, `#surf-safety`, `Confluence`,
    `PR #128` — each looks like a linkable source.
  - A **before/after screenshot** thumbnail pair (the Shark panel without vs with the siren button).
  - Footer: timestamp + "View doc →" deep link.
- Design at least 3 entries so the timeline feels alive (one critical = the shark siren, two info).

### 5.5 Live notification (toast)
- A top-right **toast/pop** that appears for critical updates:
  - Red accent, a ⚠️ icon, title "Shark Mitigation protocol updated," a one-line subtitle, and a
    "View update →" button (deep-links into the What's New entry).
  - Also reflect this as a red dot on the top-bar notification bell.

---

## 6. Sample content (use this so the mock reads as real)

**Shark Mitigation doc (after the update):**
> # Shark Mitigation Procedures
> When a shark is sighted in or near a monitored zone, lifeguards must act immediately to protect
> swimmers and surfers.
>
> ## Emergency response steps
> 1. **Sound the Emergency Shark Siren** — press the red *Emergency Shark Siren* button on the
>    Shark Mitigation panel to broadcast the evacuation alarm across all zone speakers.
> 2. Raise the red hazard flag.
> 3. Clear all swimmers and surfers from the water.
> 4. Notify Lifeguard Command and log the incident.
>
> *(screenshot: Shark Mitigation panel showing the new Emergency Shark Siren button)*

**What's New — critical entry (sample):**
> 🔴 **New Emergency Shark Siren button added** · 2m ago
> A one-press siren control was added to the Shark Mitigation panel so lifeguards can trigger the
> zone-wide evacuation alarm instantly.
> Sources: `JIRA SURF-142` · `#surf-safety` · `Confluence: Shark Runbook` · `PR #128`
> [before/after screenshots] · View doc →

## 7. States to design (don't skip these)
- Folder grid (default) **and** an opened folder.
- A rendered doc with an embedded screenshot.
- Search **empty** state and search **answer** state.
- What's New timeline with a **critical** and **info** entries.
- The live **toast** notification + the bell's red-dot state.
- The Shark Mitigation console card in **both** before (no siren) and after (red siren button)
  variants.

## 8. Responsive
- Desktop-first (the demo is on a big screen), but cards/tiles should reflow to a single column on
  mobile. The docs folder grid goes 3-col → 1-col.

## 9. What to deliver back to engineering
Whatever the design tool outputs, ideally one or more of:
- **React + Tailwind component code** (preferred — drops straight into `apps/surf-console`), or
- A **Figma file / frames**, or
- **High-fidelity screenshots** of every screen/state in Section 7.

Keep components reasonably separated (Console cards vs Docs components) so they map onto the planned
`components/console/*` and `components/docs/*` structure. Hardcoded mock data is fine and expected —
the engine will replace it with real generated content during integration.

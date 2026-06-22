# Upwind Design System

A design system for **Upwind Security** — the runtime-powered CNAPP (Cloud-Native
Application Protection Platform). It packages Upwind's brand, foundations, UI
primitives, and full-screen product recreations so any agent can produce
on-brand console screens, marketing pages, and decks.

---

## 1. Company & product context

Upwind is a **runtime-powered CNAPP**: it unifies application security, security
posture, and real-time protection on a single platform, using *infrastructure and
application runtime insights* as the core data to prioritize risk — the
"right-to-left" method (from runtime back to code).

**Pillars** (the product surface area): Vulnerability Management · CSPM (posture)
· DSPM (data) · Container & Kubernetes Security · CWPP · CDR (cloud detection &
response) · API Security · Identity Security. A lightweight **eBPF sensor**
provides process-, network-, and file-level runtime visibility.

**Surfaces represented in this system**
- **Console** (`console.upwind.io`) — the security product. Light + dark themes,
  dense enterprise tables, severity-driven. → `ui_kits/console/`
- **Marketing site** (`upwind.io`) — confident, benefit-led, big gradient
  moments. → `ui_kits/website/`
- **Decks** — internal/external platform overviews. → `slides/`

**Sources used to build this system**
- `uploads/colors_and_type.css` — the authoritative token export ("Source of
  truth: shared-library/src/DefaultStyles/"). Split into `tokens/*.css` here.
- Brand assets: `logo_u.svg` (wordmark), `upwind_logo.svg` / `upwind_mark_logo*.svg`
  (U mark), 6 surf/ocean spot illustrations, custom **Upwind Sans** font (3 weights).
- `deck-stage.js` — the deck runtime, used in `slides/`.
- Public product/brand language: upwind.io, docs.upwind.io, AWS Marketplace
  listing (referenced for copy tone and product taxonomy; not a private source).

> ⚠️ No product codebase or Figma file was provided. The UI kits are
> **faithful recreations** built on the real token system + public product
> knowledge, not pixel-extractions from source. If you have the `shared-library`
> repo or Figma, share it and the kits can be tightened to exact spec.

---

## 2. Content fundamentals (voice & copy)

**Personality:** confident, fast, and human. Upwind is the challenger that makes
serious cloud security feel effortless. There's a recurring **surf/ocean
metaphor** ("Up and Upwind", "The Next Wave", "realtime era") that gives the
brand warmth without being cute.

- **Person:** Address the reader as **"you / your"**; refer to the product as
  **"Upwind"** (never "we" in UI labels). Marketing may use "we" sparingly for
  the company voice.
- **Casing:** **Sentence case everywhere** — headlines, buttons, table headers,
  nav. Reserve ALL-CAPS for tiny eyebrow/kicker labels and column headers
  (11–13px, letter-spacing ~0.04–0.08em). Never title-case UI labels.
- **Marketing rhythm:** short, declarative, benefit-first. Punchy fragments are
  encouraged: *"You find us. You click. You're protected."* / *"Cloud security
  the way it should be."* Lead with the outcome, then the mechanism.
- **Product copy:** precise and scannable. Name things like an engineer:
  `CVE-2024-3094`, `checkout-api`, `us-east-1`, `runtime: active`. Severity and
  status come first; prose second. Avoid hype inside the console.
- **Numbers & proof:** concrete and specific ("4.9/5 on Gartner Peer Insights",
  "Gartner projects >50% of data theft via unsecured APIs"). Don't invent stats.
- **Emoji:** Allowed in **social & marketing** as a light accent — almost always
  the surfer 🏄 ("Up and Upwind! 🏄"). **Never** in the product UI, never as
  data icons. Don't introduce other emoji into the palette.
- **Vibe words:** runtime context · what's *actually* exposed · single pane of
  glass · prioritize · real-time · consolidate · from runtime to code.

---

## 3. Visual foundations

**Colors** (`tokens/colors.css`)
- **Brand primary is blue** — `--uw-primary-02 #2C72DD` is *the* Upwind blue;
  `-01` is the hover/pressed darker, `-05/-06` the tints for selected nav and
  soft fills. Blue is for interaction and brand, not decoration.
- **Grays are cool/slate** (`#18202D → #F8FAFC`): text, borders, page/surface.
- **Severity is the console's most-loaded color language**: critical (coral
  `#EC6850`), high (red `#F2583C`), medium (amber `#FF8710`), low (yellow
  `#F0B100`), info (gray), safe (green `#1FA062`). Always paired with a tinted
  `*-bg`. Use `SeverityBadge` rather than raw hexes.
- **Rich accent palette** (purple, royal-purple, cyan, metal-blue, electric-blue,
  magenta, eggplant — each in 6 steps) for charts, topology, and tags.
- **Signature gradient** `--upwind-theme-gradient` (coral → purple → blue, 94°).
  This is the brand's one hero flourish — use it for hero/CTA backgrounds and
  occasional gradient *text* on a single key phrase. **Never** behind body text
  or inside the console. Avoid generic blue-purple gradients elsewhere.
- **Full light + dark themes.** Dark is real (shipped across the console). Drive
  it with `[data-theme="dark"]` on `<html>`; every semantic token re-maps.

**Type** (`tokens/typography.css`)
- **Upwind Sans** for everything UI; **DM Mono** for code, CVEs, resource names,
  timestamps, IPs. 14px base — this is a **compact, information-dense** system.
- Headings use **weight 500 (medium)**, not bold, with slightly negative
  letter-spacing. Bold (700) is reserved for marketing **display** type.
- Console text floor is 14px (12/11px only for labels & meta). On slides, never
  below ~18px; display 56–84px.

**Spacing, radius, elevation** (`tokens/spacing.css`)
- 4px spacing base (`--space-4 … --space-64`).
- **Radii are small and crisp:** `4px` is the default (buttons, inputs, badges,
  tags); `8px` for cards; `16–24px` for large containers / marketing; `pill`
  for chips & toggles. Nothing is very round — the console feels precise.
- **Shadows are subtle.** `--shadow-sm` for resting cards, `--shadow-md` on
  hover, `--menu-shadow` for popovers. No heavy/colored drop shadows in-app.
  Marketing may use one large soft shadow under the hero product shot.

**Cards.** White surface, 1px `--border-subtle`, 8px radius, `--shadow-sm`.
Optional header (title 14/500 + 12px secondary subtitle) divided by a hairline,
with a right-aligned actions slot. Interactive cards lift to `--shadow-md` and
darken their border on hover. No colored left-border accent cards.

**Backgrounds.** App is flat: white surfaces on a `#F8FAFC` page, hairline
borders doing the structural work. Marketing is mostly white/light with **one**
dark+gradient CTA block and a soft blurred gradient glow behind the hero.
No repeating patterns, no textures, no photographic noise/grain. Imagery is the
**flat pastel surf illustrations** (cool blues + warm coral/sand, friendly,
optimistic) — used for empty states, onboarding, and marketing spots, presented
on white/rounded tiles.

**Motion.** Restrained and quick. Transitions ~120–140ms ease on background,
border, color, box-shadow, and toggle knobs. A subtle `pulse` halo marks live
status (sensor streaming). No bounces, no parallax, no long decorative loops.
Respect `prefers-reduced-motion`.

**Interaction states.**
- *Hover:* primary/danger buttons **darken** (`--action-primary-hover`); ghost/
  secondary/icon buttons get a light `--interactive-hover` wash; rows tint with
  `--interactive-hover`.
- *Focus:* 3px brand-blue ring (`--uw-primary-05`) + blue border on inputs.
- *Pressed/active:* settle to `--interactive-active` / a darker brand step — no
  shrink/scale transforms.
- *Selected:* brand tint background + brand text (nav, tabs, filter chips); tabs
  add a 2px brand underline.

**Transparency & blur.** Used sparingly: a `blur(12px)` translucent sticky nav on
marketing, and the soft blurred gradient hero glow. Not used inside the console.

**Layout.** Console = fixed 224px left sidebar + 56px top bar, scrolling content
at 24px padding. Tables are bordered, zebra-free, with a `--bg-secondary` header
row and 48–52px rows. Marketing = centered max-width ~1120px, 32px gutters.

---

## 4. Iconography

- **Style:** thin **line/stroke icons on a 24px grid, ~2px stroke, round caps &
  joins** — a clean, modern outline set. Filled icons and emoji are not used as
  UI icons.
- **What's here:** Upwind's own product icon set was not provided. The kits use a
  **self-contained Lucide-style stroke set** in `ui_kits/console/icons.jsx`
  (window.UpwindIcons) — the closest open-source match for weight and geometry.
  ⚠️ **Substitution flagged:** swap in Upwind's real icon set when available; the
  `icon`/`children` props on `Button`/`IconButton` accept any node, so no API
  changes are needed.
- **Logo / mark:** the **U mark** (top bar + U bowl) and the **Upwind wordmark**.
  Mark colors: dark navy `#1E2330` on light, `#F2F7FC`/white on dark. Use
  `currentColor` variants (`assets/upwind_mark.svg`) to tint by context.
  Wordmark ships white (`upwind_wordmark.svg`) and navy (`upwind_wordmark_navy.svg`).
- **Status & severity** are communicated with small dots/badges (see
  `StatusDot`, `SeverityBadge`), not bespoke icons.
- **Brand illustrations** (`assets/illustrations/*.svg`) are flat surf/ocean
  scenes — empty states & marketing spots only. They carry a baked white
  backdrop, so place them on white or rounded white tiles (don't drop the raw
  SVG straight onto a dark surface).

---

## 5. Index / manifest

**Root**
- `styles.css` — the single entry point consumers link (imports only).
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `fonts.css` (+ `fonts/`).
- `assets/` — logos, the U mark variants, `illustrations/`, `console-screenshot.png`.
- `readme.md` (this file) · `SKILL.md` (Agent-Skills entry point).

**Components** (`components/` — bundled to `window.UpwindDesignSystem_*`)
- `forms/` — **Button**, **IconButton**, **Input**, **Switch**
- `feedback/` — **SeverityBadge**, **Badge**, **StatusDot**
- `layout/` — **Card**, **MetricCard**
- `navigation/` — **Tabs**
- `data/` — **Avatar**
- Each ships `.jsx` + `.d.ts` + `.prompt.md`, with one `@dsCard` per directory.

**UI kits**
- `ui_kits/console/` — interactive CNAPP console: Security Overview, Findings,
  Inventory, Threat Detection (+ pillar empty states), light/dark. Entry:
  `index.html` (composes `Shell`, `Dashboard`, `Findings`, `Inventory`,
  `Threats`, `icons`, `data`).
- `ui_kits/website/` — marketing homepage: nav, hero (with product shot),
  logos, pillars, stats, testimonial, gradient CTA, footer. Entry: `index.html`
  (`sections.jsx`).

**Slides** (`slides/`) — `slide-theme.css` + slide-type cards (`TitleSlide`,
`SectionSlide`, `StatSlide`, `ContentSlide`, `QuoteSlide`) and a runnable
`index.html` deck via `deck-stage.js`.

**Foundation cards** (`guidelines/`) — type, color, spacing, and brand specimen
cards that populate the Design System tab.

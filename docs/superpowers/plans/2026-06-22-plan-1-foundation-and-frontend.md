# Plan 1 — Foundation & Frontend Integration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Plan-style note (per project owner):** This plan describes *what* to build — exact paths, responsibilities, interfaces, verification, and precise pointers into `design-mock/` — but deliberately does **not** embed full component source. Implementers reproduce the UI from the cited `design-mock` sections. Type signatures and data schemas ARE given (they are design, not implementation).

**Goal:** Stand up the monorepo and turn the delivered Claude Design mock into a real, running Next.js app — the surf console + docs portal — rendering seeded **before-state** content, ready for the docs-bot engine (Plan 2) to update.

**Architecture:** One pnpm + Turborepo monorepo. A shared `@surf/types` package holds the documentation contract. `apps/surf-console` is a Next.js (App Router) app that adopts the **Upwind design system** (CSS tokens + Upwind Sans / DM Mono fonts) lifted verbatim from `design-mock/`, and reproduces the prototype's two surfaces as React components across real routes. Doc content is read from committed files under `apps/surf-console/content/docs/` (the source of truth the engine will later write to).

**Tech Stack:** TypeScript everywhere · Next.js 15 (App Router) + React 19 · Upwind design system (no shadcn/Tailwind) · pnpm 9 + Turborepo 2 · Node ≥ 20 (dev box is Node 26).

## Global Constraints

- **Language:** TypeScript only. No Python in this repo.
- **Package manager:** pnpm `9.15.9` (workspaces). Build orchestration: Turborepo `^2.3`.
- **Framework:** Next.js `^15.1` App Router, React `^19`. No `pages/` router.
- **Design system:** Adopt the Upwind DS **verbatim** from `design-mock/smart-surf-zone-management-console/project/_ds/` — tokens + `.otf` fonts. **Do NOT** introduce shadcn/ui or Tailwind. Reproduce the prototype's inline styles.
- **Severity vocabulary:** Upwind CNAPP scale `'critical' | 'high' | 'medium' | 'low' | 'info'` (matches DS tokens). The Shark "critical" items in the mock use `--severity-high` (red `#f2583c`); keep that mapping.
- **Demo baseline = BEFORE-state:** the seeded content is the state *before* the demo PR — Shark panel with only `Raise flag` / `Notify command` (NO Emergency Shark Siren), Shark doc at **v3**, and **no** siren entry in What's New. (Plan 2's demo PR adds the siren → regenerates to the mock's after-state: v4 + the critical entry.)
- **Content source of truth:** `apps/surf-console/content/docs/` holds `manifest.json`, `changelog.json`, and per-doc markdown. The portal reads these at build/request time — no runtime call to the engine in Plan 1.
- **Design source of truth (UI):** `design-mock/smart-surf-zone-management-console/project/Surf-Zone Console.dc.html` (the `.dc.html`). Reproduce it pixel-faithfully. Token files: `…/_ds/.../tokens/{colors,typography,spacing,fonts}.css`.
- **Commits:** author as the repo owner (local git config is already `Lotan Tamary <lotan.tamary@upwind.io>`). **No Claude author or `Co-Authored-By` trailer.** Commit per task.
- **RAG search + live notifications are NOT wired to a backend in this plan** — the search bar is decorative and the toast is triggered locally (real wiring lands in Plan 2/3).

---

## File Structure (decomposition — locked here)

```
/ (repo root)
├── package.json                 # workspace root: scripts (dev/build/lint via turbo), devDeps turbo+typescript
├── pnpm-workspace.yaml          # globs: apps/*, services/*, packages/*
├── turbo.json                   # tasks: build/dev/lint
├── tsconfig.base.json           # shared compiler options
├── .gitignore                   # node_modules, .next, .turbo, dist, env, next-env.d.ts
├── .env.example                 # placeholder env (consumed by Plan 2/3)
│
├── packages/types/              # @surf/types — the shared documentation contract
│   ├── package.json             # name @surf/types, main src/index.ts
│   ├── tsconfig.json            # extends base, noEmit
│   └── src/index.ts             # Doc, Screenshot, DocCategory, ChangeEntry, ChangeSummary,
│                                #   ContextRef, SearchResult, RagAnswer, PullRequestEvent,
│                                #   DocsManifest, Changelog, Severity
│
└── apps/surf-console/
    ├── package.json             # next/react/react-dom + @surf/types (workspace:*)
    ├── next.config.mjs          # transpilePackages: ['@surf/types']
    ├── tsconfig.json            # extends base; Next plugin; paths @/* -> ./
    ├── app/
    │   ├── upwind/              # ← copied verbatim from design-mock _ds (tokens + fonts/*.otf + styles.css)
    │   ├── upwind.css           # single entry that @imports ./upwind/styles.css (font urls fixed if needed)
    │   ├── globals.css          # resets, scrollbar, keyframes, hover utility classes (from the mock <style>)
    │   ├── layout.tsx           # root layout: imports upwind.css + globals.css; renders <AppShell>
    │   ├── page.tsx             # "/" → <Dashboard/> (Surface A)
    │   └── docs/
    │       ├── page.tsx         # "/docs" → <FolderGrid/> (App Grid landing)
    │       ├── whats-new/page.tsx  # "/docs/whats-new" → <WhatsNewFeed/>
    │       └── [slug]/page.tsx     # "/docs/:slug" → <DocView/>
    ├── components/
    │   ├── shell/  AppShell.tsx · Sidebar.tsx · TopBar.tsx
    │   ├── console/ Dashboard.tsx · WaveHeightCard.tsx · CurrentsCard.tsx · UVAlertsCard.tsx · SharkMitigationCard.tsx
    │   ├── docs/    DocsHeader.tsx · FolderGrid.tsx · FolderTile.tsx · FolderModal.tsx ·
    │   │           WhatsNewFeed.tsx · ChangeEntryCard.tsx · DocView.tsx · SearchBar.tsx · LiveToast.tsx
    │   └── ui/      Icon.tsx (inline-SVG helper) · Hoverable.tsx (hover-style helper)
    ├── lib/
    │   ├── content.ts           # server-side readers: getManifest(), getChangelog(), getDoc(slug)
    │   └── content.test.ts      # unit test for the readers
    └── content/docs/
        ├── manifest.json        # DocsManifest (4 categories + docs) — before-state
        ├── changelog.json       # Changelog (2 info entries; NO siren entry) — before-state
        ├── shark-mitigation/index.md   # Shark doc v3 (no siren step)
        ├── storm-surge-response/index.md
        └── (1–2 more stub docs referenced by manifest, e.g. wave-height-telemetry)
```

**Boundary rationale:** files that change together live together (console cards together; docs components together). The shell is isolated so both surfaces share it. `lib/content.ts` is the single seam between disk and UI — the only file Plan 2's publisher must stay compatible with.

---

## Task 1: Monorepo foundation

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.gitignore`, `.env.example`

**Interfaces:**
- Produces: a pnpm workspace recognizing `apps/*`, `services/*`, `packages/*`; turbo tasks `build`/`dev`/`lint`; `tsconfig.base.json` (extended by every package).

- [ ] **Step 1:** Create the six root files. `package.json` is `private`, sets `packageManager: "pnpm@9.15.9"`, scripts `dev|build|lint` → `turbo run …`, devDeps `turbo ^2.3.3` + `typescript ^5.7.2`. `pnpm-workspace.yaml` lists the three globs. `turbo.json` defines `build` (`dependsOn: ["^build"]`, outputs `.next/**` excluding cache + `dist/**`), `dev` (`cache:false, persistent:true`), `lint`. `tsconfig.base.json` = strict, `target ES2022`, `lib [ES2022,DOM,DOM.Iterable]`, `module ESNext`, `moduleResolution Bundler`, `resolveJsonModule`, `isolatedModules`, `noUncheckedIndexedAccess`. `.gitignore` per File Structure. `.env.example` with empty `ANTHROPIC_API_KEY`, `GITHUB_WEBHOOK_SECRET`, `SCHEDULER_MODE=instant`, `SURF_CONSOLE_URL`, `NEXT_PUBLIC_BOT_URL`.
- [ ] **Step 2: Verify install.** Run: `pnpm install`. Expected: completes, creates `pnpm-lock.yaml`, no workspace-resolution errors.
- [ ] **Step 3: Verify turbo wired.** Run: `pnpm turbo run build --dry=json | head`. Expected: JSON listing tasks (no packages yet is fine — exit 0).
- [ ] **Step 4: Commit.** `git add package.json pnpm-workspace.yaml turbo.json tsconfig.base.json .gitignore .env.example pnpm-lock.yaml && git commit -m "chore: monorepo foundation (pnpm workspace + turbo + tsconfig)"`

---

## Task 2: Shared documentation contract (`@surf/types`)

**Files:**
- Create: `packages/types/package.json`, `packages/types/tsconfig.json`, `packages/types/src/index.ts`

**Interfaces:**
- Produces (the full contract — exact names/types later tasks and Plan 2/3 rely on):
  - `type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'`
  - `interface DocCategory { id: string; name: string; icon: string; parentId?: string }`
  - `interface Screenshot { path: string; alt: string; capturedAt: string; targetSelector?: string }`
  - `interface ChangeSummary { headline: string; detail: string; intentSource: string }`
  - `interface ContextRef { kind: 'jira'|'slack'|'confluence'|'git'; ref: string; url: string; excerpt: string }`
  - `interface Doc { id: string; title: string; category: DocCategory; bodyMarkdown: string; screenshots: Screenshot[]; sourceComponent: string; version: number; updatedAt: string; lastChange?: ChangeSummary }`
  - `interface ChangeEntry { id: string; docId: string; summary: ChangeSummary; severity: Severity; prUrl: string; contextRefs: ContextRef[]; screenshotDiff?: { before?: string; after: string }; createdAt: string }`
  - `interface SearchResult { docId: string; title: string; snippet: string; score: number; deepLink: string }`
  - `interface RagAnswer { query: string; answer: string; citations: SearchResult[] }`
  - `interface PullRequestEvent { prUrl: string; mergedSha: string; changedPaths: string[]; title: string; body: string }`
  - `interface DocsManifest { categories: DocCategory[]; docs: Doc[] }`
  - `type Changelog = ChangeEntry[]`

- [ ] **Step 1:** Create `package.json` (`name "@surf/types"`, `private`, `main`/`types`/`exports` → `./src/index.ts`, script `lint: "tsc --noEmit"`) and `tsconfig.json` (extends base, `noEmit`, `include ["src"]`).
- [ ] **Step 2:** Author `src/index.ts` declaring exactly the interfaces/types above, with doc comments.
- [ ] **Step 3: Verify types compile.** Run: `pnpm --filter @surf/types lint`. Expected: exits 0, no errors.
- [ ] **Step 4: Commit.** `git add packages/types && git commit -m "feat(types): shared documentation contract (@surf/types)"`

---

## Task 3: Next.js app skeleton + Upwind design-system adoption

**Files:**
- Create: `apps/surf-console/package.json`, `next.config.mjs`, `tsconfig.json`, `app/layout.tsx`, `app/page.tsx` (temporary placeholder), `app/upwind.css`, `app/globals.css`
- Copy: `design-mock/.../project/_ds/upwind-design-system-*/` → `apps/surf-console/app/upwind/` (tokens + `fonts/*.otf` + `styles.css`), preserving the internal folder structure so `@font-face` `url("fonts/…")` resolves.

**Interfaces:**
- Produces: a booting Next app at `http://localhost:3000`; global CSS exposing every Upwind token (`--bg-secondary`, `--text-primary`, `--action-primary`, `--severity-*`, `--upwind-theme-gradient`, `--shadow-sm`, `--radius-*`, …) and the `Upwind Sans` / `DM Mono` font families; the keyframes `uwpulse|sirenpulse|toastin|overlayfade|folderpop|badgepulse` and hover utility classes used by later tasks.

- [ ] **Step 1:** Create `package.json` (deps `next ^15.1`, `react ^19`, `react-dom ^19`, `@surf/types: "workspace:*"`; devDeps `typescript ^5.7`, `@types/{react,react-dom,node}`; scripts `dev|build|start|lint`). `next.config.mjs` exports `{ transpilePackages: ['@surf/types'] }`. `tsconfig.json` extends base, adds the Next plugin, `jsx: preserve`, `paths { "@/*": ["./*"] }`, includes `next-env.d.ts`/`**/*.ts(x)`.
- [ ] **Step 2:** Copy the `_ds` design-system folder into `app/upwind/` (verbatim). Create `app/upwind.css` that `@import "./upwind/styles.css";` (which chains to tokens + fonts). If Next's loader rejects the relative `@font-face url("fonts/…")`, fix by pointing those urls at the copied font path (still inside `app/upwind/`).
- [ ] **Step 3:** Create `app/globals.css` porting the prototype's `<head><style>` block (`design-mock/.../Surf-Zone Console.dc.html` lines **16–27**): box-sizing reset, `html,body` (margin/padding 0, `font-family var(--font-default-family)`, `background var(--bg-secondary)`), webkit scrollbar, and the six `@keyframes`. Add hover utility classes (e.g. `.uw-navbtn:hover`, `.uw-iconbtn:hover`, `.uw-card-tile:hover`) capturing the prototype's `style-hover`/`style-focus` effects, so components apply a `className` instead of JS hover.
- [ ] **Step 4:** `app/layout.tsx` imports `./upwind.css` then `./globals.css`, sets `<html lang="en">`, `<body>` renders `{children}` (AppShell arrives in Task 4). `app/page.tsx` = temporary `<main>Surf-Zone Console — scaffolding</main>`.
- [ ] **Step 5: Verify build.** Run: `pnpm --filter surf-console build`. Expected: compiles, no type/CSS errors.
- [ ] **Step 6: Verify fonts/tokens.** Run: `pnpm --filter surf-console dev`, open `/`. Expected: page background is the Upwind off-white (`#F8FAFC`), text in **Upwind Sans** (not system default). (Confirm a `.otf` loads in the Network tab.)
- [ ] **Step 7: Commit.** `git add apps/surf-console && git commit -m "feat(console): Next.js skeleton adopting the Upwind design system"`

---

## Task 4: App shell — Sidebar + TopBar + layout chrome

**Files:**
- Create: `components/ui/Icon.tsx`, `components/ui/Hoverable.tsx`, `components/shell/Sidebar.tsx`, `components/shell/TopBar.tsx`, `components/shell/AppShell.tsx`
- Modify: `app/layout.tsx` (render `<AppShell>{children}</AppShell>`)

**Interfaces:**
- Consumes: Upwind tokens/keyframes (Task 3).
- Produces: `<AppShell>` (client component) rendering the fixed sidebar + top bar + a scrollable `<main>` slot for route content; `<Icon name=… size=… …/>` (inline-SVG helper keyed by the lucide path set used in the mock); `<Hoverable as=… style=… hoverStyle=… />`.

**Source pointers (reproduce faithfully):** Sidebar = `.dc.html` lines **33–120** (logo + 12 nav items: Home, Conditions, Beach Zones, Hazard Map, Forecast, Hazards, Equipment, Lifeguards, Telemetry, AI Copilot, Buoys, Shark Watch; footer: Documentation Portal, Settings, "14 buoys streaming"). TopBar = lines **126–166** (Global Scope, "Search zones, alerts, docs… ⌘K", icon cluster, org pill, "MR" avatar).

- [ ] **Step 1:** Build `Icon.tsx` + `Hoverable.tsx` (the two primitives every component reuses).
- [ ] **Step 2:** Build `Sidebar.tsx` reproducing lines 33–120. Wire only **Home** (`/`) and **Documentation Portal** (`/docs`) via `next/link` + `usePathname()` for the active state (active = `--uw-primary-05` bg / `--uw-primary-01` text). All other items are decorative (`<button>` no-ops).
- [ ] **Step 3:** Build `TopBar.tsx` reproducing lines 126–166. The notification bell exposes a red dot bound to a prop `hasCriticalUpdate` (default `false`; LiveToast wiring in Task 10). The docs icon links to `/docs`.
- [ ] **Step 4:** Build `AppShell.tsx` = the outer flex layout (lines **30–169 / 496–497** wrapper) composing `<Sidebar/>` + a column of `<TopBar/>` and `<main style="flex:1;overflow-y:auto">{children}</main>`. Mark `"use client"` (uses `usePathname`).
- [ ] **Step 5:** Update `app/layout.tsx` to wrap children in `<AppShell>`.
- [ ] **Step 6: Verify.** `pnpm --filter surf-console build` (passes) then `dev`: the console chrome matches the mock; clicking **Documentation Portal** routes to `/docs` (blank for now) and the active nav state moves.
- [ ] **Step 7: Commit.** `git add apps/surf-console && git commit -m "feat(console): app shell — sidebar + top bar + layout"`

---

## Task 5: Dashboard (Surface A) — the four cards, Shark in BEFORE-state

**Files:**
- Create: `components/console/WaveHeightCard.tsx`, `CurrentsCard.tsx`, `UVAlertsCard.tsx`, `SharkMitigationCard.tsx`, `Dashboard.tsx`
- Modify: `app/page.tsx` (render `<Dashboard/>`)

**Interfaces:**
- Consumes: `Icon`, `Hoverable`, tokens.
- Produces: `<Dashboard/>` — the header ("Surf-Zone Operations" + Live pill) and 2×2 card grid.

**Source pointers:** header lines **172–186**; grid **187–296**. WaveHeight **189–215** (SVG area chart verbatim — keep the `<path>` data + `waveFill` gradient + "1.8 m" + 1h/24h/7d toggle). Currents **217–235** (7-row log table; status pills Normal=`safe`, Caution=`medium`, Rip current=`high`). UV **237–259** (conic gauge "9", "Apply sunscreen protocol" + "Resolve", struck-through resolved row). Shark **261–293**.

**BEFORE-state deltas for `SharkMitigationCard.tsx` (do NOT copy the mock's after-state):**
- Zone status fixed to **Clear** (`--severity-safe`); no siren-active banner; no `sirenActive` state.
- Action buttons = **only** `Raise flag` + `Notify command` (lines 288–289). **OMIT** the `Emergency Shark Siren` button (line 290) — that is what Plan 2's demo PR adds.
- Steps: keep the four generic steps (lines 281–284: "Sound the alert across all zone speakers." / "Clear all swimmers…" / "Notify lifeguard command." / "Log the incident.").

- [ ] **Step 1:** Build the four card components per the pointers (Shark in before-state).
- [ ] **Step 2:** Build `Dashboard.tsx` = header + `grid-template-columns:1fr 1fr;gap:20px` composing the four cards. Update `app/page.tsx` to render it.
- [ ] **Step 3: Verify.** `build` passes; `dev` `/` shows all four cards faithfully; **the Shark panel shows only Raise flag / Notify command (no siren)**; UV/Currents severity colors match.
- [ ] **Step 4: Commit.** `git add apps/surf-console && git commit -m "feat(console): dashboard with four cards (Shark before-state, no siren)"`

---

## Task 6: Docs content layer + seeded BEFORE-state content

**Files:**
- Create: `content/docs/manifest.json`, `content/docs/changelog.json`, `content/docs/shark-mitigation/index.md`, `content/docs/storm-surge-response/index.md`, `content/docs/wave-height-telemetry/index.md`
- Create: `lib/content.ts`, `lib/content.test.ts`

**Interfaces:**
- Consumes: `@surf/types` (`DocsManifest`, `Changelog`, `Doc`).
- Produces:
  - `getManifest(): Promise<DocsManifest>` — parses `content/docs/manifest.json`.
  - `getChangelog(): Promise<Changelog>` — parses `content/docs/changelog.json`, newest first.
  - `getDoc(slug: string): Promise<Doc | null>` — manifest entry + injects `bodyMarkdown` from `content/docs/<slug>/index.md`.
  - `getCategories(): Promise<DocCategory[]>` and `getDocsByCategory(categoryId): Promise<Doc[]>`.

**Seed data (BEFORE-state — exact):**
- `manifest.json`: 4 categories — `telemetry-metrics` "Telemetry & Metrics" (4 docs claimed), `network-currents` "Network & Currents" (3), `alerts-remediation` "Alerts & Remediation" (3), `incident-protocols` "Incident Protocols" (2). For the build, fully define at least 3 `Doc`s: **`shark-mitigation`** (category incident-protocols, `version: 3`, `sourceComponent: "apps/surf-console/components/console/SharkMitigationCard.tsx"`, `screenshots: []`, `lastChange` describing the v3 state — NO siren), `storm-surge-response` (incident-protocols, v1), `wave-height-telemetry` (telemetry-metrics, v2). (Counts may exceed defined docs; only defined slugs are routable.)
- `changelog.json`: exactly **two `info` entries**, newest first — (1) "Wave Height chart now supports a 7-day range…" `prUrl …/pull/126`, refs `JIRA SURF-138`, `PR #126`; (2) "Currents & Drifts adds a red Rip Current status pill…" `prUrl …/pull/121`, refs `#surf-safety`, `PR #121`. **NO siren / critical entry** (Plan 2 adds it).
- `shark-mitigation/index.md`: v3 prose — the 4 generic steps, **no** "Emergency Shark Siren" step, **no** embedded screenshot.

- [ ] **Step 1: Write the failing test.** `lib/content.test.ts` (node:test + tsx, or vitest):
  - `getManifest()` returns 4 categories and includes a doc with id `shark-mitigation` at `version === 3`.
  - `getDoc('shark-mitigation')` returns a `Doc` whose `bodyMarkdown` contains "Sound the alert" and does **NOT** contain "Emergency Shark Siren".
  - `getChangelog()` returns length 2 and every entry `severity === 'info'` (asserts before-state).
  - `getDoc('does-not-exist')` resolves to `null`.
- [ ] **Step 2: Run it — must fail.** Run: `pnpm --filter surf-console test`. Expected: FAIL (module/functions absent).
- [ ] **Step 3:** Author the seed JSON + markdown files, then implement `lib/content.ts` (server-only; `fs/promises` + `path`; validate shape against `@surf/types`).
- [ ] **Step 4: Run it — must pass.** Run: `pnpm --filter surf-console test`. Expected: PASS (4/4).
- [ ] **Step 5: Commit.** `git add apps/surf-console && git commit -m "feat(content): docs content layer + seeded before-state content"`

---

## Task 7: Docs portal — App Grid landing (`/docs`)

**Files:**
- Create: `components/docs/DocsHeader.tsx`, `components/docs/SearchBar.tsx`, `components/docs/FolderTile.tsx`, `components/docs/FolderGrid.tsx`
- Modify: `app/docs/page.tsx` (server component: `getCategories()` → `<FolderGrid/>`)

**Interfaces:**
- Consumes: `getCategories()`, `getManifest()` (Task 6); `Icon`, `Hoverable`.
- Produces: `<FolderGrid categories=… counts=…/>`; `<SearchBar/>` (decorative — "Ask anything about the console (RAG)…" + "Answered by AI"; no submit behavior yet); `<FolderTile category=… count=… isUpdated=… onOpen?=…/>`.

**Source pointers:** DocsHeader (title + "Auto-generated" badge + subtitle) lines **302–305**; SearchBar **363–368**; "App directory" row + What's New button **369–381**; the 4 folder tiles (2×2 gradient icon grids) **382–429**. Map tiles from manifest categories; show the **"Updated"** badge only on `incident-protocols` (line 424). Only `incident-protocols` opens the modal (`onOpen`); the other three are decorative for now.

- [ ] **Step 1:** Build `DocsHeader`, `SearchBar`, `FolderTile`, `FolderGrid` per pointers.
- [ ] **Step 2:** `app/docs/page.tsx` (server) loads categories/counts and renders `<DocsHeader/>` + `<SearchBar/>` + `<FolderGrid/>`. The "What's New" button links to `/docs/whats-new`.
- [ ] **Step 3: Verify.** `build` passes; `dev` `/docs` shows the search bar + the four iOS folder tiles with correct counts and the pulsing "Updated" badge on Incident Protocols.
- [ ] **Step 4: Commit.** `git add apps/surf-console && git commit -m "feat(docs): app grid landing (folders + search bar)"`

---

## Task 8: Docs portal — Folder modal + What's New feed (`/docs/whats-new`)

**Files:**
- Create: `components/docs/FolderModal.tsx`, `components/docs/ChangeEntryCard.tsx`, `components/docs/WhatsNewFeed.tsx`
- Modify: `components/docs/FolderGrid.tsx` (open `<FolderModal/>` for Incident Protocols), `app/docs/whats-new/page.tsx`

**Interfaces:**
- Consumes: `getChangelog()`, `getDocsByCategory('incident-protocols')`; `Icon`.
- Produces: `<FolderModal category=… docs=… onClose=… />` (client; frosted iOS pop-open, ESC/backdrop closes; each doc links to `/docs/<id>`); `<WhatsNewFeed entries=… />` (maps `ChangeEntry[]`); `<ChangeEntryCard entry=… />` (severity stripe: `critical|high`→red `--severity-high`, else `info`→`--uw-primary`; provenance chips from `contextRefs`; "Jump to Updated Doc" → `/docs/<docId>`).

**Source pointers:** FolderModal lines **500–531** (560px frosted card; "Incident Protocols / 2 documents"; tiles Shark Mitigation [Updated badge] + Storm Surge Response). WhatsNew header **308–318**; entry cards **319–356** (the critical card 321–331 is the *visual template* — but in before-state the feed has only the two **info** cards 333–356).

- [ ] **Step 1:** Build `ChangeEntryCard` (drives both severities from `entry.severity`), `WhatsNewFeed`, `FolderModal`.
- [ ] **Step 2:** Wire `FolderGrid` so Incident Protocols opens `<FolderModal/>`; build `app/docs/whats-new/page.tsx` (server) loading the changelog into `<WhatsNewFeed/>`.
- [ ] **Step 3: Verify.** `build` passes; `dev`: Incident Protocols tile pops the frosted modal (Shark + Storm Surge); modal closes on backdrop/ESC; `/docs/whats-new` shows exactly the **two info entries** with provenance chips (no critical/siren entry — before-state).
- [ ] **Step 4: Commit.** `git add apps/surf-console && git commit -m "feat(docs): folder modal + What's New feed (before-state)"`

---

## Task 9: Docs portal — Doc view (`/docs/[slug]`)

**Files:**
- Create: `components/docs/DocView.tsx`
- Modify: `app/docs/[slug]/page.tsx` (server: `getDoc(slug)`; `notFound()` if null; `generateStaticParams` from manifest)
- Add dep: a markdown renderer (`react-markdown` + `remark-gfm`) for `bodyMarkdown`.

**Interfaces:**
- Consumes: `getDoc(slug)`; `Icon`.
- Produces: `<DocView doc=… />` — breadcrumb (Docs / `category.name` / `title`), "Back to App Directory" → `/docs`, category chip, "Updated <relative>" from `doc.updatedAt`, `v<doc.version>` tag, a "What changed" callout (from `doc.lastChange`, links to `/docs/whats-new`), the rendered `bodyMarkdown`, and — when `doc.screenshots.length` — an embedded screenshot frame (browser-chrome wrapper, lines **468–488**).

**Source pointers:** lines **433–492**. **Before-state note:** for `shark-mitigation` v3 there are no screenshots, so the embedded-screenshot frame is hidden; the "What changed" callout reflects v3's `lastChange` (not the siren). Render the markdown steps (no siren step).

- [ ] **Step 1:** Add `react-markdown` + `remark-gfm` to `apps/surf-console`. Build `DocView.tsx`.
- [ ] **Step 2:** `app/docs/[slug]/page.tsx` loads the doc, renders `<DocView/>`, `notFound()` on null, `generateStaticParams()` from manifest doc ids.
- [ ] **Step 3: Verify.** `build` passes; `dev` `/docs/shark-mitigation` shows the v3 doc (breadcrumb, `v3`, 4 steps, **no** siren step, **no** screenshot frame); `/docs/storm-surge-response` renders; an unknown slug → 404.
- [ ] **Step 4: Commit.** `git add apps/surf-console && git commit -m "feat(docs): doc view route with markdown rendering"`

---

## Task 10: Live toast + notification bell (client overlay)

**Files:**
- Create: `components/docs/LiveToast.tsx`
- Create: `components/shell/NotificationProvider.tsx` (client context: `{ critical: ChangeEntry | null, show(entry), dismiss() }`)
- Modify: `app/layout.tsx` (wrap in `<NotificationProvider>`), `TopBar.tsx` (bell red-dot from context), `AppShell.tsx` (render `<LiveToast/>`)

**Interfaces:**
- Consumes: `ChangeEntry` type; `Icon`.
- Produces: `useNotifications()` hook; `<LiveToast/>` (top-right, `toastin` animation; title "Shark Mitigation protocol updated", body, "View update →" → `/docs/whats-new`; dismiss). **Plan 1 trigger is local/manual** (e.g. a hidden dev `?demoToast=1` query or a tiny debug button) — Plan 2/3 replaces the trigger with the real bot notification (SSE/poll). The bell red-dot reflects `critical !== null`.

**Source pointers:** toast lines **534–544**; bell red-dot binding lines **155–158**.

- [ ] **Step 1:** Build `NotificationProvider` + `useNotifications()` + `LiveToast`; wire bell dot + the local trigger.
- [ ] **Step 2:** Mount provider in `layout.tsx`, toast in `AppShell.tsx`.
- [ ] **Step 3: Verify.** `build` passes; `dev`: triggering the demo notification pops the toast (correct copy/animation), the bell shows the red dot, and "View update →" routes to `/docs/whats-new`; dismiss hides it.
- [ ] **Step 4: Commit.** `git add apps/surf-console && git commit -m "feat(console): live toast + notification bell (local trigger)"`

---

## Task 11: Integration pass — responsive, full build/lint, README

**Files:**
- Create: `apps/surf-console/README.md` (run instructions)
- Modify: any card/grid containers for single-column reflow < 1024px (per design spec §8)

**Interfaces:** none new.

- [ ] **Step 1:** Add responsive reflow: dashboard grid and docs folder grid collapse to one column on narrow widths (the demo runs desktop-wide, so this is light-touch).
- [ ] **Step 2:** Write `apps/surf-console/README.md`: `pnpm install`, `pnpm --filter surf-console dev`, routes list, "content lives in `content/docs/`", "before-state — the siren is added by the docs-bot demo (Plan 2)".
- [ ] **Step 3: Verify full workspace.** Run: `pnpm build` then `pnpm lint`. Expected: both pass across the workspace.
- [ ] **Step 4: Verify the demo surfaces end-to-end (manual).** `dev`: `/` (4 cards, no siren) → click Documentation Portal → `/docs` (folders) → open Incident Protocols → Shark Mitigation → `/docs/shark-mitigation` (v3) → `/docs/whats-new` (2 info entries) → trigger toast. All faithful to the mock's before-state.
- [ ] **Step 5: Commit + push.** `git add apps/surf-console && git commit -m "chore(console): responsive pass + README; Plan 1 complete" && git push origin main`

---

## Self-Review

**Spec coverage (against the design spec §8–§11 + frontend design spec):**
- Surf console 4 components → Task 5. ✓
- Docs portal: iOS folder nav → Tasks 7–8; RAG search bar (UI only, full RAG in Plan 3) → Task 7; What's New feed → Task 8; doc view → Task 9; live toast → Task 10. ✓
- iOS folder pop-open (progressive disclosure) → Task 8. ✓
- Upwind DS adoption + fonts → Task 3. ✓
- Shared contract → Task 2; content seam (`lib/content.ts`) the engine will write to → Task 6. ✓
- Before-state baseline (no siren, doc v3, no critical entry) → Tasks 5, 6, 8, 9 (explicit). ✓
- Monorepo (pnpm + turbo) → Task 1. ✓
- **Deferred by design (not gaps):** real RAG backend + `/search` → Plan 3; live notification wiring (SSE/poll) → Plan 2/3; bot pipeline → Plan 2; agent-facing docs interface → roadmap only (spec §13.1), optional UI teaser deferred.

**Placeholder scan:** No "TBD"/"add error handling"/"similar to Task N". Where full component code is intentionally omitted, an exact `design-mock` line-range pointer is given instead (per the owner's plan-style constraint). Type signatures and seed-data schemas are concrete.

**Type consistency:** Reader names used consistently — `getManifest` / `getChangelog` / `getDoc` / `getCategories` / `getDocsByCategory` (Tasks 6→7→8→9). Contract names match `@surf/types` (Task 2) everywhere. Severity mapping (`critical|high`→red) consistent across Tasks 8/10.

**Scope:** Plan 1 produces working, demoable software on its own (the full before-state frontend). Engine and RAG are separate plans, as agreed.

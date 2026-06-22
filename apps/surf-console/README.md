# surf-console

Surf-Zone Operations Console — the Next.js 15 frontend for the Surf-Zone Management Platform.

## Getting started

Install dependencies from the monorepo root:

```bash
pnpm install
```

Start the dev server for this app only:

```bash
pnpm --filter surf-console dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Routes

| Route | Description |
|---|---|
| `/` | Dashboard — 4 real-time condition cards (Wave Height, Currents, UV Alerts, Shark Mitigation) |
| `/docs` | Documentation Portal — folder grid (App directory) |
| `/docs/whats-new` | What's New feed — changelog entries |
| `/docs/[slug]` | Individual doc view (e.g. `/docs/shark-mitigation`) |

## Content

All documentation content lives in `content/docs/`. The manifest (`manifest.json`), changelog (`changelog.json`), and per-document Markdown files are read at build time via `lib/content.ts`.

## Before-state note

This is the **BEFORE-state** of the demo. Specifically:

- The **Emergency Shark Siren** button is **not present** (Shark Mitigation card shows v3 status only).
- The Shark Mitigation doc is at **version 3** (`/docs/shark-mitigation`).
- The What's New feed contains **2 informational entries** — no critical entry.

The Emergency Shark Siren button, the v4 doc update, and the critical What's New entry are **added live by the docs-bot demo (Plan 2)**.

## Demo trigger

Append `?demoToast=1` to any route to trigger the live toast notification preview.

## Build

```bash
# full workspace
pnpm build

# type-check
pnpm lint
```

# Automated & Unified Documentation Workspace — Design Spec

**Date:** 2026-06-22
**Project:** Upwind Security Hackathon
**Status:** Approved design, pre-implementation

---

## 1. Problem

Documentation is an extension of the product: a self-service guide for customers and the single
source of truth for engineering, product, and support. But the Upwind console UI changes rapidly,
and keeping every page's text **and screenshots** accurate by hand is effectively impossible. The
result is outdated content, more support tickets, and team misalignment.

## 2. Solution (one sentence)

An **event-driven, multi-modal AI engine** that watches the frontend repository, and on each
relevant UI change automatically regenerates the affected documentation — fresh prose (in the
company's tone), fresh screenshots, the business context behind the change, a "What's New" entry,
and a live notification — then publishes it into a polished docs portal.

We demonstrate it on a self-contained **Smart Surf-Zone Management Console** mock (a stand-in for a
cloud-security console), because it lets us fully control the "ever-changing UI." The engine is
built **product-agnostic** so it could later be pointed at the real Upwind console.

### Concept mapping (surf ↔ security)

| Surf component | Maps to |
|---|---|
| Wave Height Over Time | Metrics & Telemetry |
| Currents & Drifts | Logs & Network Traffic |
| UV Index Alerts (sunscreen promo) | Runtime Security Alerts & Remediation |
| **Shark Mitigation Procedures** ⭐ | Critical Incident Protocols / Threat Mitigation (the hero case study) |

## 3. Goals & non-goals

**Goals**
- Live, on-stage demo: a real PR triggers a real documentation update.
- The full four-part vision: surf console + docs portal (iOS nav, RAG search, What's New) +
  event-driven multi-modal bot + Shark Mitigation hero feature.
- A product-agnostic engine that could later run against real Upwind.

**Non-goals (for the hackathon)**
- Full Anthropic Computer Use on the critical path (too slow live → downgraded to Playwright).
- Real-time production scheduler waiting (downgraded to instant/manual for the demo).
- Real Slack/Jira/Confluence org connectivity (fixtures for the demo, behind real interfaces).
- The surf console being anything more than a convincing prop.

## 4. Key decision: TypeScript everywhere

**One language across the whole system — frontend and bot.**

Why this is the best choice for *this* product (not just convenient):
1. **One typed contract from bot → portal.** The documentation model (`Doc`, `Screenshot`,
   `ChangeEntry`, `SearchResult`) is defined once in `packages/types` and imported by both the
   engine that produces docs and the UI that renders them. The bot cannot emit a shape the portal
   doesn't understand — the compiler enforces it. This is the biggest product-quality win.
2. **The product is ~70% web, all of which is TypeScript/React.** Adding Python would mean a second
   language/runtime/deploy target serving the minority of the system, for no capability gain.
3. **The AI half is fully first-class in the Anthropic TS SDK** — tool use, vision, streaming. We
   lose nothing on the Claude side.
4. **Playwright's strongest binding is TypeScript** — the screenshot/automation half is *better* in
   TS.
5. **Hackathon velocity** — one toolchain (pnpm + Turborepo), no context-switching.

**Why not Python + FastAPI:** Python's strengths (data science, the Computer-Use reference impl) do
not apply — our "intelligence" is Claude API calls, and we deliberately downgraded Computer Use to
Playwright. FastAPI is excellent but offers nothing over a Node service when the rest of the
codebase is already TypeScript. **Future:** if full Computer Use or a heavy self-hosted embeddings
stack is ever needed, that single piece can be split into a Python microservice behind the same
typed API.

### Model strategy (Anthropic TS SDK)
- **Diff analysis + doc writing (heavy reasoning):** Claude Opus 4.8 (`claude-opus-4-8`).
- **Screenshot vision check + RAG answer synthesis (latency-sensitive):** Claude Sonnet 4.6
  (`claude-sonnet-4-6`).
- Prompts and tool schemas live in one `claude/prompts` module for easy tuning.

## 5. Architecture

### System map

```
MONOREPO (pnpm + Turborepo)
├── apps/surf-console        ← the "product" (a prop)
│     • Surf-Zone console UI (Wave Height, Currents, UV, Shark Mitigation)
│     • Embedded docs portal (iOS nav · RAG search · What's New)
│     • content/docs/**      ← generated markdown + screenshots + manifest.json + changelog.json
│
├── services/docs-bot        ← the engine (the real product)
│     • webhook listener · path filter · scheduler
│     • context aggregator (Slack/Jira/Confluence connectors)
│     • Claude: diff analysis · doc writing · RAG answers
│     • Playwright screenshot capture + Claude vision check
│     • publisher (writes back to content/docs) + RAG indexer
│
└── packages/types           ← ONE shared documentation contract
```

### The three parts, one job each
- **`apps/surf-console`** — a thin Next.js prop holding the console and the embedded docs portal.
  Hardcoded mock data; built fast; exists to look credible and to be the thing that "changes."
  *(For the hackathon, this surface is generated externally from the Frontend Design Spec via a
  Claude design tool, then integrated — see §11.)*
- **`services/docs-bot`** — the standalone TypeScript engine. Product-agnostic by design.
- **`packages/types`** — the shared contract (see §6).

### The three seams (each part testable in isolation)
- **Webhook → bot:** an HTTP endpoint receiving a typed PR event.
- **Bot → docs:** files on disk (`content/docs`) + a typed manifest. The portal reads files; it does
  **not** call the bot to render docs. No runtime coupling for content.
- **Portal → bot (live features only):** RAG search + critical-update notifications are the *only*
  runtime calls, and both degrade gracefully.

### 5.4 Repository topology, portal location & the demo trigger loop

**One repository — this one.** The whole system lives in a single monorepo (the GitHub repo
`Hackathon-Project-Automated-Unified-Documentation-Workspace`). The frontend, the bot, the shared
types, and the generated docs all live here. There is no second repo.

**Where the docs portal sits.** The portal is *not* a separate app — it is a set of routes inside
the surf-console Next.js app, under `/docs` (`app/docs/page.tsx`, `app/docs/[slug]`,
`app/docs/whats-new`, `app/docs/api/search`). It shares the website's top nav (a **Console | Docs**
tab) and renders doc content from the committed `content/docs/` files. It calls the bot at runtime
for only two things: RAG search and the critical-update notification.

**The demo trigger loop (the full circle):**
1. A PR is opened/merged **into this repo** that edits a watched frontend component
   (`apps/surf-console/components/console/SharkMitigation.tsx`).
2. GitHub fires a webhook to the bot, which during the demo runs locally and is reachable via a
   tunnel (smee.io / ngrok).
3. The path filter sees `apps/surf-console/components/**` → relevant → the pipeline runs.
4. The publisher commits the regenerated doc back into `apps/surf-console/content/docs/**` **in this
   same repo**. That path is filtered out, so the publish commit does not re-trigger the bot (no
   loop).
5. The deployed portal reads the updated `content/docs/` and shows the new doc, feed entry, and
   notification.

So the demo is a closed loop on one repo: **merge in → bot reacts → bot writes back → portal
renders.** In production the same mechanism maps to watching the real frontend repo and publishing
to a docs location; "frontend-only" filtering simply becomes repo-based instead of path-based.

## 6. The shared documentation contract (`packages/types`)

```ts
interface Doc {
  id: string;                 // stable slug, e.g. "shark-mitigation"
  title: string;
  category: DocCategory;
  bodyMarkdown: string;
  screenshots: Screenshot[];
  sourceComponent: string;    // "apps/surf-console/components/SharkMitigation.tsx"
  version: number;
  updatedAt: string;          // ISO
  lastChange?: ChangeSummary;
}

interface Screenshot {
  path: string;
  alt: string;                // Claude-generated; also feeds the vision check
  capturedAt: string;
  targetSelector?: string;
}

interface DocCategory {
  id: string;
  name: string;
  icon: string;               // lucide icon name for the folder tile
  parentId?: string;          // null = top-level folder; else nested sub-folder
}

interface ChangeEntry {       // both a "What's New" item AND the bot's audit log
  id: string;
  docId: string;
  summary: ChangeSummary;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';  // Upwind CNAPP scale; 'critical'/'high' → live notification
  prUrl: string;
  contextRefs: ContextRef[];
  screenshotDiff?: { before?: string; after: string };
  createdAt: string;
}

interface ChangeSummary {
  headline: string;
  detail: string;
  intentSource: string;       // "Derived from JIRA SURF-142 + #surf-safety thread"
}

interface ContextRef {        // provenance — proves real org knowledge was used
  kind: 'jira' | 'slack' | 'confluence' | 'git';
  ref: string;
  url: string;
  excerpt: string;
}

interface SearchResult {
  docId: string;
  title: string;
  snippet: string;
  score: number;
  deepLink: string;           // /docs/shark-mitigation#emergency-siren
}
```

**Storage**
- **Source of truth:** markdown + images under `apps/surf-console/content/docs/`, plus
  `manifest.json` (typed `Doc[]` + `DocCategory[]`) and `changelog.json` (typed `ChangeEntry[]`).
  GitOps — everything is in the repo and diffable; publishing is a commit.
- **RAG index:** a separate, regenerable vector artifact built from the docs — never the source of
  truth, always rebuildable.

## 7. The bot engine pipeline (`services/docs-bot`)

```
webhook → filter → scheduler → context → analyze → capture → write → publish
```

1. **Webhook receiver** (Fastify) — verifies signature, normalizes to a typed
   `PullRequestEvent { prUrl, mergedSha, changedPaths[], title, body }`, enqueues. Deliberately
   minimal.
2. **Path filter** — pure function `isRelevant(changedPaths)`: true only if a path matches watched
   UI globs (`apps/surf-console/components/**`) and not only `content/docs/**` or `services/**`.
   This is the entire "frontend-only, no-loop" rule. Unit-tested.
3. **Scheduler** — `interface Scheduler { enqueue(job) }`, two impls:
   - `ThrottledScheduler` (production): debounce by `sourceComponent`, wait for UI stabilization +
     deploy health, then release.
   - `InstantScheduler` (demo): next tick + a manual **"Run now"** trigger.
   Selected by env flag. *This is the scheduler "downgrade" — same contract, instant timing.*
4. **Context aggregator** — `interface ContextSource { fetch(ref) }`, one impl per system:
   `FixtureJiraSource` / `FixtureSlackSource` / `FixtureConfluenceSource` (demo) vs real connectors
   (production). Links the PR to its intent and returns `ContextRef[]` with excerpts.
5. **Code analyzer (Claude Opus 4.8)** — sends the git diff + context, returns a forced typed schema:
   which `Doc` this maps to, the structural change, and the human intent.
6. **Visual capture (Playwright)** — `interface ScreenshotCapture { capture(target) }`. Opens the
   deployed surf console, navigates to the component's route, screenshots the panel. Then a **vision
   check** (Claude Sonnet 4.6) confirms the screenshot actually shows the claimed change. This is the
   Computer-Use downgrade; the interface leaves room for a real `ComputerUseCapture` later.
7. **Doc writer (Claude Opus 4.8)** — given the existing doc, the structural change, context
   excerpts, and the verified screenshot, rewrites the doc in Upwind's tone (style guide in prompt),
   embeds the screenshot, returns a typed `Doc` + `ChangeSummary`.
8. **Publisher** — transaction-like: writes markdown + image, updates `manifest.json` and
   `changelog.json` (new `ChangeEntry` with severity), commits, rebuilds the RAG index, emits the
   live notification if `severity === 'critical'`. The manifest is only ever updated by this final
   step, so a mid-pipeline failure never corrupts published docs.

### Error handling philosophy
Each stage produces its typed output or throws a typed error logged with the job id, halting *that
job only*. Because the manifest is updated only by the publisher's final commit, any failure leaves
the docs untouched and the demo can re-run a clean job.

## 8. RAG documentation search (first-class AI feature)

The docs portal includes a natural-language search powered by Retrieval-Augmented Generation. This
is a primary feature of the documentation experience, not an add-on: a human user asks a question in
plain language and gets a direct answer **grounded in — and linked to — the actual documentation.**

**Flow:**
1. The user types a natural-language question in the portal search bar (e.g. *"How do I trigger the
   shark siren?"*).
2. The portal calls the bot's `/search` endpoint (the one genuine portal→engine runtime call).
3. The engine retrieves the most relevant passages from the **RAG index** — a vector index built
   from the published docs (`content/docs/`), rebuilt by the publisher on every update so it never
   drifts from the live docs.
4. Claude (Sonnet 4.6, for low latency) synthesizes a concise answer **strictly from the retrieved
   passages**, returning it with `SearchResult[]` citations.
5. The portal renders an answer card plus cited source rows, each with a **deep link** into the
   exact documentation section (`/docs/shark-mitigation#emergency-siren`) — a "Jump to section →".

**Design properties:**
- **Grounded, not hallucinated:** answers are constrained to retrieved doc passages and always carry
  a citation back to the source doc. If the docs can't answer, the engine says so rather than
  inventing.
- **Always current:** because the index is rebuilt at publish time, a freshly auto-generated doc
  (e.g. the new siren procedure) is immediately answerable — this closes the loop between the bot
  and search, and is a strong demo beat (step 12).
- **Graceful degradation:** if the engine is offline, the search bar reports "engine offline" and
  the rest of the portal (folders, docs, feed) keeps working from the committed files.
- **Vector store:** kept lightweight (in-memory / sqlite-vec for the small baseline corpus);
  finalized in the execution plan.

## 9. The frontend (`apps/surf-console`) — overview

Detailed visual/structural brief lives in the companion **Frontend Design Spec**
(`2026-06-22-frontend-design-spec.md`). Summary:

**A. Surf-Zone Console (the prop):** four dashboard components (Wave Height chart, Currents &
Drifts log table, UV Index alert cards, **Shark Mitigation** panel with action buttons). Hardcoded
mock data. Built on the **Upwind design system** (CSS design tokens + Upwind Sans / DM Mono fonts)
ported from the delivered Claude Design mock; hand-built SVG charts. *(Decision: adopt the Upwind DS
wholesale rather than shadcn/ui — it's more authentic and pixel-faithful to the mock.)*

**Demo baseline (before-state):** the delivered mock depicts the *after* state (siren button
present, doc `v4`). We seed a clean **before** baseline — Shark panel with only `Raise flag` /
`Notify command`, doc `v3`, no siren entry in What's New — so the live demo PR *adds* the Emergency
Shark Siren button and regenerates to the mock's after-state.

**B. Docs Portal (the showcase), three blocks:**
1. **iOS-style hierarchical nav** — grid of rounded folder tiles; tap animates open (Framer Motion)
   to reveal sub-folders/docs; breadcrumb tracks depth. Driven by `manifest.json`.
2. **Smart RAG search** — natural-language bar; query → bot `/search` → Claude answer with
   deep-linked citations. The one genuine portal→engine runtime call.
3. **What's New feed + live notifications** — reverse-chron timeline from `changelog.json` (headline,
   before/after screenshot, provenance chips, deep links); a toast pops on `critical` entries with a
   deep link into the entry.

**Data seam:** static content read directly from committed files (no runtime bot dependency); only
RAG search + critical notifications hit the engine, and both degrade gracefully.

## 10. Demo script (Shark Mitigation live update, ~3 min)

**Setup:** console deployed on the Shark panel (old docs, no siren); portal open; bot running with a
webhook tunnel (smee.io/ngrok) in demo mode; a branch ready with the "Emergency Shark Siren" change.

**Sequence:**
1. Merge the PR adding the **Emergency Shark Siren** button. *(live)*
2. Bot console: "PR detected → frontend change → relevant." *(live)*
3. Scheduler step shows, then fast-forwards/releases. *(live engine, staged timing)*
4. "Pulling context: JIRA SURF-142, #surf-safety, Confluence" → provenance chips. *(live, fixtures)*
5. "Analyzing diff… new `triggerSiren()` button." *(live Claude)*
6. "Capturing UI…" → fresh screenshot appears. *(live Playwright)*
7. "Vision check: ✓ button present." *(live Claude vision)*
8. "Writing doc in Upwind tone… publishing." → docs commit appears. *(live Claude + commit)*
9. Switch to portal: 🔔 toast "⚠️ Shark Mitigation protocol updated" → click. *(live)*
10. What's New entry: headline, before/after screenshot, provenance chips, PR link. *(live)*
11. Open the doc: updated text + embedded screenshot. *(live)*
12. RAG search "How do I trigger the shark siren?" → Claude answers + deep link. *(live)*

**Safety nets:** pre-flight warm-up run (caches, tunnel, Playwright browser) then reset; "Run now"
manual fallback; a replay mode (pre-captured screenshot + pre-generated doc on disk) that produces
the identical visible result if live Claude/Playwright stalls; every live step logs to a visible
console so waiting moments are watchable.

**Narrative arc:** Problem → one merge with zero docs written → seconds later docs update themselves
(text + screenshot + Jira/Slack context, flagged critical) → a customer can already ask about it in
plain English → kicker: "point it at real Upwind tomorrow."

## 11. Build order (revised — frontend mock produced externally)

The frontend prop is **not** built first by the implementation team. Instead:
- **Frontend Design Spec** (companion doc) is written → the user generates the **mock frontend**
  externally in a Claude design tool → delivers it back → it's integrated into the monorepo.

Implementation phases (each ends in something demoable; nothing blocks on the mock except final
integration):

- **Phase 0 — Skeleton (shared):** monorepo, `packages/types`, env, the data contract.
- **Phase 1 — Mock integration:** drop the delivered mock into `apps/surf-console`; seed a baseline
  doc set (`manifest.json` + a few markdown docs). *(Replaces the old "build the prop" phase.)*
- **Phase 2 — Portal wiring:** iOS folder nav, doc rendering, What's New feed — all reading committed
  files.
- **Phase 3 — Engine spine:** webhook → filter → instant scheduler → Claude diff analysis → doc
  writer → publisher (file write + commit). *The core wow, end-to-end.*
- **Phase 4 — Visual capture:** Playwright screenshot + Claude vision check, embedded in the doc.
- **Phase 5 — Context + What's New wiring:** fixture connectors + provenance chips + critical-severity
  live notification.
- **Phase 6 — RAG search:** indexer + `/search` + portal search bar.
- **Phase 7 — Polish & safety nets:** pre-flight warm-up, "Run now," replay-mode fallback, rehearsal.

**Critical path to a winning demo:** Phases 0 → 1 → 2 → 3. Everything after is additive wow that
lands independently; if time runs short, cut from the back and still have a complete story.

The **execution plan** (detailed, step-by-step) is written immediately after these specs are
reviewed, via the writing-plans skill. It is structured in two tiers: **mock-independent work** (the
engine, pipeline, data contract, RAG, publishing, demo harness — buildable immediately) and
**frontend-integration work** (specified now, refined against the actual delivered mock).

## 12. Repo layout

```
surf-docs-workspace/
├── apps/surf-console/                 # Next.js — prop + portal
│   ├── app/(console)/page.tsx
│   ├── app/docs/{page,[slug],whats-new}.tsx
│   ├── app/docs/api/search/route.ts   # thin proxy → bot /search
│   ├── components/console/            # WaveHeight, Currents, UVAlerts, SharkMitigation
│   ├── components/docs/               # FolderTile, DocView, ChangeFeed, LiveToast
│   └── content/docs/                  # GENERATED markdown + images + manifest.json + changelog.json
├── services/docs-bot/                 # Node + Fastify — engine
│   └── src/{server,pipeline,connectors,claude,capture,rag,publish}/
│   └── fixtures/                      # SURF-142 ticket, #surf-safety thread, …
├── packages/types/                    # shared contract
├── turbo.json · pnpm-workspace.yaml · .env.example · README.md
```

## 13. Future features / roadmap (presented, not built)

These are part of the vision and the pitch, but explicitly **out of scope to build** for the
hackathon — presented as where the product goes next.

### 13.1 Agent-facing documentation interface ("docs for agents")
The docs portal described above is built for **human** users: a visual, iOS-style, progressively
disclosed experience optimized for people. We believe many of the tasks humans perform in consoles
like this today will increasingly be performed by **AI agents**. So the roadmap feature is a
**parallel documentation interface meant for agents** — the *same underlying documentation content*
exposed in a form optimized for machine consumption rather than human browsing.

Where a human navigates folders and reads rendered pages, an agent would **inspect and query the
docs programmatically** — more directly and efficiently than by scraping the human UI. Concretely,
this could take the form of:
- A structured, semantic, token-efficient representation of every doc (e.g. an `llms.txt` /
  `llms-full.txt`-style export, or clean structured JSON derived from the same typed `Doc` model).
- An **agent query API / MCP server** exposing the docs as machine-callable resources plus a
  semantic search tool, so an autonomous agent can ask, retrieve, and cite documentation as part of
  its own task execution.

**Why it's architecturally cheap to add later:** because all docs already flow through one typed
contract (`packages/types`) and a rebuildable RAG index, the agent interface is simply a *second
projection* of the same content — no new source of truth, just an additional machine-first surface
over what the engine already produces. It is deliberately not built now to keep the hackathon scope
focused on the human experience and the live pipeline.

### 13.2 Other future work (behind existing interfaces)
- **Full Anthropic Computer Use** as the production replacement for the downgraded Playwright
  screenshot step — the `ScreenshotCapture` interface already leaves room for a `ComputerUseCapture`.
- **Real org connectors** (live Jira / Slack / Confluence) replacing the demo fixtures, behind the
  same `ContextSource` interface.
- **Production scheduler** (real UI-stabilization + deploy-health waiting) replacing the demo's
  instant scheduler, behind the same `Scheduler` interface.

## 14. Open questions
- Vector store choice for RAG (in-memory vs sqlite-vec vs pgvector) — finalize in the execution plan
  based on corpus size; the baseline corpus is small, so in-memory / sqlite is likely sufficient.
- Hosting: Vercel for the Next.js app; the bot runs locally with a tunnel for the demo (simplest),
  or Railway / Render / Fly for a hosted bot.

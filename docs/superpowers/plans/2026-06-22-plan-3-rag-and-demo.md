# Plan 3 — RAG Search, Interactive Capture & Demo Harness

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Plan-style note (per project owner):** describes *what* to build — exact paths, interfaces, behavior, verification — but does **not** embed full implementations. Pure-logic stages are specified test-first with concrete assertions; Claude / SSE / Playwright stages are specified by interface + behavior + integration verification. Prompts are authored as **editable markdown files** (the owner refines wording without touching code).
>
> **Prerequisites:** **Plan 1 + Plan 2 are merged to `main`** (verified live). `main` is the **before-state** baseline (shark doc v3, no siren) + the full `services/docs-bot` engine + the vision-check fix from the live dry run. Build Plan 3 on a `plan-3-rag` branch off `main`.
>
> **Execution order (build the producer before the consumers): Phase A → Phase B → Phase C.** Phase A (Interactive Capture / Level 1) *completes the regeneration engine* so it emits complete, multi-state docs — the highest-risk, most central capability, de-risked first. Phase B (RAG search, live notifications, read-state) builds the intelligent surfaces **on top of** that final-shape output, so they're built and tested once against real content. Phase C (demo harness) depends on both — its replay assets are the multi-state stills + clip from A and the publish/notify path from B — so it stays last.

**Goal:** Finish the product's intelligent surfaces and harden the demo: (1) **Smart RAG search** (spec §8) — NL question over the corpus → grounded answer with deep-linked citations; (2) **live notification** (§9) — a `critical`/`high` publish pops a toast in the open portal in real time; (3) **Interactive Capture / "Level 1"** — the bot **clicks the UI** to screenshot post-interaction states, so the generated docs are *complete* (this directly fixes the gap the live dry run exposed); (4) **an interaction clip** — alongside the stills, the bot records a short looping (GIF-like) `.webm` of the captured flow and the doc embeds it; (5) **What's New read-state** — per-entry "I read it" + "Read all" + a "Show read" toggle, read entries drop out of the feed, the What's-New badge shows the unread count (localStorage, per-browser); (6) **demo harness** (§10) — warm-up, a fallback ladder, and a rehearsal runbook proven against the real GitHub-merge loop.

**Architecture:** RAG runs **on the bot** behind a swappable `Retriever` interface (`KeywordRetriever` default; optional `VectorRetriever`); Claude Sonnet 4.6 synthesizes a grounded answer over retrieved passages; `POST /search` returns a `RagAnswer`; the portal proxies it server-side and shows an explicit "offline" state on failure. Live notifications use **SSE**: `runJob` passes a `notify` closure into `publish(...)` that emits the published `ChangeEntry` on `GET /events`; the portal `NotificationProvider` subscribes via `EventSource`. **Interactive capture** extends the existing `ScreenshotCapture` interface: the diff analyzer emits an *interaction plan*, Playwright drives those clicks and captures multiple states (default + activated), the vision check verifies **each** state, and the writer/publisher carry **multiple** screenshots (`Doc.screenshots` is already a list). The demo harness adds a warm-up script and a `REPLAY_MODE` short-circuit.

**Tech Stack:** (bot) `@anthropic-ai/sdk@^0.105` + `@anthropic-ai/sdk/helpers/zod` · `zod` (schemas import from **`zod/v4`** — SDK helper requirement) · `github-slugger` · `@fastify/cors` · Fastify SSE · `playwright` · `simple-git` · (optional) `voyageai`. (portal) Next.js Route Handler proxy · `EventSource` · `rehype-slug` · `react-markdown`.

## Global Constraints

- **Language:** TypeScript only, Node ESM **NodeNext** — relative imports use `.js` extensions (repo-wide convention). Tests use **`vitest`** (live tests guard with `describe.skipIf(!process.env.ANTHROPIC_API_KEY)`). Commits authored as the repo owner, **no Claude signature / `Co-Authored-By`**.
- **RAG model:** synthesis → **`claude-sonnet-4-6`** via `client.messages.parse({ ..., output_config: { format: zodOutputFormat(Schema) } })`; read `response.parsed_output`. Never the deprecated top-level `output_format`. `max_tokens` 4000.
- **Grounded-only (spec §8):** the prompt answers **strictly** from supplied passages (says "I don't know" otherwise) and returns the **indices** of passages used; the engine builds citation `deepLink`s itself (no model-emitted URLs).
- **Retriever choice (resolves spec §14):** default `KeywordRetriever` (in-memory, deterministic, no extra key); optional `VectorRetriever` (Voyage + cosine) behind the same interface (Task 8). Don't claim semantic search on the keyword default.
- **Deep-link anchors:** section anchors via **`github-slugger`** on the bot; the doc page renders headings with **`rehype-slug`** (same algorithm) so `/docs/<id>#<anchor>` resolves. The as-built docs use `## Step N: …` headings — both sides slug them identically.
- **Contract = `@surf/types`:** `/search` returns `RagAnswer` (`{query, answer, citations: SearchResult[]}`); SSE emits a `ChangeEntry`. No new portal-facing shapes.

### As-built reconciliation (verified against the live Plan 2 engine + the dry run)

These supersede earlier assumptions wherever they differ — taken from the **actual** code on `main`:

- **zod schemas import from `zod/v4`** (not `zod`). The SDK's `zodOutputFormat` requires v4 types; `schemas.ts` already does `import { z } from 'zod/v4'`. `RagSynthesisSchema` must follow, and use `.describe()` on fields like the existing schemas.
- **Prompts are editable `.md` files loaded at runtime.** `claude/prompts.ts` loads `services/docs-bot/prompts/*.md` via `import.meta.url` and exposes `buildAnalyzerPrompt`/`buildWriterPrompt`. The RAG prompt must live in **`prompts/rag-synthesis.md`** with a `buildRagPrompt(...)` composer — **not** inline in `.ts`. (Owner edits wording in the `.md`.)
- **Publisher hooks already exist and are NOT modified.** `publish(input)` accepts optional no-arg hooks `notify?` and `onIndexRebuild?` (type `NoOpHook = () => void | Promise<void>`) and invokes them after a successful commit. So Plan 3 does **not** edit `publisher.ts` — instead **`runJob` supplies closures**: `notify: () => notifier.emit(changeEntry)` and `onIndexRebuild: () => rebuildIndex()`. The publisher stays the single content-writer; the bindings live in `runJob`/the rag module.
- **Config pattern:** `config.ts` validates with `z.preprocess((v) => v === '' ? undefined : v, …default)` per field (so empty `.env` values fall back). Add `corsOrigin` (`CORS_ORIGIN`, default `http://localhost:3000`), `retrieverMode` (`RETRIEVER_MODE`, default `keyword`), `replayMode` (`REPLAY_MODE`, default `false`) the same way; wire them in `loadConfig()`.
- **Vision check evolution.** The dry run made `visionCheck`'s prompt tolerant of interactive/conditional UI (because we only captured the *default* state). Interactive Capture (Phase A) supersedes that: we now capture each state and `visionCheck(png, claim)` is called **per state** with a state-appropriate claim — so verification is precise again (default→the new control; activated→what the interaction reveals). Keep the tolerant phrasing as a safety net; the per-state claim is what's verified.
- **Screenshots:** the publisher writes PNGs to `apps/surf-console/public/docs-screenshots/<docId>/` and sets web paths (`/docs-screenshots/…`). Interactive Capture produces **multiple** PNGs per doc — the publisher must write **all** of `doc.screenshots` (today it writes one); see Task L1.3.
- **Demo trigger reality (proven live):** a GitHub **PR merge** → `pull_request closed/merged` webhook → **smee.io** (public relay) → **smee-client** (local forwarder) → bot `POST /webhook`. The webhook resolver does best-effort `git fetch origin` then `getChangedPaths(mergedSha)` → `isRelevant` → enqueue. **Registering the webhook needs repo *admin*** — the no-admin fallback is a **local signed-webhook trigger** (the runbook includes the exact command). The **publisher commits locally and does not push** — the local portal (next dev) reflects the update; to re-demo, **revert the merge** on `main` (a normal forward commit). The portal runs on the **after-state branch** (`demo/shark-siren`) so the screenshot captures the merged UI.
- **Live-notification fires on `critical`/`high`** (spec §6); `NotificationProvider` subscribes to `${NEXT_PUBLIC_BOT_URL}/events`, degrades silently if unset/erroring; the Plan 1 `?demoToast=1` local trigger stays as a fallback. CORS (`@fastify/cors`) is required for the browser `EventSource`.
- **Secrets:** `.env` (gitignored) holds `ANTHROPIC_API_KEY` + `GITHUB_WEBHOOK_SECRET` (already set). `VectorRetriever` adds `VOYAGE_API_KEY` only when enabled. `services/docs-bot/.env.example` documents all keys.
- **Read-state needs NO contract change.** `ChangeEntry` already carries a stable `id` and `createdAt` (`packages/types/src/index.ts`), so read/unread tracking keys off `entry.id` with **zero** changes to the type, the publisher, or the engine. It is a **portal-only** feature (localStorage). The What's-New badge today is a hardcoded `3` on the gift icon in `TopBar.tsx` and the bell red-dot binds to `useNotifications().critical`; the unread count replaces that hardcoded badge.
- **Interaction clip is additive.** Add an **optional** `video?: { path: string; alt: string; capturedAt: string }` to `Doc` in `@surf/types` (mirrors `Screenshot`). The publisher writes the `.webm` to `apps/surf-console/public/docs-videos/<docId>/` (new sibling of `docs-screenshots/`) and sets the web path `/docs-videos/…`; absent video = field omitted, everything still works. Playwright records it from the **same** `captureStates` session (`recordVideo` on the context) — no new automation path and no extra dependency.

---

## File Structure (decomposition — locked here)

```
services/docs-bot/
├── src/
│   ├── config.ts                 # MODIFY: add corsOrigin, retrieverMode, replayMode (preprocess pattern)
│   ├── server.ts                 # MODIFY: register @fastify/cors; add POST /search, GET /events; (opt) GET /agent/corpus, /llms.txt
│   ├── index.ts                  # MODIFY: build retriever at boot; pass notify + onIndexRebuild closures into the runJob deps
│   ├── rag/
│   │   ├── retriever.ts          # Retriever interface; DocSection/RetrievedPassage; buildSections()
│   │   ├── keywordRetriever.ts   # KeywordRetriever (default)
│   │   ├── vectorRetriever.ts    # (OPTIONAL Task 8) VectorRetriever (Voyage + cosine)
│   │   ├── corpus.ts             # loadCorpus(docsContentDir): Promise<Doc[]>
│   │   ├── makeRetriever.ts      # makeRetriever(config): Retriever
│   │   ├── index-state.ts        # module-state retriever: getRetriever() + rebuildIndex()
│   │   └── answer.ts             # answerQuery(query, retriever): Promise<RagAnswer> (Sonnet 4.6)
│   ├── claude/
│   │   ├── schemas.ts            # MODIFY (zod/v4): add RagSynthesisSchema; extend DiffAnalysisSchema with `interactions`
│   │   └── prompts.ts            # MODIFY: add buildRagPrompt (loads prompts/rag-synthesis.md)
│   ├── capture/
│   │   └── capture.ts            # MODIFY: captureStates(...) multi-state + (stretch) record a looping .webm clip
│   ├── events/
│   │   └── notifier.ts           # in-memory Notifier: subscribe(cb)/emit(entry)
│   ├── publish/
│   │   └── publisher.ts          # MODIFY: write all per-state PNGs (L1.3) + (stretch) the .webm to public/docs-videos/
│   └── pipeline/
│       └── runJob.ts             # MODIFY: drive interactions, per-state vision, multi-screenshot Doc, attach clip, REPLAY branch, wire hooks
├── prompts/
│   ├── rag-synthesis.md          # NEW editable: grounded RAG synthesis instructions
│   ├── diff-analyzer.md          # MODIFY: emit an interaction plan for state-revealing controls
│   └── doc-writer.md             # MODIFY: document the interaction flow + reference multiple screenshots
├── scripts/
│   └── warmup.ts                 # NEW: warm Claude + chromium + index, ping /health
├── fixtures/
│   ├── rag-corpus/               # fixture Docs (incl. after-state shark doc) for deterministic RAG tests
│   └── replay/                   # shark-mitigation.v4.md, shark-default.png, shark-active.png, change-entry.json
└── tests/                        # retriever.test.ts, corpus.test.ts, *.live.test.ts (skipIf no key)

apps/surf-console/
├── app/docs/api/search/route.ts  # NEW POST proxy → ${BOT_URL}/search (502 → portal "offline")
├── lib/
│   └── readState.ts              # NEW: localStorage read-set helpers (getRead/markRead/markAllRead/clearRead) + useReadState hook
├── components/docs/
│   ├── SearchBar.tsx             # MODIFY: interactive (query + status state)
│   ├── SearchResults.tsx         # NEW: answer card + cited deep-link rows + offline state
│   ├── DocView.tsx               # MODIFY: rehype-slug anchors; render MULTIPLE screenshots + the looping <video> (Level 1 + clip)
│   ├── WhatsNewFeed.tsx          # MODIFY → client: filter read entries, "Read all" + "Show read" toggle, pass markRead down
│   └── ChangeEntryCard.tsx       # MODIFY: before/after = default vs activated screenshot (Level 1); add "I read it" button
├── components/shell/
│   ├── NotificationProvider.tsx  # MODIFY: subscribe to ${NEXT_PUBLIC_BOT_URL}/events; expose unread count from read-state
│   └── TopBar.tsx                # MODIFY: bind the What's-New gift badge to the unread count (replaces hardcoded "3")
├── .env.example (root)           # MODIFY: add BOT_URL (server) ; NEXT_PUBLIC_BOT_URL present
└── (OPTIONAL) app/docs/agent/page.tsx + DocsHeader "Agent View" teaser
```

---

## Phase A — Interactive Capture ("Level 1") — fixes the dry-run gap

> The live dry run proved a real gap: a screenshot of the *default* state can't show UI that only appears after a click (the siren's evacuation banner + "Siren active" pill), so the doc is incomplete and the vision check over-halts. Level 1 lets the bot **drive the UI** to capture each state. It extends the existing `ScreenshotCapture` interface (the spec's planned seam); full Anthropic **Computer Use** remains the documented roadmap upgrade behind the same interface.

### Task L1.1: Analyzer emits an interaction plan
**Files:** Modify `src/claude/schemas.ts` (extend `DiffAnalysisSchema`), `prompts/diff-analyzer.md`.
**Produces:**
- `DiffAnalysisSchema` gains `interactions: z.array(z.object({ label: z.string().describe('the visible/accessible name of the control to activate, e.g. "Emergency Shark Siren"'), reveals: z.string().describe('what new UI becomes visible after activating it') })).describe('controls that reveal new UI when activated; empty if the change is fully static')` — **default `[]`** for non-interactive changes. (Also fix the stale `targetRoute` `.describe()` to match the prompt: "the route where the live component renders; `/` for dashboard cards, `/docs/<id>` for doc pages.")
- `prompts/diff-analyzer.md`: instruct Claude that when the diff adds an interactive control that conditionally renders new UI (state-driven banners, active pills, modals), it should list each as an `interactions` entry (the control's visible label + what it reveals); otherwise return `interactions: []`. Keep `structuralChange` focused on the statically-visible additions.
- [ ] **Step 1:** Extend the schema + the analyzer prompt.
- [ ] **Step 2: Live verify** (extend `analyzeDiff.live.test.ts`): the siren diff → `interactions` includes `{ label:/Emergency Shark Siren/i, reveals:/banner|siren active/i }`; a static-only diff fixture → `interactions: []`.
- [ ] **Step 3:** Build. **Step 4:** Commit `feat(bot): analyzer emits an interaction plan for state-revealing controls`.

### Task L1.2: Multi-state Playwright capture
**Files:** Modify `src/capture/capture.ts`.
**Produces:**
- `interface CapturedState { state: string; pngBuffer: Buffer; alt: string }` (`state` = `"default"` or a short label like `"siren-active"`).
- Extend `ScreenshotCapture` with `captureStates(target: { route: string; selector?: string; interactions: { label: string; reveals?: string }[] }): Promise<CapturedState[]>`. Keep the existing single-shot `capture()` (delegates to `captureStates` with `interactions: []` returning the one default state).
- `PlaywrightCapture.captureStates`: navigate (`domcontentloaded`), wait for the panel selector, screenshot **default**; then for each interaction, click the control by **accessible name** (`page.getByRole('button', { name: label })` → fall back to `getByText(label)`), wait briefly for the reveal, screenshot the (re-scoped) panel, label that state. Returns `[default, …activated]`. Browser cleanup in `finally`.
- [ ] **Step 1:** Implement `captureStates`; keep `capture()` working.
- [ ] **Step 2: Integration verify** (portal on the **after-state** `demo/shark-siren`): `captureStates({ route:"/", selector:'[data-doc-target="shark-mitigation"]', interactions:[{label:"Emergency Shark Siren"}] })` → 2 states; the second PNG differs from the first (clicking revealed the banner). Both valid PNGs (>5KB).
- [ ] **Step 3:** Build. **Step 4:** Commit `feat(bot): multi-state Playwright capture (captureStates)`.

### Task L1.3: Orchestrate interactions — per-state vision + multi-screenshot publish
**Files:** Modify `src/pipeline/runJob.ts`, `src/publish/publisher.ts` (write all screenshots).
**Produces:**
- `runJob` replaces the single `capture` stage with `captureStates({ route, selector, interactions: diffAnalysis.interactions })`. Then **vision-check each state**: default → claim = the statically-added control(s) (from `structuralChange`); each activated state → claim = the matching `interactions[i].reveals`. **Halt only if the *default* state fails** (the core change isn't visible); if an *activated* state fails, log a warning and drop that screenshot (degrade gracefully — never block on click-only state). Assemble `doc.screenshots` = one `Screenshot` per **passing** state, each with `path` = `/docs-screenshots/<docId>/screenshot-v<n>-<state>.png`, `alt`, `capturedAt`, `targetSelector`. `ChangeEntry.screenshotDiff` = `{ before: <prior doc's screenshot if any>, after: <the most informative new state — the activated one if present, else default> }`.
- **Publisher (as-built fix):** today it writes one PNG (`derivePngInfo` uses `doc.screenshots[0]`). Extend `publish` to accept the **per-state PNG buffers** (e.g. `pngByState: Record<string,Buffer>` or `screenshots: {screenshot, pngBuffer}[]`) and write **each** `doc.screenshots[i]` PNG to its web path. Keep the manifest contract intact (`bodyMarkdown:""`, categories/`docCount` preserved, changelog prepend) and `[skip-bot]`.
- [ ] **Step 1:** runJob multi-state capture + per-state vision + multi-screenshot assembly; publisher multi-PNG write.
- [ ] **Step 2: Live e2e verify** (temp dirs + no-op commit + portal after-state): a run yields `doc.screenshots.length === 2` (default + activated) with both PNGs written and web paths in the manifest; the v4 body documents pressing the siren *and* the resulting evacuation state; `changeEntry.screenshotDiff.after` is the activated state.
- [ ] **Step 3:** Build + bot tests. **Step 4:** Commit `feat(bot): interactive capture — per-state vision + multi-screenshot publish`.

### Task L1.4: Writer documents the flow + portal renders multiple screenshots
**Files:** Modify `prompts/doc-writer.md`, `src/claude/writeDoc.ts` (pass the captured states), `apps/surf-console/components/docs/DocView.tsx`, `apps/surf-console/components/docs/ChangeEntryCard.tsx`.
**Produces:**
- `writeDoc` input gains the captured **state labels + alts** (default + activated); `prompts/doc-writer.md` instructs the writer to document the *interaction flow* ("press the red Emergency Shark Siren button → the evacuation banner broadcasts and the zone flips to *Siren active*") and to reference both states in prose — still **no inline markdown images** (DocView renders `Doc.screenshots[]`).
- `DocView.tsx`: render **all** `doc.screenshots` (a small gallery / stacked frames with captions from `alt`), not just `[0]`.
- `ChangeEntryCard.tsx`: when `screenshotDiff` has both `before` and `after`, show the pair as **default → activated** (the after = the activated state).
- [ ] **Step 1:** Writer prompt + input; DocView multi-screenshot; ChangeEntryCard pair.
- [ ] **Step 2: Verify** — `pnpm --filter surf-console build`; the v4 doc page shows both screenshots with captions; the What's New card shows the default→activated pair. (Live writer re-run optional, key-gated.)
- [ ] **Step 3:** Commit `feat: document interaction flow + render multi-state screenshots`.

### Task L1.5 (STRETCH): Looping interaction clip (GIF-like `.webm`) — degrades to stills
> Records the **same** `captureStates` session as a short silent looping clip and embeds it in the doc. **Stretch + non-blocking:** if recording fails or is absent, the doc still publishes with the stills — the clip is never a gate, never vision-checked (the per-state PNGs remain the verification source of truth). Do this only after Tasks L1.1–L1.4 are green.
**Files:** Modify `packages/types/src/index.ts` (add `Doc.video?`), `src/capture/capture.ts`, `src/pipeline/runJob.ts`, `src/publish/publisher.ts`, `apps/surf-console/components/docs/DocView.tsx`.
**Produces:**
- `@surf/types`: add optional `video?: { path: string; alt: string; capturedAt: string }` to `Doc` (parallel to `Screenshot`; omitted when no clip).
- `capture.ts`: when `captureStates` is given a non-empty `interactions` list, create the Playwright **context with `recordVideo: { dir, size }`** (viewport-sized), run the same navigate→screenshot-default→click→screenshot-activated flow (so the recording naturally shows the cursor clicking the control and the reveal), then **`await context.close()`** (Playwright finalizes the `.webm` only on context close) and read the produced file into a Buffer. Return it alongside the states, e.g. `captureStates(...) : Promise<{ states: CapturedState[]; videoWebm?: Buffer }>` — wrap recording in try/catch so a recording failure yields `videoWebm: undefined` without losing the stills. The existing `capture()` path (no interactions) records nothing.
- `runJob.ts`: if `videoWebm` is present, set `doc.video = { path: \`/docs-videos/${docId}/interaction-v${n}.webm\`, alt: <flow description>, capturedAt }` and hand the buffer to the publisher; if absent, omit `doc.video` and proceed.
- `publisher.ts`: when `doc.video` + its buffer are provided, write the `.webm` to `apps/surf-console/public/docs-videos/<docId>/<file>.webm`, include it in the commit, and keep the manifest entry's `video` field; absent → write nothing extra (manifest `video` omitted). Manifest/changelog contract otherwise unchanged (`bodyMarkdown:""`, categories/`docCount` preserved, `[skip-bot]`).
- `DocView.tsx`: when `doc.video` is set, render a `<video src={doc.video.path} autoPlay loop muted playsInline controls aria-label={doc.video.alt} />` (loops continuously like a GIF, silent; `controls` lets a viewer pause/scrub). Place it near the screenshot gallery.
- [ ] **Step 1:** `Doc.video?` type; `captureStates` records + returns the webm buffer (try/catch → undefined on failure).
- [ ] **Step 2: Integration verify** (portal on the **after-state** `demo/shark-siren`): a multi-interaction `captureStates` returns a `videoWebm` buffer (>10KB) **and** the two stills; force a recording failure (e.g. bad dir) → `videoWebm` undefined, stills still returned.
- [ ] **Step 3:** Wire runJob + publisher write; `pnpm --filter surf-console build`; the v4 doc page plays the looping clip above/below the stills; with the clip absent the page still renders the stills.
- [ ] **Step 4:** Commit `feat: record + embed a looping interaction clip (degrades to stills)`.

---

## Phase B — RAG Search + Live Notifications

### Task 1: Retriever interface + KeywordRetriever (pure, test-first)
**Files:** Create `src/rag/retriever.ts`, `src/rag/keywordRetriever.ts`, `tests/retriever.test.ts`; add dep `github-slugger`.
**Produces:**
- `interface DocSection { docId; docTitle; heading; anchor; text }`; `interface RetrievedPassage extends DocSection { score: number }`; `interface Retriever { build(docs: Doc[]): Promise<void>; retrieve(query: string, k?: number): Promise<RetrievedPassage[]> }`.
- `buildSections(docs)` — split `bodyMarkdown` at ATX headings; `anchor = new GithubSlugger().slug(heading)` (slugger **reset per doc** to match per-page `rehype-slug`).
- `class KeywordRetriever implements Retriever` — `retrieve(query, k=4)` lowercase-tokenizes (drop stopwords + sub-3-char), scores by query-term overlap (heading ×3), returns top-k with `score>0`.
- [ ] **Step 1: Failing tests** (`vitest`, `.js` imports) over two inline fixture `Doc`s (an after-state shark doc with `## Step …: Trigger the Emergency Shark Siren` containing "Emergency Shark Siren", and a telemetry doc): `buildSections` yields the siren section with a slug anchor; `retrieve("how do I trigger the shark siren")[0].docId === "shark-mitigation"` `score>0`; `retrieve("monthly billing invoices")` → `[]`; colliding headings get unique anchors (`-1`).
- [ ] **Step 2:** Run — must fail. `pnpm --filter @surf/docs-bot test`.
- [ ] **Step 3:** Implement (pure, no I/O; `github-slugger`; small heading splitter).
- [ ] **Step 4:** Run — must pass.
- [ ] **Step 5:** Commit `feat(bot): Retriever interface + KeywordRetriever`.

### Task 2: Corpus loader
**Files:** Create `src/rag/corpus.ts`, `tests/corpus.test.ts`.
**Produces:** `loadCorpus(docsContentDir): Promise<Doc[]>` — reads `manifest.json`, injects `bodyMarkdown` from `<docId>/index.md` (bot-side mirror of `lib/content.ts`, reading the files the publisher writes; manifest carries `bodyMarkdown:""`).
- [ ] **Step 1:** Failing test over a temp dir (one `shark-mitigation` doc) → `loadCorpus` returns the `Doc` with injected body.
- [ ] **Step 2–4:** RED → implement (`fs/promises`, `import.meta.url`-robust paths) → GREEN.
- [ ] **Step 5:** Commit `feat(bot): corpus loader for content/docs`.

### Task 3: RAG answer synthesis (Sonnet 4.6, grounded, editable prompt)
**Files:** Create `src/rag/answer.ts`, `prompts/rag-synthesis.md`; modify `src/claude/schemas.ts` (add `RagSynthesisSchema`, **zod/v4**), `src/claude/prompts.ts` (add `buildRagPrompt`).
**Produces:**
- `RagSynthesisSchema` (zod/v4, with `.describe()`): `{ answer: string; citedPassageIndices: number[] }`.
- `prompts/rag-synthesis.md` — the editable grounded-synthesis instructions (answer strictly from passages; cite by index; say "I don't know" if absent). `buildRagPrompt({ query, passages })` loads it (via the existing loader) + injects the enumerated passages.
- `answerQuery(query, retriever): Promise<RagAnswer>` — `retrieve(query,4)`; **if empty → `{query, answer:"I couldn't find anything about that in the current documentation.", citations:[]}` (no Claude call)**; else `client.messages.parse({ model:"claude-sonnet-4-6", max_tokens:4000, output_config:{ format: zodOutputFormat(RagSynthesisSchema) }, messages:[…buildRagPrompt…] })` → assemble `RagAnswer` with `citations = parsed_output.citedPassageIndices.map(i => passages[i]).filter(Boolean).map(p => ({ docId:p.docId, title:p.docTitle, snippet:<p.text truncated ~240>, score:p.score, deepLink:`/docs/${p.docId}#${p.anchor}` }))`.
- [ ] **Step 1:** Add schema + `rag-synthesis.md` + `buildRagPrompt` + `answer.ts`.
- [ ] **Step 2: Live verify** (`tests/answer.live.test.ts`, skipIf no key) over `fixtures/rag-corpus/` (incl. after-state shark doc): `answerQuery("How do I trigger the shark siren?")` → answer mentions "Emergency Shark Siren"; `citations[0].docId==="shark-mitigation"`, `deepLink` starts `/docs/shark-mitigation#`. Off-topic billing query → `citations.length===0`.
- [ ] **Step 3:** Build. **Step 4:** Commit `feat(bot): RAG answer synthesis (Sonnet 4.6, grounded + cited)`.

### Task 4: `/search` endpoint + index lifecycle
**Files:** Create `src/rag/makeRetriever.ts`, `src/rag/index-state.ts`; modify `src/server.ts` (`@fastify/cors` + `POST /search`), `src/index.ts` (build at boot + pass `onIndexRebuild` closure to runJob), `src/config.ts` (add `corsOrigin`, `retrieverMode`); add dep `@fastify/cors`.
**Produces:**
- `makeRetriever(config)` → `KeywordRetriever` (default) or `VectorRetriever` (Task 8).
- `index-state.ts`: module-held retriever; `getRetriever()`; `rebuildIndex()` (`await retriever.build(await loadCorpus(config.docsContentDir))`). Built once at boot in `index.ts`.
- `POST /search { query }` → `200 RagAnswer` (`answerQuery(query, getRetriever())`); empty/missing → `400`. `@fastify/cors` for `config.corsOrigin`.
- **Rebuild-on-publish (as-built):** `index.ts` injects `onIndexRebuild: () => rebuildIndex()` into the runJob deps; `runJob` passes it to `publish(...)`; the publisher invokes it after commit. **Do not modify `publisher.ts`.**
- [ ] **Step 1:** config additions (preprocess); `makeRetriever`; `index-state`; CORS + `POST /search`; boot build.
- [ ] **Step 2:** Wire `onIndexRebuild` closure through `index.ts` → runJob deps → `publish`.
- [ ] **Step 3:** Build. **Step 4: Live verify** — bot up against the after-state corpus; `curl -XPOST localhost:4000/search -d '{"query":"How do I trigger the shark siren?"}'` → answer mentions siren, `citations[0].deepLink` starts `/docs/shark-mitigation#`; `{"query":""}` → 400.
- [ ] **Step 5:** Commit `feat(bot): /search + retriever boot/rebuild + CORS`.

### Task 5: Live notifications — SSE + portal subscription
**Files:** Create `src/events/notifier.ts`; modify `src/server.ts` (`GET /events`), `src/pipeline/runJob.ts` (pass `notify` closure), `apps/surf-console/components/shell/NotificationProvider.tsx`.
**Produces:**
- `interface Notifier { subscribe(cb:(e:ChangeEntry)=>void):()=>void; emit(e:ChangeEntry):void }` (module-level emitter).
- `GET /events` — SSE: `Content-Type: text/event-stream`, `subscribe`, write `data: ${JSON.stringify(entry)}\n\n` per emit, heartbeat comment, unsubscribe + clear on `close`.
- **Wiring (as-built):** `runJob` passes `notify: () => notifier.emit(changeEntry)` into `publish(...)`; the publisher invokes it after commit + rebuild. **Publisher unchanged.**
- Portal `NotificationProvider`: on mount, if `NEXT_PUBLIC_BOT_URL` set, open `new EventSource(\`${NEXT_PUBLIC_BOT_URL}/events\`)`; `onmessage` → parse `ChangeEntry` → if `critical|high`, `show(entry)`; `onerror` silent; close on unmount. Keep `?demoToast=1` fallback.
- [ ] **Step 1:** `notifier.ts`; `GET /events`; runJob passes the `notify` closure.
- [ ] **Step 2:** `NotificationProvider` EventSource (guarded, graceful).
- [ ] **Step 3:** Build both. **Step 4: Verify** — bot + portal (`NEXT_PUBLIC_BOT_URL=http://localhost:4000`), `/docs` open; `curl localhost:4000/events` streams with heartbeats; trigger a critical publish (run-now or REPLAY) → toast pops live + bell red dot, no reload.
- [ ] **Step 5:** Commit `feat: live SSE notifications (bot /events + portal EventSource)`.

### Task 6: Portal RAG wiring — proxy + interactive SearchBar + anchors
**Files:** Create `app/docs/api/search/route.ts`, `components/docs/SearchResults.tsx`; modify `components/docs/SearchBar.tsx`, `components/docs/DocView.tsx` (add `rehype-slug`), root `.env.example` (add `BOT_URL`); add dep `rehype-slug`.
**Produces:**
- `POST /docs/api/search` (server route) → forwards `{query}` to `${process.env.BOT_URL}/search` (default `http://localhost:4000`); on failure → **`502`** (portal renders "Search engine offline").
- `<SearchBar/>` (`"use client"`): controlled input; `status: 'idle'|'loading'|'answered'|'offline'`; renders `<SearchResults/>` when answered; clearing → idle.
- `<SearchResults answer status/>`: frosted answer card ("✨ Answered by AI") + citation rows (`title` + `snippet` + "Jump to section →" `next/link` to `deepLink`); offline notice when `status==='offline'`.
- `<DocView/>`: `rehypePlugins={[rehypeSlug]}` so `/docs/<id>#<anchor>` scrolls to the heading.
- [ ] **Steps:** rehype-slug + `BOT_URL`; proxy route; interactive SearchBar + SearchResults; build; **live verify** ("How do I trigger the shark siren?" → answer card + citation → click jumps to the section; off-topic → graceful "couldn't find"; bot stopped → "offline"); commit `feat(docs): RAG search — proxy + interactive search + cited deep links`.

### Task 6B: What's New read-state — "I read it" / "Read all" / "Show read" + unread badge
> Portal-only, localStorage, per-browser. **No backend, no contract change** — keys off the existing `ChangeEntry.id`. This is NOT a demo "reset" button; resetting read-state for a re-run is an operator step in the runbook (Task 10), never a control on the live site.
**Files:** Create `apps/surf-console/lib/readState.ts`; modify `components/docs/WhatsNewFeed.tsx`, `components/docs/ChangeEntryCard.tsx`, `components/shell/NotificationProvider.tsx`, `components/shell/TopBar.tsx`.
**Produces:**
- `lib/readState.ts` (`"use client"`-safe, SSR-guarded with `typeof window`): `STORAGE_KEY = "surf.docs.readEntries"`; `getRead(): Set<string>`; `markRead(id)`; `markAllRead(ids: string[])`; `clearRead()` (each persists the id set as a JSON array and dispatches a `storage`-like event so subscribers re-render); `useReadState()` hook → `{ readIds: Set<string>, markRead, markAllRead, isRead(id), unreadCount(allIds) }` backed by `useState` + a `useSyncExternalStore`/event listener so multiple components (feed + badge) stay in sync within the tab.
- `WhatsNewFeed.tsx` → **client component** (`"use client"`): given `entries`, compute `unread = entries.filter(e => !isRead(e.id))` and `read = entries.filter(e => isRead(e.id))`. Render `unread` as the primary feed. Header row gets a **"Read all"** button (calls `markAllRead(entries.map(e=>e.id))`) shown only when `unread.length>0`, and a **"Show read"** toggle (`useState(false)`); when toggled on, render the `read` list below under a muted "Earlier" subheading. When `unread.length===0 && !showRead`, show an empty "You're all caught up" state. Pass `onMarkRead={markRead}` to each card.
- `ChangeEntryCard.tsx`: add an **"I read it"** affordance (a small text/icon button in the card footer) that calls `onMarkRead(entry.id)`; when the card is rendered in the "read" section, render it dimmed and swap the button for a muted "Read ✓" label. (Keep the L1 default→activated screenshot pair behavior from Task L1.4.)
- Badge wiring: `NotificationProvider` (or a small `useReadState` call in `TopBar`) computes `unreadCount` over the changelog entry ids; `TopBar.tsx` binds the **gift / What's-New** badge to that count (replacing the hardcoded `3`) and hides the badge when the count is `0`. Bell red-dot keeps its existing `critical` binding.
- **Live-toast interplay:** a freshly published entry arrives via SSE (Task 5) and is **unread by default** (its `id` isn't in the read-set) → it shows in the feed and bumps the badge, so the demo's new critical entry is visibly "new" until clicked.
- [ ] **Step 1:** `lib/readState.ts` + `useReadState`.
- [ ] **Step 2:** WhatsNewFeed client (filter + "Read all" + "Show read") + ChangeEntryCard "I read it" button + dimmed read state.
- [ ] **Step 3:** Badge binding in TopBar + NotificationProvider unread count.
- [ ] **Step 4: Verify** — `pnpm --filter surf-console build`; on `/docs/whats-new`: entries start unread with the badge showing the count; "I read it" removes one and decrements the badge; "Read all" empties the feed and zeroes the badge; "Show read" reveals the dimmed read entries; a hard refresh preserves read-state (localStorage); clearing storage restores all as unread.
- [ ] **Step 5:** Commit `feat(docs): What's New read-state — I read it / Read all / Show read + unread badge`.

---

## Phase C — Demo Harness

### Task 7: Warm-up script + `REPLAY_MODE` short-circuit
**Files:** Create `src/scripts/warmup.ts`, `fixtures/replay/*`; modify `src/config.ts` (`replayMode`), `src/pipeline/runJob.ts` (REPLAY branch), `package.json` (`warmup` script).
**Produces:**
- `config.replayMode` (env `REPLAY_MODE`, default `false`).
- **`runJob` REPLAY branch** (top of `runJob`): when `replayMode`, skip diff/context/analyze/capture/vision/write and publish the canned assets — `fixtures/replay/shark-mitigation.v4.md` + **both** `shark-default.png` and `shark-active.png` (multi-state, matching Level 1) + `shark-interaction.webm` (the looping clip, if captured) + `change-entry.json` (critical). Still a **real** publish → commit → `onIndexRebuild` → `notify`, so the portal shows v4 + both screenshots + the clip + critical entry + live toast, identical to a live run; logs each stage with `(replay)`.
- `warmup.ts` (`pnpm --filter @surf/docs-bot warmup`): tiny `messages.create` ping to `claude-opus-4-8` + `claude-sonnet-4-6`; launch+close chromium; one `rebuildIndex()`; `GET /health`. Prints ✓/✗; **does not mutate `content/docs`**.
- **Capture canned assets from a real Level-1 run** (the genuine v4 md + the default & activated PNGs + the emitted critical entry).
- [ ] **Steps:** config + REPLAY branch + warmup script; capture canned assets from a real run; verify replay (no key needed) updates v4 + pops the toast with no Claude/Playwright; verify `warmup` prints ✓; commit `feat(bot): demo safety net — warm-up + REPLAY_MODE`.

### Task 8 (OPTIONAL — quality upgrade): `VectorRetriever`
> Only if time remains after Phases A–C + a clean rehearsal. Swappable via `RETRIEVER_MODE=vector`, no change to `answerQuery`/`/search`.
**Files:** Create `src/rag/vectorRetriever.ts`; add dep `voyageai`; `.env.example` (+`VOYAGE_API_KEY`).
**Produces:** `class VectorRetriever implements Retriever` — `build` embeds each section (Voyage) into in-memory vectors; `retrieve` embeds the query, returns top-k by cosine (with a floor so off-topic → `[]`). Wire into `makeRetriever`.
- [ ] **Steps:** implement + wire; live verify (`RETRIEVER_MODE=vector`) that a paraphrase ("how do I sound the evacuation alarm?") still cites `shark-mitigation` (semantic recall) and billing → `[]`; build; commit.

### Task 9 (OPTIONAL — roadmap teaser): Agent-facing docs surface
> Only if time remains. Realizes spec §13.1 as a thin teaser.
**Files:** Modify `src/server.ts` (`GET /agent/corpus` + `GET /llms.txt`); create `app/docs/agent/page.tsx`; modify `DocsHeader.tsx` (disabled "Agent View" pill).
**Produces:** `GET /agent/corpus` → flat JSON projection (`[{id,title,category,version,updatedAt,sections:[{heading,anchor,text}]}]`, reusing `buildSections`); `GET /llms.txt` → plaintext index. Portal `/docs/agent` explainer + a disabled "Agent View" pill ("Coming soon: a machine-readable docs surface for AI agents").
- [ ] **Steps:** endpoints; teaser page + pill; build; `curl` both endpoints; commit.

### Task 10: Rehearsal runbook + full verification + push
**Files:** Create `docs/superpowers/demo-runbook.md`; final workspace verification.
- [ ] **Step 1:** Write `demo-runbook.md` reflecting the **proven** setup:
  - **Env matrix:** bot (`ANTHROPIC_API_KEY`, `GITHUB_WEBHOOK_SECRET`, `SCHEDULER_MODE=instant`, `SURF_CONSOLE_URL`, `DOCS_CONTENT_DIR`, `SCREENSHOTS_PUBLIC_DIR`, `CORS_ORIGIN`, `RETRIEVER_MODE=keyword`, `REPLAY_MODE=false`) + portal (`BOT_URL`, `NEXT_PUBLIC_BOT_URL`).
  - **Servers (3):** portal (`pnpm --filter surf-console dev` on the **`demo/shark-siren`** after-state branch so the screenshot captures the siren), bot (`cd services/docs-bot && pnpm dev`), and the **smee forwarder** (`npx smee-client --url <channel> --target http://localhost:4000/webhook`).
  - **Webhook setup:** register the smee channel + `GITHUB_WEBHOOK_SECRET` as a repo webhook (**Pull requests** event) — **needs repo admin**. **No-admin fallback:** after merging the PR, fire the local signed-webhook trigger (include the exact `jq`+`openssl`+`curl` one-liner that signs a `closed/merged` payload for `git rev-parse origin/main` and POSTs to `localhost:4000/webhook`).
  - **Pre-flight:** ensure `main` is before-state (shark v3, no siren); `warmup` ✓; `/health` ✓; `/docs` open with the SSE connected; `demo/shark-siren` unmerged.
  - **Narration (the real 8-stage `runJob` log):** PR detected → context → analyze → capture (now **multi-state**: default + click→activated, **+ the looping clip**) → vision ✓ (per state) → write → publish → Done → portal shows **v4 doc with both screenshots + the GIF-like clip** + the **🔴 critical** What's New entry (**unread**, bumping the badge) + the **live toast** → click **"I read it"** → entry leaves the feed, badge decrements → **RAG search** "How do I trigger the shark siren?" → cited answer → jump to section.
  - **Fallback ladder:** (1) live webhook merge; (2) local signed-webhook trigger (no admin); (3) `REPLAY_MODE=true` + `/run-now`. All yield the same visible result.
  - **Reset to re-demo (the proven procedure — operator only, nothing on the live site):**
    1. **Restore `main` to before-state.** The PR merge lands on the GitHub remote (a merge commit on `origin/main`). Undo it with `git revert -m 1 <merge-sha>` and push — this is the proven move (history: merge `239f90a` → revert `abd627a`). (Hard-reset-and-force-push is the cleaner alternative but revert is what's verified and preserves history.)
    2. **Drop the bot's local publish commit.** The publisher **commits locally and does not push** — that local `[skip-bot]` commit holds the v4 doc + manifest + changelog + the per-state PNGs + the `.webm`. Reset it out (`git reset --hard origin/main` once `origin/main` is back to before-state) so the shark doc returns to v3 on disk.
    3. **Re-create the trigger branch.** Restore `demo/shark-siren` (the card-only siren change, `bc4df68`) pointing at the restored before-state `main`, so the PR can be opened and merged again. The portal runs on this after-state branch.
    4. **Clear the portal read-state.** Wipe the localStorage read-set (`surf.docs.readEntries`) — via `clearRead()` in devtools or by clearing site storage — so the freshly published critical entry shows as **new/unread** again and the What's-New badge re-appears for the next run. (This is the read-state reset folded into the operator flow per the owner's decision; never a button on the demo site.)
    5. **Restart servers + smee** (portal, bot, smee forwarder) and re-run pre-flight.
- [ ] **Step 2:** `pnpm build` + `pnpm lint` green across the workspace.
- [ ] **Step 3:** Full rehearsal on the **live** rung once, then the **replay** rung — both end with v4 (+ both screenshots) + critical entry + live toast + a working cited RAG answer.
- [ ] **Step 4:** Commit + push (`git push origin plan-3-rag`; merge to `main` after review).

---

## Self-Review

**Spec coverage:** RAG (§8) → Tasks 1–4, 6 (+ optional vector Task 8); §14 vector-store question → resolved (keyword default, vector optional); grounded/always-current/graceful-degradation → grounded prompt + `onIndexRebuild` rebuild + "offline" state; live notification on `critical/high` (§6,§9) → Task 5; **What's New read-state** (I read it / Read all / Show read + unread badge) → Task 6B (portal-only, localStorage, keys off existing `ChangeEntry.id`); demo on a real PR with downgrades + safety (§10) → Tasks 7 & 10 (proven live). **Interactive Capture (Phase A)** fixes the dry-run gap and is the headline upgrade — extends the `ScreenshotCapture` seam; **the looping `.webm` clip** (Task L1.5, stretch) embeds the captured flow and degrades to stills; Computer Use stays the roadmap. Agent surface (§13.1) → optional Task 9.

**As-built reconciliation:** zod/v4 imports; editable `.md` prompts (incl. new `rag-synthesis.md`); publisher hooks (`notify`/`onIndexRebuild`) supplied as **closures from `runJob`** (publisher unchanged); config `preprocess` pattern; multi-PNG publish (publisher extended); vision check now per-state; demo trigger via smee + the resolver, webhook-admin caveat + local-trigger fallback, publisher commits locally, reset-via-revert; `main` is the before-state baseline. NodeNext `.js` + `vitest` throughout.

**Type consistency:** `RagAnswer`/`SearchResult`/`ChangeEntry`/`Doc`/`Severity` are `@surf/types`; `RagSynthesisSchema`/`Retriever`/`CapturedState` are engine-internal; `DiffAnalysisSchema.interactions` is additive (default `[]`, so non-interactive changes are unaffected); `Doc.video?` is additive/optional (omitted when no clip — no consumer breaks); read-state keys off the existing `ChangeEntry.id` (no contract change). Anchors consistent (`github-slugger` ↔ `rehype-slug`).

**Scope:** Plans 1–3 deliver the full product: a real PR regenerates a doc with **complete, interaction-aware** screenshots, the portal updates live with a toast, and grounded RAG answers questions over the new content — with a three-rung fallback so the live demo can't fail.

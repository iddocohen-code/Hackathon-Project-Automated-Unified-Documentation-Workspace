# Plan 3 — RAG Search & Demo Harness

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Plan-style note (per project owner):** describes *what* to build — exact paths, interfaces, behavior, verification — but does **not** embed full implementations. Pure-logic stages (the retriever, the index builder, the search proxy) are specified test-first with concrete assertions; Claude / SSE / Playwright stages are specified by interface + behavior + integration verification. Prerequisites: **Plan 1 complete** (frontend + `lib/content.ts` + `NotificationProvider`/`LiveToast`/`SearchBar` shells) **and Plan 2 complete** (the `services/docs-bot` engine, with the publisher's `notify` hook and index-rebuild hook left as seams).

**Goal:** Make the docs portal's two AI surfaces real and the live demo bullet-proof: (1) the **Smart RAG search** (architecture spec §8) — a natural-language question over the doc corpus returns a grounded answer with deep-linked citations; (2) the **live notification** (§9) — when the bot publishes a `critical`/`high` doc update, a toast pops in the open portal in real time; (3) a **demo harness** (§10) — warm-up, a three-rung fallback ladder (live webhook → run-now → replay mode), and a rehearsal runbook — so a live API/network hiccup can never break the show.

**Architecture:** RAG runs **on the bot** (it already owns the corpus and the Anthropic client) behind a swappable `Retriever` interface — the same downgrade-friendly pattern the spec uses for the scheduler and the screenshot capture. `KeywordRetriever` (in-memory keyword/section scoring) is the reliable demo default; an optional `VectorRetriever` (Voyage embeddings + in-memory cosine) is the documented upgrade behind the same interface. Claude Sonnet 4.6 synthesizes a grounded answer over the retrieved passages, and `POST /search` returns a `RagAnswer`. The portal calls it through a server-side proxy route (keeps the bot URL off the client) and renders an explicit "engine offline" state when the bot is unreachable (§8 graceful degradation). Live notifications use **SSE**: the publisher's `notify` hook emits the published `ChangeEntry` on `GET /events`; the portal's `NotificationProvider` subscribes via `EventSource` and pops the existing `LiveToast`. The demo harness adds a warm-up script and a `REPLAY_MODE` that short-circuits the pipeline to publish pre-captured assets — same visible outcome, zero live-API risk.

**Tech Stack:** (bot) `@anthropic-ai/sdk` + `@anthropic-ai/sdk/helpers/zod` · `zod` · `github-slugger` · `@fastify/cors` · Fastify SSE · (optional) `voyageai`. (portal) Next.js Route Handler proxy · `EventSource` · `rehype-slug` · `react-markdown` (already added in Plan 1 Task 9).

## Global Constraints

- **Language:** TypeScript only. RAG + SSE live in `services/docs-bot`; portal wiring in `apps/surf-console`.
- **RAG model:** answer synthesis → **`claude-sonnet-4-6`** (spec §4 model strategy: latency-sensitive) via `client.messages.parse({ ..., output_config: { format: zodOutputFormat(Schema) } })` from `@anthropic-ai/sdk/helpers/zod`; read `response.parsed_output`. **Never** the deprecated top-level `output_format`. `max_tokens` 4000.
- **Grounded-only (spec §8):** the synthesis prompt instructs Claude to answer **strictly** from the supplied passages and to say it doesn't know if the answer isn't present. Claude returns the answer text + the **indices** of the passages it used; the engine builds the citation `deepLink`s itself (Claude never emits URLs — no hallucinated links).
- **Retriever choice — resolves spec §14's open question.** The `Retriever` interface decouples retrieval from synthesis. **Default = `KeywordRetriever`** (in-memory section scoring by query-term overlap): deterministic, zero extra API/key, instant, offline-capable — ideal for the tiny baseline corpus and a live demo. **Optional upgrade = `VectorRetriever`** (Voyage embeddings + in-memory cosine), behind the same interface (Task 8). `sqlite-vec`/`pgvector` are noted as the scale path only. Do **not** claim semantic search when running the keyword default.
- **Deep-link anchors (spec §8 `/docs/<id>#<section>`):** section anchors are computed with **`github-slugger`** on the bot, and the doc page renders headings with **`rehype-slug`** (same github-slugger algorithm) so `(/docs/<docId>#<anchor>)` always resolves to a real heading.
- **The contract is `@surf/types`** — `/search` returns exactly `RagAnswer` (`{ query, answer, citations: SearchResult[] }`); `SearchResult = { docId, title, snippet, score, deepLink }`. SSE emits a `ChangeEntry`. No new portal-facing shapes.
- **Live notification = SSE; fires on `critical`/`high` (spec §6).** Bot `GET /events`; portal `EventSource` against `NEXT_PUBLIC_BOT_URL`. The portal must **degrade gracefully**: if `NEXT_PUBLIC_BOT_URL` is unset or the connection fails, the portal still runs (Plan 1's local `?demoToast=1` trigger stays as a fallback). EventSource auto-reconnects; `onerror` is silent.
- **Search graceful degradation (spec §8):** if the bot is unreachable, the portal search shows an explicit **"Search engine offline"** state and the rest of the portal (folders, docs, feed) keeps working from committed files.
- **CORS:** the bot enables `@fastify/cors` for the portal origin (`CORS_ORIGIN`, default `http://localhost:3000`) so the browser `EventSource` can reach `/events`. The `/search` call is server→server (the Next proxy), so it isn't subject to CORS.
- **Demo fallback ladder (spec §10), rung order:** (1) **live webhook** merge fires the bot; (2) if the tunnel is flaky → **`POST /run-now`** (Plan 2 Task 4); (3) if a live API/Playwright call is slow or fails → **`REPLAY_MODE=true`** publishes pre-captured assets. Every rung produces the **same** visible result: a v4 doc + a critical What's New entry + a live toast.
- **Warm-up before every demo (spec §10):** run the warm-up script (Task 7) to prime the Claude connection, launch chromium once, and build the index — so the first live call isn't a cold start. Warm-up does **not** mutate `content/docs`, so no reset is required after it; resetting the repo to the before-state is a separate pre-flight step in the runbook.
- **Commits:** authored as the repo owner, **no Claude signature / `Co-Authored-By` trailer.** Commit per task.
- **Secrets:** unchanged from Plan 2 (`ANTHROPIC_API_KEY` etc. from `.env`, gitignored); the optional `VectorRetriever` adds `VOYAGE_API_KEY` (only when enabled).

---

## File Structure (decomposition — locked here)

```
services/docs-bot/
├── src/
│   ├── config.ts                 # MODIFY: add replayMode, corsOrigin, retrieverMode ('keyword'|'vector')
│   ├── server.ts                 # MODIFY: register @fastify/cors; add POST /search, GET /events; (OPTIONAL) GET /agent/corpus
│   ├── rag/
│   │   ├── retriever.ts          # Retriever interface; DocSection/RagIndex/RetrievedPassage; buildSections()
│   │   ├── keywordRetriever.ts   # KeywordRetriever implements Retriever (default)
│   │   ├── vectorRetriever.ts    # (OPTIONAL, Task 8) VectorRetriever implements Retriever (Voyage + cosine)
│   │   ├── corpus.ts             # loadCorpus(docsContentDir): Promise<Doc[]>  (bot-side reader of content/docs)
│   │   ├── makeRetriever.ts      # makeRetriever(config): Retriever  (per retrieverMode)
│   │   └── answer.ts             # answerQuery(query, retriever): Promise<RagAnswer>  (Sonnet 4.6 synthesis)
│   ├── claude/
│   │   └── schemas.ts            # MODIFY: add RagSynthesisSchema = { answer, citedPassageIndices }
│   ├── events/
│   │   └── notifier.ts           # in-memory Notifier: subscribe(cb)/emit(entry); backs GET /events + publisher.notify
│   ├── publish/
│   │   └── publisher.ts          # MODIFY: notify -> notifier.emit; index-rebuild hook -> rebuildIndex()
│   ├── pipeline/
│   │   └── runJob.ts             # MODIFY: REPLAY_MODE short-circuit -> publish canned assets
│   └── scripts/
│       └── warmup.ts             # warm Claude + chromium + index, ping /health
├── fixtures/
│   ├── rag-corpus/               # fixture Docs (incl. after-state shark doc) for deterministic RAG tests
│   └── replay/
│       ├── shark-mitigation.v4.md   # pre-generated after-state doc body
│       ├── shark-after.png          # pre-captured Shark panel screenshot (siren present)
│       └── change-entry.json        # canned critical ChangeEntry (provenance refs)
└── tests/
    ├── retriever.test.ts         # buildSections + KeywordRetriever.retrieve (pure)
    └── corpus.test.ts            # loadCorpus over a temp content dir

apps/surf-console/
├── .env.example or root .env.example  # MODIFY: add BOT_URL (server) ; NEXT_PUBLIC_BOT_URL already present
├── app/docs/api/search/route.ts  # POST proxy -> ${BOT_URL}/search -> RagAnswer (502 -> portal shows "offline")
├── components/docs/
│   ├── SearchBar.tsx             # MODIFY: interactive (Plan 1 left it decorative) — owns query + status state
│   ├── SearchResults.tsx         # answer card ("Answered by AI") + citation rows w/ deep links + offline state
│   └── DocView.tsx               # MODIFY: add rehype-slug so #anchors resolve
├── components/shell/
│   └── NotificationProvider.tsx  # MODIFY: subscribe to ${NEXT_PUBLIC_BOT_URL}/events via EventSource
└── (OPTIONAL) app/docs/agent/page.tsx + docs-header "Agent View" teaser  # roadmap, spec §13.1
```

**Boundary rationale:** RAG sits next to the corpus and the Claude client it needs (the bot), exposed over one HTTP seam the portal proxies. The `Retriever` interface mirrors the spec's `Scheduler`/`ScreenshotCapture` pattern — a reliable demo impl with a richer impl swappable behind it. The `Notifier` is a single tiny module both the publisher and the SSE route depend on — no circular wiring. Replay is a top-of-`runJob` branch behind one config flag, not a parallel pipeline. The portal changes are additive to the Plan 1 shells (`SearchBar`, `NotificationProvider`, `DocView`), not rewrites.

---

## Task 1: Retriever interface + KeywordRetriever (pure, test-first)

**Files:** Create `services/docs-bot/src/rag/retriever.ts`, `src/rag/keywordRetriever.ts`, `tests/retriever.test.ts`; add dep `github-slugger`.

**Interfaces:**
- Consumes: `@surf/types` `Doc`.
- Produces:
  - `interface DocSection { docId: string; docTitle: string; heading: string; anchor: string; text: string }`
  - `interface RetrievedPassage extends DocSection { score: number }`
  - `interface Retriever { build(docs: Doc[]): Promise<void>; retrieve(query: string, k?: number): Promise<RetrievedPassage[]> }`
  - `buildSections(docs: Doc[]): DocSection[]` (in `retriever.ts`) — splits each `doc.bodyMarkdown` into sections at ATX headings (`#`/`##`/`###`); each section's `heading` is the heading text (the doc title for the lead/preamble), `anchor` is `new GithubSlugger().slug(heading)` (slugger **reset per doc** so anchors match the per-page `rehype-slug`), `text` is the heading's body.
  - `class KeywordRetriever implements Retriever` — `build` stores `buildSections(docs)`; `retrieve(query, k = 4)` lowercase-tokenizes the query (drop stopwords + sub-3-char tokens), scores each section by the count of query terms occurring in `heading`+`text` (heading matches weighted ×3), returns the top `k` sections with `score > 0`, descending.

- [ ] **Step 1: Write failing tests.** `tests/retriever.test.ts` (node:test + tsx, or vitest) using two inline fixture `Doc`s — an after-state `shark-mitigation` whose body has `## Emergency response steps` containing "press the red Emergency Shark Siren button", and a `wave-height-telemetry` doc:
  - `buildSections([sharkDoc])` yields a section with `heading === "Emergency response steps"` and `anchor === "emergency-response-steps"`, `text` containing "Emergency Shark Siren".
  - `await new KeywordRetriever()` after `build([shark, wave])` → `(await retrieve("how do I trigger the shark siren", 4))[0].docId === "shark-mitigation"` with `score > 0`.
  - `retrieve("monthly billing invoices")` returns `[]` (no term overlap → no fabricated hits).
  - anchors are unique within a doc when two headings collide (slugger appends `-1`).
- [ ] **Step 2: Run — must fail.** Run: `pnpm --filter @surf/docs-bot test`. Expected: FAIL (module absent).
- [ ] **Step 3:** Implement `retriever.ts` (interface + types + `buildSections` via `github-slugger`; a small markdown-heading splitter; pure) and `keywordRetriever.ts`.
- [ ] **Step 4: Run — must pass.** Run: `pnpm --filter @surf/docs-bot test`. Expected: PASS.
- [ ] **Step 5: Commit.** `git add services/docs-bot && git commit -m "feat(bot): Retriever interface + KeywordRetriever (sections + scoring)"`

---

## Task 2: Corpus loader (bot-side reader of content/docs)

**Files:** Create `services/docs-bot/src/rag/corpus.ts`, `tests/corpus.test.ts`.

**Interfaces:**
- Consumes: `Config.docsContentDir`; `@surf/types` `Doc`, `DocsManifest`.
- Produces: `loadCorpus(docsContentDir: string): Promise<Doc[]>` — reads `manifest.json`, then for each manifest `Doc` injects `bodyMarkdown` from `<docId>/index.md`. This is the bot-side mirror of Plan 1's `lib/content.ts` `getManifest`/`getDoc` (the bot can't import the Next app), reading the **same files** the publisher writes.

- [ ] **Step 1: Write failing test.** `tests/corpus.test.ts`: point at a temp dir seeded with a minimal `manifest.json` (one `shark-mitigation` doc) + `shark-mitigation/index.md`; `loadCorpus(tmp)` returns one `Doc` whose `bodyMarkdown` contains the markdown body and whose `id === "shark-mitigation"`.
- [ ] **Step 2: Run — must fail.** Run: `pnpm --filter @surf/docs-bot test`. Expected: FAIL.
- [ ] **Step 3:** Implement `loadCorpus` (`fs/promises` + `path`; validate against `@surf/types` `Doc`).
- [ ] **Step 4: Run — must pass.** Run: `pnpm --filter @surf/docs-bot test`. Expected: PASS.
- [ ] **Step 5: Commit.** `git add services/docs-bot && git commit -m "feat(bot): corpus loader for content/docs"`

---

## Task 3: RAG answer synthesis (Sonnet 4.6, grounded, structured output)

**Files:** Create `services/docs-bot/src/rag/answer.ts`; modify `src/claude/schemas.ts` (add `RagSynthesisSchema`).

**Interfaces:**
- Consumes: a `Retriever` (Task 1), the singleton Anthropic client (Plan 2 `claude/client.ts`).
- Produces:
  - `RagSynthesisSchema` (zod) = `{ answer: string; citedPassageIndices: number[] }`.
  - `answerQuery(query: string, retriever: Retriever): Promise<RagAnswer>` — `const passages = await retriever.retrieve(query, 4)`; **if empty → return `{ query, answer: "I couldn't find anything about that in the current documentation.", citations: [] }` without calling Claude.** Otherwise call `client.messages.parse({ model: "claude-sonnet-4-6", max_tokens: 4000, output_config: { format: zodOutputFormat(RagSynthesisSchema) }, messages: [...] })` — the prompt enumerates the retrieved passages (index, doc title, heading, text) and instructs Claude to answer strictly from them and return the passage indices it relied on. Assemble `RagAnswer`: `citations = parsed_output.citedPassageIndices.map(i => passages[i]).filter(Boolean).map(p => ({ docId: p.docId, title: p.docTitle, snippet: <p.text truncated ~240 chars>, score: p.score, deepLink: \`/docs/${p.docId}#${p.anchor}\` }))`.

**Behavior:** for *"How do I trigger the shark siren?"* over an after-state corpus, the answer paragraph explains pressing the red **Emergency Shark Siren** button on the Shark Mitigation panel, and `citations[0].deepLink === "/docs/shark-mitigation#emergency-response-steps"`.

- [ ] **Step 1:** Add `RagSynthesisSchema` to `schemas.ts`; implement `answer.ts` (reuse `claude/client.ts`; grounded-only prompt; index→citation assembly per above).
- [ ] **Step 2: Verify (integration, needs `ANTHROPIC_API_KEY`).** A throwaway script (or `tests/answer.live.test.ts`, skipped without a key) builds a `KeywordRetriever` over `fixtures/rag-corpus/` (which includes the after-state shark doc), calls `answerQuery("How do I trigger the shark siren?", retriever)`, and asserts: `answer` mentions "Emergency Shark Siren"; `citations.length >= 1`; `citations[0].docId === "shark-mitigation"` and its `deepLink` starts `"/docs/shark-mitigation#"`. Also assert `answerQuery("how do I reset my billing password", retriever)` returns `citations.length === 0`.
- [ ] **Step 3: Verify build.** Run: `pnpm --filter @surf/docs-bot build`. Expected: compiles.
- [ ] **Step 4: Commit.** `git add services/docs-bot && git commit -m "feat(bot): RAG answer synthesis (Sonnet 4.6, grounded + cited)"`

---

## Task 4: `/search` endpoint + index lifecycle (build at boot, rebuild on publish)

**Files:** Create `src/rag/makeRetriever.ts`; modify `src/server.ts` (register `@fastify/cors`; add `POST /search`), `src/index.ts` (build the index at boot, hold the retriever in module state), `src/publish/publisher.ts` (wire the index-rebuild hook), `src/config.ts` (add `corsOrigin`, `retrieverMode`); add dep `@fastify/cors`.

**Interfaces:**
- Consumes: `loadCorpus` (Task 2), `KeywordRetriever` (Task 1), `answerQuery` (Task 3).
- Produces:
  - `makeRetriever(config): Retriever` — returns `new KeywordRetriever()` for `retrieverMode === 'keyword'` (default), `new VectorRetriever(config)` for `'vector'` (Task 8).
  - A shared retriever held in module state: `getRetriever(): Retriever` + `rebuildIndex(): Promise<void>` (`await retriever.build(await loadCorpus(config.docsContentDir))`). Built once at boot; `publisher.publish` calls `rebuildIndex()` after a successful commit (this is the index-rebuild hook Plan 2 Task 10 left).
  - `POST /search` body `{ query: string }` → `200 RagAnswer` (`answerQuery(query, getRetriever())`); empty/missing query → `400`.
  - `@fastify/cors` allowing `config.corsOrigin` (for the browser `EventSource` in Task 5; harmless for `/search`).

- [ ] **Step 1:** Add `corsOrigin` (env `CORS_ORIGIN`, default `http://localhost:3000`) + `retrieverMode` (env `RETRIEVER_MODE`, default `keyword`) to `config.ts`. Implement `makeRetriever.ts`. Register `@fastify/cors`. Add the module-state retriever + `rebuildIndex()` (called in `index.ts` at boot). Add `POST /search`.
- [ ] **Step 2:** In `publisher.ts`, replace the no-op index-rebuild hook with a call to `rebuildIndex()` after the commit succeeds.
- [ ] **Step 3: Verify build.** Run: `pnpm --filter @surf/docs-bot build`. Expected: compiles.
- [ ] **Step 4: Verify (integration, needs key).** Start the bot (`pnpm --filter @surf/docs-bot dev`) pointed at a `content/docs` containing the after-state shark doc. `curl -s -XPOST localhost:4000/search -H 'content-type: application/json' -d '{"query":"How do I trigger the shark siren?"}'` returns a `RagAnswer` whose `answer` mentions the siren and `citations[0].deepLink` starts `/docs/shark-mitigation#`. An empty `{"query":""}` → `400`.
- [ ] **Step 5: Commit.** `git add services/docs-bot && git commit -m "feat(bot): /search endpoint + retriever boot/rebuild + CORS"`

---

## Task 5: Live notifications — SSE on the bot + portal subscription

**Files:** Create `services/docs-bot/src/events/notifier.ts`; modify `src/server.ts` (add `GET /events`), `src/publish/publisher.ts` (wire `notify` → `notifier.emit`); modify `apps/surf-console/components/shell/NotificationProvider.tsx`.

**Interfaces:**
- Bot:
  - `interface Notifier { subscribe(cb: (entry: ChangeEntry) => void): () => void; emit(entry: ChangeEntry): void }` (a module-level in-memory emitter; `subscribe` returns an unsubscribe fn).
  - `GET /events` — SSE: sets `Content-Type: text/event-stream`, `subscribe`s, writes `data: ${JSON.stringify(entry)}\n\n` per emitted `ChangeEntry`, sends a heartbeat comment (`: ping\n\n`) on an interval, and unsubscribes + clears the heartbeat on `close`.
  - `publisher.publish` calls `notifier.emit(changeEntry)` (replacing Plan 2's no-op `notify` hook) **after** the commit + `rebuildIndex()`.
- Portal: `NotificationProvider` (Plan 1 Task 10 — already exposes `show(entry)`/`dismiss()`/`critical`): on mount, if `process.env.NEXT_PUBLIC_BOT_URL` is set, open `new EventSource(\`${NEXT_PUBLIC_BOT_URL}/events\`)`; `onmessage` → `JSON.parse` a `ChangeEntry` → if `severity` is `critical` or `high` (spec §6), call `show(entry)`. `onerror` is a no-op (EventSource auto-reconnects). Close on unmount. The Plan 1 local `?demoToast=1` trigger stays as a fallback.

- [ ] **Step 1:** Implement `notifier.ts`; add `GET /events` in `server.ts`; wire `publisher.notify` → `notifier.emit`.
- [ ] **Step 2:** Modify `NotificationProvider.tsx` to subscribe via `EventSource` (guarded by `NEXT_PUBLIC_BOT_URL`; graceful when unset/erroring).
- [ ] **Step 3: Verify build.** Run: `pnpm --filter @surf/docs-bot build` and `pnpm --filter surf-console build`. Expected: both compile.
- [ ] **Step 4: Verify (integration).** Run the bot + the portal (with `NEXT_PUBLIC_BOT_URL=http://localhost:4000`). Open `/docs` in the browser. In another terminal `curl -s localhost:4000/events` shows the stream stays open with heartbeats. Trigger a critical publish (`POST /run-now` on the demo job, or `REPLAY_MODE` from Task 7): the **toast pops live** in the open portal and the top-bar bell shows its red dot — without a page reload.
- [ ] **Step 5: Commit.** `git add services/docs-bot apps/surf-console && git commit -m "feat: live SSE notifications (bot /events + portal EventSource)"`

---

## Task 6: Portal RAG search wiring — proxy route + interactive SearchBar + deep-link anchors

**Files:** Create `apps/surf-console/app/docs/api/search/route.ts`, `components/docs/SearchResults.tsx`; modify `components/docs/SearchBar.tsx`, `components/docs/DocView.tsx` (add `rehype-slug`), `.env.example` (add `BOT_URL`); add dep `rehype-slug`.

**Interfaces:**
- Consumes: `@surf/types` `RagAnswer`, `SearchResult`.
- Produces:
  - `POST /docs/api/search` (Next Route Handler) — body `{ query }`, forwards to `${process.env.BOT_URL}/search` (server-side; default `http://localhost:4000`), returns the `RagAnswer` JSON. **On fetch failure, returns HTTP `502`** (the portal renders an explicit "Search engine offline" state — spec §8 graceful degradation — rather than a fake answer).
  - `<SearchBar/>` (now `"use client"`) — controlled input; on submit `POST`s `/docs/api/search` and tracks `status: 'idle' | 'loading' | 'answered' | 'offline'` + the `RagAnswer`. Renders `<SearchResults/>` beneath the input when answered; a `502`/network error → `offline`; clearing the input returns to `idle` (folder grid below stays mounted).
  - `<SearchResults answer={RagAnswer} status=…/>` — the **answer card** (frosted, a "✨ Answered by AI" label, the `answer` paragraph) followed by **citation rows**: each `SearchResult` shows `title` + `snippet` + a "Jump to section →" `next/link` to `citation.deepLink`. Empty `citations` → just the answer card. `status === 'offline'` → a muted "Search engine offline — browse the folders below" notice.
  - `<DocView/>` — its `react-markdown` gains `rehypePlugins={[rehypeSlug]}` so headings get `id`s matching the citation anchors, making `/docs/<id>#<anchor>` scroll to the section.

**Source pointers:** answer/citation visual treatment per frontend-design-spec §5.2 (synthesized answer card on top, cited source rows with a "Jump to section →" deep link, subtle "Answered by AI" label). Reuse the search-bar shell from Plan 1 Task 7 (mock lines **363–368**).

- [ ] **Step 1:** Add `rehype-slug` to `apps/surf-console`; add `rehypePlugins={[rehypeSlug]}` in `DocView.tsx`. Add `BOT_URL` to `.env.example`.
- [ ] **Step 2:** Create the proxy `route.ts` (server-only; reads `process.env.BOT_URL`; `502` on error).
- [ ] **Step 3:** Make `SearchBar.tsx` interactive (client; query/status/answer state; calls the proxy). Build `SearchResults.tsx` per the pointers (incl. the offline state).
- [ ] **Step 4: Verify build.** Run: `pnpm --filter surf-console build`. Expected: compiles.
- [ ] **Step 5: Verify (integration, bot running with after-state corpus).** `dev` the portal; on `/docs` type *"How do I trigger the shark siren?"* → an answer card appears mentioning the Emergency Shark Siren, with a "Jump to section →" citation; clicking it navigates to `/docs/shark-mitigation` and **scrolls to the Emergency response steps heading**. An off-topic query shows the graceful "couldn't find" answer with no citations. **Stop the bot and search again → the "Search engine offline" notice appears** and the folders still work.
- [ ] **Step 6: Commit.** `git add apps/surf-console && git commit -m "feat(docs): RAG search — proxy route + interactive search + cited deep links"`

---

## Task 7: Demo safety net — warm-up script + REPLAY_MODE short-circuit

**Files:** Create `services/docs-bot/src/scripts/warmup.ts`, `fixtures/replay/{shark-mitigation.v4.md,shark-after.png,change-entry.json}`; modify `src/config.ts` (add `replayMode`), `src/pipeline/runJob.ts` (REPLAY branch), `package.json` (add `warmup` script).

**Interfaces:**
- Consumes: the publisher (Task 5 wiring), `Config`.
- Produces:
  - `config.replayMode` (env `REPLAY_MODE`, default `false`).
  - **`runJob` REPLAY branch:** when `config.replayMode`, **skip** diff/context/analyze/capture/vision/write and go straight to `publish` with the canned assets — the after-state `bodyMarkdown` from `fixtures/replay/shark-mitigation.v4.md`, the `fixtures/replay/shark-after.png` screenshot, and the `fixtures/replay/change-entry.json` critical `ChangeEntry`. It still does a **real** publish → real commit → real `rebuildIndex()` → real `notifier.emit`, so the portal sees v4 + the critical What's New entry + the live toast, identical to a live run. Each stage still logs its narration line (replay logs `(replay)` after each) — spec §10 "every live step logs to a visible console."
  - **`warmup.ts`** (run via `pnpm --filter @surf/docs-bot warmup`): a tiny `messages.create` ping to `claude-opus-4-8` and `claude-sonnet-4-6` (primes the connection), a launch+close of Playwright chromium (primes the browser binary), one `rebuildIndex()` (primes the retriever), and a `GET /health` check. Prints a ✓/✗ checklist. **Does not mutate `content/docs`.**

**Capturing the canned assets:** record `fixtures/replay/*` **from a successful live run** of the Plan 2 pipeline (the real generated v4 markdown + the real captured PNG + the emitted critical entry), so replay reproduces a genuine result, not a hand-faked one.

- [ ] **Step 1:** Add `replayMode` to `config.ts`. Add the REPLAY branch at the top of `runJob.ts`. Add the `warmup` package script + `warmup.ts`.
- [ ] **Step 2:** Do one real live pipeline run (Plan 2 end-to-end) and copy its outputs into `fixtures/replay/` (md + png + the critical `ChangeEntry` JSON).
- [ ] **Step 3: Verify replay (no key needed).** With the portal running + `NEXT_PUBLIC_BOT_URL` set, start the bot with `REPLAY_MODE=true` and `POST /run-now`. Expected: `content/docs/shark-mitigation/` updates to v4 with the canned screenshot, the critical entry prepends to `changelog.json`, and the **live toast pops** in the open portal — with **no** Claude/Playwright calls.
- [ ] **Step 4: Verify warm-up (needs key).** Run: `pnpm --filter @surf/docs-bot warmup`. Expected: all four checks print ✓.
- [ ] **Step 5: Commit.** `git add services/docs-bot && git commit -m "feat(bot): demo safety net — warm-up script + REPLAY_MODE"`

---

## Task 8: (OPTIONAL — quality upgrade, time-permitting) VectorRetriever behind the Retriever interface

> Implement **only if time remains** after Tasks 1–7 and a clean rehearsal. The `KeywordRetriever` default is sufficient for the demo; this is the spec §8 "vector index" upgrade, swappable via `RETRIEVER_MODE=vector` with **no** change to `answerQuery` or `/search`.

**Files:** Create `services/docs-bot/src/rag/vectorRetriever.ts`; add dep `voyageai`; modify `.env.example` (add `VOYAGE_API_KEY`).

**Interfaces:**
- Produces: `class VectorRetriever implements Retriever` — `build(docs)` runs `buildSections(docs)` then embeds each section's `heading + "\n" + text` with Voyage (`voyage-3` or current small model), holding `{ section, vector }[]` in memory; `retrieve(query, k)` embeds the query and returns the top-`k` sections by cosine similarity (with a small floor so off-topic queries still return `[]`), as `RetrievedPassage` with `score = cosine`. Same shape as `KeywordRetriever` — `answerQuery` is unchanged.

- [ ] **Step 1:** Add `voyageai` + `VOYAGE_API_KEY`. Implement `vectorRetriever.ts`; wire it into `makeRetriever` for `retrieverMode === 'vector'`.
- [ ] **Step 2: Verify (integration, needs `VOYAGE_API_KEY` + `ANTHROPIC_API_KEY`).** With `RETRIEVER_MODE=vector`, `answerQuery("how do I sound the evacuation alarm?", retriever)` (a paraphrase that shares few exact keywords with the doc) still cites `shark-mitigation` — demonstrating semantic recall over the keyword baseline. The off-topic billing query still returns `citations.length === 0`.
- [ ] **Step 3: Verify build.** Run: `pnpm --filter @surf/docs-bot build`. Expected: compiles.
- [ ] **Step 4: Commit.** `git add services/docs-bot && git commit -m "feat(bot): optional VectorRetriever (Voyage embeddings) behind Retriever interface"`

---

## Task 9: (OPTIONAL — roadmap, time-permitting) Agent-facing docs teaser

> Implement **only if time remains** after Tasks 1–7 and a clean rehearsal. This realizes spec §13.1 (the parallel, machine-readable docs surface for AI agents) as a thin teaser — not a full feature — so it can be *shown* in the demo as a roadmap item.

**Files:** Modify `services/docs-bot/src/server.ts` (add `GET /agent/corpus` + a plaintext `GET /llms.txt`); create `apps/surf-console/app/docs/agent/page.tsx`; modify `components/docs/DocsHeader.tsx` (a disabled "Agent View" pill).

**Interfaces:**
- Bot `GET /agent/corpus` → JSON: a flat, machine-optimized projection of the corpus — `[{ id, title, category, version, updatedAt, sections: [{ heading, anchor, text }] }]` (reuses `buildSections` grouped by doc). `GET /llms.txt` → the `llms.txt`-style plaintext index (title + one-line summary + deep link per doc). These are the "agents inspect/query the docs programmatically" surface (spec §13.1), a *second projection* of the same typed `Doc` model — no new source of truth.
- Portal `/docs/agent` — a simple page explaining the agent surface and linking to `GET /agent/corpus` + `/llms.txt`; the `DocsHeader` shows a disabled **"Agent View"** pill with tooltip *"Coming soon: a machine-readable docs surface for AI agents."*

- [ ] **Step 1:** Add `GET /agent/corpus` + `GET /llms.txt` (reuse `getRetriever()` / `buildSections`, grouped by doc).
- [ ] **Step 2:** Add the disabled "Agent View" pill + the `/docs/agent` explainer page.
- [ ] **Step 3: Verify build.** Run: `pnpm build`. Expected: compiles. `curl localhost:4000/agent/corpus` returns the JSON projection; `curl localhost:4000/llms.txt` returns the plaintext index.
- [ ] **Step 4: Commit.** `git add services/docs-bot apps/surf-console && git commit -m "feat: agent-facing docs corpus + llms.txt + roadmap teaser"`

---

## Task 10: Rehearsal runbook + full verification + push

**Files:** Create `docs/superpowers/demo-runbook.md`; final workspace verification.

**Interfaces:** none new.

- [ ] **Step 1:** Write `docs/superpowers/demo-runbook.md` capturing:
  - **Env matrix:** bot (`ANTHROPIC_API_KEY`, `GITHUB_WEBHOOK_SECRET`, `SCHEDULER_MODE=instant`, `SURF_CONSOLE_URL`, `DOCS_CONTENT_DIR`, `CORS_ORIGIN`, `RETRIEVER_MODE=keyword`, `REPLAY_MODE=false`) + portal (`BOT_URL`, `NEXT_PUBLIC_BOT_URL`).
  - **Pre-flight (spec §10):** (a) reset the repo to the **before-state** (`shark-mitigation` v3, no siren, 2 info changelog entries) and confirm the portal shows it; (b) run `warmup` and confirm `/health`, portal `/docs`, the open SSE in the browser, and the `demo/shark-siren` branch unmerged.
  - **The narration (spec §10, all 12 steps):** before-state portal → merge the PR → bot stages log (detected → context → analyze → capture → vision ✓ → write → publish) → portal v4 doc + screenshot + critical What's New entry + **live toast** → open the doc → RAG search *"How do I trigger the shark siren?"* → cited answer → jump to section.
  - **Fallback ladder, in order:** (1) live webhook merge; (2) if the tunnel is flaky → `POST /run-now`; (3) if a live call stalls → set `REPLAY_MODE=true` and `POST /run-now`. State that all three yield the same visible result.
- [ ] **Step 2: Full workspace build/lint.** Run: `pnpm build` then `pnpm lint`. Expected: both pass across the workspace.
- [ ] **Step 3: Full rehearsal (manual, needs key).** Walk the runbook end-to-end on the **live** rung once, then prove the **replay** rung once. Both must end with v4 + critical entry + live toast + a working cited RAG answer.
- [ ] **Step 4: Commit + push.** `git add docs/superpowers/demo-runbook.md && git commit -m "docs: demo runbook + fallback ladder; Plan 3 complete" && git push origin main`

---

## Self-Review

**Spec coverage:**
- RAG search, first-class (spec §8; frontend-design-spec §5.2) → Retriever interface + KeywordRetriever Task 1, corpus Task 2, synthesis Task 3, endpoint Task 4, portal UI + deep links Task 6, optional vector upgrade Task 8. ✓
- §14 open question (vector store choice) → **resolved**: KeywordRetriever as the demo default, optional VectorRetriever (Voyage + in-memory cosine) behind the interface; sqlite-vec/pgvector as scale path. ✓
- §8 grounded-only + always-current + graceful degradation → grounded prompt + index-rebuild on publish (Task 4) + explicit "engine offline" state (Task 6). ✓
- Live notification toast on `critical`/`high` (spec §6, §9) → SSE Task 5 (replaces Plan 1's local trigger; Plan 2's `notify` hook now real). ✓
- Demo on a real PR with downgrades + safety nets (spec §10): the fallback ladder (webhook → `/run-now` → `REPLAY_MODE`), warm-up, before-state reset, visible logging → Tasks 7 & 10. ✓
- Agent-facing parallel docs interface (spec §13.1, incl. `llms.txt` + structured JSON) → Task 9, explicitly **optional/roadmap**. ✓

**Placeholder scan:** none — pure stages (Tasks 1–2, the proxy in Task 6) are test-first with concrete assertions; Claude/SSE/Playwright/vector stages give interface + behavior + integration verification; the two optional tasks are fenced as roadmap/quality upgrades.

**Type consistency:** `RagAnswer`/`SearchResult`/`ChangeEntry`/`Doc`/`Severity` are the `@surf/types` names used in Plan 1 & 2 — `/search` returns `RagAnswer`, `/events` emits `ChangeEntry`, citations are `SearchResult`. `RagSynthesisSchema`/`Retriever`/`DocSection`/`RetrievedPassage` are engine-internal (the schema is the Claude I/O shape; the engine assembles the public `RagAnswer`). `KeywordRetriever` and the optional `VectorRetriever` satisfy the same `Retriever` interface, so `answerQuery`/`/search` are impl-agnostic. Anchor slugs are consistent between the retriever (`github-slugger`) and `DocView` (`rehype-slug`). The index-rebuild and `notify` hooks consumed here are exactly the seams Plan 2 Task 10 left.

**Scope:** Plan 3 turns the two AI surfaces real and hardens the live demo. With Plans 1–3 the product is end-to-end: a real PR regenerates a doc, the portal updates live with a toast, and a grounded RAG search answers questions over the new content — with a three-rung fallback so the live demo can't fail.

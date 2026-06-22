# Plan 2 — The docs-bot Engine

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Plan-style note (per project owner):** describes *what* to build — exact paths, interfaces, behavior, verification — but does **not** embed full implementations. Pure-logic stages (filter, scheduler, normalize, verify, context) are specified test-first with concrete assertions; Claude/Playwright stages are specified by interface + behavior. Prerequisite: **Plan 1 complete** (monorepo + `@surf/types` + `apps/surf-console` with seeded **before-state** content and `lib/content.ts`).

**Goal:** A standalone TypeScript engine that watches the repo, and on a relevant frontend PR regenerates the affected documentation — Claude analyzes the diff + context, Playwright screenshots the new UI, Claude verifies and rewrites the doc, and the publisher commits markdown + images back into `apps/surf-console/content/docs/` (the contract `lib/content.ts` reads).

**Architecture:** A Fastify webhook service at `services/docs-bot`. A pipeline of single-purpose stages behind interfaces — `webhook → filter → scheduler → context → analyze → capture → write → publish` — so the two slow/flaky stages (scheduler wait, full Computer Use) are swappable for fast demo implementations without faking the rest. Claude via the Anthropic TS SDK; screenshots via Playwright.

**Tech Stack:** Node + TypeScript · Fastify · `@anthropic-ai/sdk` + `@anthropic-ai/sdk/helpers/zod` · `zod` · `playwright` · `simple-git` · `dotenv`.

## Global Constraints

- **Language:** TypeScript only. Service lives at `services/docs-bot` (a pnpm workspace package).
- **Models:** diff analysis + doc writing → **`claude-opus-4-8`** with `thinking: {type: "adaptive"}` and `output_config: {effort: "high"}`; vision check + (Plan 3) RAG → **`claude-sonnet-4-6`**. Exact ID strings, no date suffix.
- **Structured Claude output:** use `client.messages.parse({ ..., output_config: { format: zodOutputFormat(Schema) } })` from `@anthropic-ai/sdk/helpers/zod`; read `response.parsed_output`. **Never** the deprecated top-level `output_format`. `max_tokens` ≥ 16000 (non-streaming) for the doc writer.
- **Vision input:** pass the screenshot as a base64 `image` content block **before** the text block (`{type:"image", source:{type:"base64", media_type:"image/png", data}}`).
- **The contract is `@surf/types`** — the publisher emits exactly the `Doc` / `ChangeEntry` / `DocsManifest` / `Changelog` shapes `apps/surf-console/lib/content.ts` reads. If a field is missing, fix it in `@surf/types`, not by widening the reader.
- **Demo = before→after on a real PR.** The trigger is a PR that **adds the Emergency Shark Siren button** to `apps/surf-console/components/console/SharkMitigationCard.tsx`. The engine regenerates `shark-mitigation` from **v3 → v4** with the siren step + a fresh screenshot, and appends a **critical** `ChangeEntry`.
- **Scheduler downgrade:** `SCHEDULER_MODE=instant` (default) runs jobs on next tick + a manual "Run now"; `throttled` adds the production debounce/stabilization wait. One env flag, no faked stages.
- **Computer Use downgrade:** Playwright screenshot capture now; the `ScreenshotCapture` interface leaves room for a future `ComputerUseCapture`.
- **No publish loop:** the publisher commits to `content/docs/**`, which the path filter ignores — a publish never re-triggers the bot.
- **Commits:** authored as the repo owner, **no Claude signature/co-author**. Engine-authored doc commits use a clear message (`docs: regenerate <docId> (v<n>) [skip-bot]`).
- **Secrets:** `ANTHROPIC_API_KEY`, `GITHUB_WEBHOOK_SECRET` from env (`.env`, gitignored). Never commit keys.

---

## File Structure (decomposition — locked here)

```
services/docs-bot/
├── package.json                 # deps: fastify, @anthropic-ai/sdk, zod, playwright, simple-git, dotenv, @surf/types
├── tsconfig.json                # extends ../../tsconfig.base.json
├── playwright.config.ts         # chromium only; baseURL from SURF_CONSOLE_URL
├── src/
│   ├── index.ts                 # bootstrap: load config, build pipeline, start server + scheduler
│   ├── config.ts                # typed env (SCHEDULER_MODE, SURF_CONSOLE_URL, DOCS_CONTENT_DIR, secret)
│   ├── server.ts                # Fastify app: POST /webhook, POST /run-now, GET /health
│   ├── webhook/
│   │   ├── verify.ts            # verifyGithubSignature(secret, rawBody, sigHeader): boolean
│   │   └── normalize.ts         # toPullRequestEvent(githubPayload): PullRequestEvent | null
│   ├── pipeline/
│   │   ├── filter.ts            # isRelevant(changedPaths): boolean (pure)
│   │   ├── scheduler.ts         # Scheduler interface + InstantScheduler + ThrottledScheduler
│   │   └── runJob.ts            # orchestrates the stages for one PullRequestEvent
│   ├── git/
│   │   └── diff.ts              # getDiff(mergedSha): { path, patch }[]  (filtered to watched globs)
│   ├── context/
│   │   ├── source.ts            # ContextSource interface + aggregateContext(pr): ContextRef[]
│   │   └── fixtures/            # FixtureJiraSource / FixtureSlackSource / FixtureConfluenceSource + data
│   ├── claude/
│   │   ├── client.ts            # singleton Anthropic client
│   │   ├── schemas.ts           # zod schemas: DiffAnalysis, DocDraft, VisionVerdict
│   │   ├── prompts.ts           # prompt builders + the Upwind tone/style guide string
│   │   ├── analyzeDiff.ts       # Opus 4.8 → DiffAnalysis (which doc, structural change, intent)
│   │   ├── visionCheck.ts       # Sonnet 4.6 → VisionVerdict (does screenshot show the change?)
│   │   └── writeDoc.ts          # Opus 4.8 → DocDraft (Doc bodyMarkdown + ChangeSummary, Upwind tone)
│   ├── capture/
│   │   └── capture.ts           # ScreenshotCapture interface + PlaywrightCapture
│   └── publish/
│       └── publisher.ts         # write md+png, update manifest+changelog, git commit, rebuild index hook
├── fixtures/
│   ├── jira-SURF-142.json       # the Emergency Shark Siren ticket
│   ├── slack-surf-safety.json   # the #surf-safety thread
│   └── confluence-shark-runbook.md
└── tests/                       # *.test.ts for filter, scheduler, normalize, verify, context, publisher
```

**Boundary rationale:** each stage is one file behind one interface, so it's unit-testable in isolation and swappable (instant vs throttled scheduler; fixture vs real context; Playwright vs Computer Use capture). `publisher.ts` is the only writer of `content/docs` — it must stay shape-compatible with Plan 1's `lib/content.ts`.

---

## Task 1: Service scaffold + config + Fastify skeleton

**Files:** Create `services/docs-bot/package.json`, `tsconfig.json`, `src/config.ts`, `src/server.ts`, `src/index.ts`.

**Interfaces:**
- Produces: `loadConfig(): Config` (`{ schedulerMode: 'instant'|'throttled', surfConsoleUrl, docsContentDir, webhookSecret, port }`); a Fastify app with `GET /health` → `{ok:true}`; `start()` that listens on `config.port` (default 4000).

- [ ] **Step 1:** `package.json` (`name "@surf/docs-bot"`, `private`, type `module`, scripts `dev`/`build`/`start`/`test`/`lint`; deps per File Structure; `@surf/types: "workspace:*"`). `tsconfig.json` extends base. Run `pnpm install` at the root to link the workspace.
- [ ] **Step 2:** `config.ts` reads `process.env` via `dotenv`, validates with a small zod schema, exposes typed `Config`. `server.ts` builds the Fastify app with `GET /health`. `index.ts` calls `loadConfig()` then `start()`.
- [ ] **Step 3: Verify build.** Run: `pnpm --filter @surf/docs-bot build`. Expected: compiles.
- [ ] **Step 4: Verify boot.** Run: `pnpm --filter @surf/docs-bot dev` then `curl localhost:4000/health`. Expected: `{"ok":true}`.
- [ ] **Step 5: Commit.** `git add services/docs-bot && git commit -m "feat(bot): service scaffold (Fastify + typed config)"`

---

## Task 2: Webhook receiver — signature verify + payload normalize

**Files:** Create `src/webhook/verify.ts`, `src/webhook/normalize.ts`, `tests/webhook.test.ts`; modify `src/server.ts` (add `POST /webhook`).

**Interfaces:**
- Consumes: `Config.webhookSecret`; `@surf/types` `PullRequestEvent`.
- Produces: `verifyGithubSignature(secret: string, rawBody: Buffer, signatureHeader: string): boolean` (HMAC-SHA256, constant-time compare); `toPullRequestEvent(payload: unknown): PullRequestEvent | null` (returns null for non-merge / non-PR events). The `POST /webhook` route verifies the signature (401 on mismatch), normalizes, and enqueues relevant events.

- [ ] **Step 1: Write failing tests.** `tests/webhook.test.ts`:
  - `verifyGithubSignature` returns `true` for a body signed with the known secret (`sha256=` + HMAC), `false` for a tampered body, `false` for a wrong secret.
  - `toPullRequestEvent` on a `pull_request` `closed`+`merged:true` fixture returns a `PullRequestEvent` with `mergedSha`, `changedPaths`, `prUrl`, `title`, `body` populated.
  - `toPullRequestEvent` on a non-merge event (e.g. `opened`) returns `null`.
- [ ] **Step 2: Run — must fail.** Run: `pnpm --filter @surf/docs-bot test`. Expected: FAIL (functions absent).
- [ ] **Step 3:** Implement `verify.ts` (node `crypto.createHmac` + `timingSafeEqual`) and `normalize.ts`; wire `POST /webhook` in `server.ts` (read raw body for HMAC; verify → normalize → if non-null, hand to the scheduler — stubbed until Task 4).
- [ ] **Step 4: Run — must pass.** Run: `pnpm --filter @surf/docs-bot test`. Expected: PASS.
- [ ] **Step 5: Commit.** `git add services/docs-bot && git commit -m "feat(bot): webhook signature verify + payload normalize"`

---

## Task 3: Path filter (the frontend-only, no-loop rule)

**Files:** Create `src/pipeline/filter.ts`, `tests/filter.test.ts`.

**Interfaces:**
- Produces: `isRelevant(changedPaths: string[]): boolean` — `true` iff at least one path matches a watched UI glob (`apps/surf-console/components/console/**`, `apps/surf-console/components/docs/**`, `apps/surf-console/app/**`) **and** the change set is not *only* under `apps/surf-console/content/docs/**` or `services/**`.

- [ ] **Step 1: Write failing tests.** `tests/filter.test.ts`:
  - `["apps/surf-console/components/console/SharkMitigationCard.tsx"]` → `true`.
  - `["apps/surf-console/content/docs/shark-mitigation/index.md"]` → `false` (publish output; no loop).
  - `["services/docs-bot/src/server.ts"]` → `false` (backend).
  - mixed `["apps/surf-console/components/console/SharkMitigationCard.tsx", "apps/surf-console/content/docs/shark-mitigation/index.md"]` → `true` (a real UI change rides along).
  - `[]` → `false`.
- [ ] **Step 2: Run — must fail.** Run: `pnpm --filter @surf/docs-bot test`. Expected: FAIL.
- [ ] **Step 3:** Implement `isRelevant` (use `picomatch` or a small glob matcher; pure function, no I/O).
- [ ] **Step 4: Run — must pass.** Run: `pnpm --filter @surf/docs-bot test`. Expected: PASS (5/5).
- [ ] **Step 5: Commit.** `git add services/docs-bot && git commit -m "feat(bot): path filter (frontend-only, loop-safe)"`

---

## Task 4: Scheduler (instant + throttled behind one interface)

**Files:** Create `src/pipeline/scheduler.ts`, `tests/scheduler.test.ts`; modify `src/server.ts` (enqueue from `/webhook`; add `POST /run-now`).

**Interfaces:**
- Consumes: `PullRequestEvent`; a `run(job): Promise<void>` callback (the pipeline, wired in Task 11).
- Produces: `interface Scheduler { enqueue(event: PullRequestEvent): void; runNow(): Promise<void> }`; `InstantScheduler` (coalesces by `sourceComponent`/PR, runs on next tick, `runNow()` flushes immediately); `ThrottledScheduler` (adds a configurable debounce window + a `stabilize()` hook before release). `makeScheduler(config, run)` returns the impl per `config.schedulerMode`.

- [ ] **Step 1: Write failing tests.** `tests/scheduler.test.ts` (inject a fake `run` spy + fake timers):
  - `InstantScheduler.enqueue` then flush → `run` called once with the event.
  - Two `enqueue` calls for the same PR before flush → `run` called **once** (coalesced).
  - `runNow()` invokes `run` for the pending event immediately.
  - `ThrottledScheduler` does **not** call `run` before the debounce window elapses; calls it once after.
- [ ] **Step 2: Run — must fail.** Run: `pnpm --filter @surf/docs-bot test`. Expected: FAIL.
- [ ] **Step 3:** Implement both schedulers + `makeScheduler`; wire `server.ts` to `enqueue` relevant events and expose `POST /run-now` → `scheduler.runNow()`.
- [ ] **Step 4: Run — must pass.** Run: `pnpm --filter @surf/docs-bot test`. Expected: PASS.
- [ ] **Step 5: Commit.** `git add services/docs-bot && git commit -m "feat(bot): swappable scheduler (instant + throttled) + run-now"`

---

## Task 5: Git diff extraction

**Files:** Create `src/git/diff.ts`, `tests/diff.test.ts`.

**Interfaces:**
- Produces: `getDiff(mergedSha: string, repoRoot: string): Promise<Array<{ path: string; patch: string }>>` — uses `simple-git` to diff `mergedSha` against its first parent, returns per-file patches **filtered to the watched UI globs** (reuses `isRelevant`'s glob set).

- [ ] **Step 1: Write failing test.** `tests/diff.test.ts`: create a temp git repo in a fixture dir, commit a baseline `SharkMitigationCard.tsx`, commit a change adding a `triggerSiren` button, then `getDiff(headSha, tmpRepo)` returns one entry whose `path` ends `SharkMitigationCard.tsx` and whose `patch` contains `triggerSiren`.
- [ ] **Step 2: Run — must fail.** Run: `pnpm --filter @surf/docs-bot test`. Expected: FAIL.
- [ ] **Step 3:** Implement `getDiff` with `simple-git` (`git.diff([`${sha}^`, sha, '--', ...globs])` or diff + filter).
- [ ] **Step 4: Run — must pass.** Run: `pnpm --filter @surf/docs-bot test`. Expected: PASS.
- [ ] **Step 5: Commit.** `git add services/docs-bot && git commit -m "feat(bot): git diff extraction filtered to UI paths"`

---

## Task 6: Context aggregator + fixtures (provenance)

**Files:** Create `src/context/source.ts`, `src/context/fixtures/*` (3 sources + data), `fixtures/*`, `tests/context.test.ts`.

**Interfaces:**
- Consumes: `PullRequestEvent`; `@surf/types` `ContextRef`.
- Produces: `interface ContextSource { fetch(pr: PullRequestEvent): Promise<ContextRef[]> }`; `FixtureJiraSource` / `FixtureSlackSource` / `FixtureConfluenceSource` (read the local fixtures, key off ticket refs in the PR body, e.g. `SURF-142`); `aggregateContext(pr, sources): Promise<ContextRef[]>` (concatenate, dedupe by `ref`).

**Fixture content (exact intent):** `jira-SURF-142.json` — title "Add one-press Emergency Shark Siren to mitigation panel", body explaining lifeguards need instant zone-wide evacuation; `slack-surf-safety.json` — a #surf-safety thread agreeing the siren must be one tap; `confluence-shark-runbook.md` — the official runbook step referencing the siren. Each maps to a `ContextRef` with `kind`, `ref`, `url`, `excerpt`.

- [ ] **Step 1: Write failing tests.** `tests/context.test.ts`: with a PR whose `body` references `SURF-142`, `aggregateContext` returns refs including `{kind:'jira', ref:'SURF-142'}`, `{kind:'slack', ref:'#surf-safety'}`, `{kind:'confluence', ...}`, each with a non-empty `excerpt`; deduped (no duplicate `ref`).
- [ ] **Step 2: Run — must fail.** Run: `pnpm --filter @surf/docs-bot test`. Expected: FAIL.
- [ ] **Step 3:** Author the fixtures + implement the three sources + `aggregateContext`.
- [ ] **Step 4: Run — must pass.** Run: `pnpm --filter @surf/docs-bot test`. Expected: PASS.
- [ ] **Step 5: Commit.** `git add services/docs-bot && git commit -m "feat(bot): context aggregator + Jira/Slack/Confluence fixtures"`

---

## Task 7: Claude diff analyzer (Opus 4.8, structured output)

**Files:** Create `src/claude/client.ts`, `src/claude/schemas.ts`, `src/claude/prompts.ts`, `src/claude/analyzeDiff.ts`.

**Interfaces:**
- Consumes: the diff (Task 5), `ContextRef[]` (Task 6), the current `DocsManifest` (to know existing docs).
- Produces: `analyzeDiff(input): Promise<DiffAnalysis>` where `DiffAnalysis` (zod in `schemas.ts`) = `{ docId: string; targetRoute: string; structuralChange: string; humanIntent: string; severity: Severity }`. Uses `client.messages.parse({ model: "claude-opus-4-8", max_tokens: 16000, thinking: {type:"adaptive"}, output_config: { effort: "high", format: zodOutputFormat(DiffAnalysisSchema) }, messages: [...] })` and returns `parsed_output`.

**Behavior:** the prompt gives Claude the diff, the context excerpts, and the list of existing doc ids/sourceComponents; it returns which doc the change maps to (`shark-mitigation`), what structurally changed ("added `Emergency Shark Siren` action button wired to `triggerSiren()`"), the human intent (synthesized from Jira/Slack), and a severity (`critical` for the siren).

- [ ] **Step 1:** Build `client.ts` (singleton `new Anthropic()`), `schemas.ts` (`DiffAnalysisSchema`), `prompts.ts` (analyzer prompt + the Upwind tone/style-guide string used here and by the writer), `analyzeDiff.ts`.
- [ ] **Step 2: Verify (integration, requires `ANTHROPIC_API_KEY`).** A throwaway script (or `tests/analyzeDiff.live.test.ts`, skipped without a key) feeds the demo siren diff + fixtures and asserts `parsed_output.docId === "shark-mitigation"` and `severity === "critical"`, and that `structuralChange` mentions the siren button.
- [ ] **Step 3: Verify build/lint.** Run: `pnpm --filter @surf/docs-bot build`. Expected: compiles.
- [ ] **Step 4: Commit.** `git add services/docs-bot && git commit -m "feat(bot): Claude diff analyzer (Opus 4.8, structured output)"`

---

## Task 8: Visual capture (Playwright) + Claude vision check (Sonnet 4.6)

**Files:** Create `src/capture/capture.ts`, `src/claude/visionCheck.ts`, `playwright.config.ts`; extend `src/claude/schemas.ts` (`VisionVerdictSchema`).

**Interfaces:**
- Consumes: `DiffAnalysis.targetRoute`, `Config.surfConsoleUrl`.
- Produces: `interface ScreenshotCapture { capture(target: { route: string; selector?: string }): Promise<{ pngBuffer: Buffer; alt: string }> }`; `PlaywrightCapture` (launches chromium, navigates to `surfConsoleUrl + route`, optionally scopes to `selector`, screenshots); `visionCheck(pngBuffer, claimedChange): Promise<VisionVerdict>` where `VisionVerdict = { showsChange: boolean; note: string }` — Sonnet 4.6 with the screenshot as a base64 `image` block + a text question, via `messages.parse` + `zodOutputFormat`.

- [ ] **Step 1:** Add `playwright` + run `pnpm --filter @surf/docs-bot exec playwright install chromium`. Implement `PlaywrightCapture` and `visionCheck`.
- [ ] **Step 2: Verify capture (integration).** With `apps/surf-console` running (`pnpm --filter surf-console dev`) **on the after-state** (siren present), a script captures `/` scoped to the Shark panel selector → writes a PNG locally; confirm the file opens and shows the siren button.
- [ ] **Step 3: Verify vision check (integration, needs key).** Feed that PNG + claim "an Emergency Shark Siren button was added" → `showsChange === true`. Feed a before-state PNG → `showsChange === false`.
- [ ] **Step 4: Commit.** `git add services/docs-bot && git commit -m "feat(bot): Playwright capture + Claude vision check (Sonnet 4.6)"`

---

## Task 9: Claude doc writer (Opus 4.8, Upwind tone)

**Files:** Create `src/claude/writeDoc.ts`; extend `src/claude/schemas.ts` (`DocDraftSchema`).

**Interfaces:**
- Consumes: the existing `Doc` (from manifest), `DiffAnalysis`, `ContextRef[]`, the captured `Screenshot` metadata.
- Produces: `writeDoc(input): Promise<DocDraft>` where `DocDraft = { bodyMarkdown: string; changeSummary: ChangeSummary; title: string }` — Opus 4.8 via `messages.parse` + `zodOutputFormat(DocDraftSchema)`, prompted with the Upwind style guide (from `prompts.ts`), instructed to embed the screenshot via a markdown image reference and weave in the Jira/Slack intent. Caller assembles the full `Doc` (bump `version`, set `updatedAt`, attach `screenshots`, set `lastChange = changeSummary`).

- [ ] **Step 1:** Implement `DocDraftSchema` + `writeDoc.ts` (reuse the style-guide string from Task 7).
- [ ] **Step 2: Verify (integration, needs key).** Feed the v3 shark doc + the demo `DiffAnalysis` + fixtures + screenshot meta → assert `bodyMarkdown` contains "Emergency Shark Siren" and a step about pressing it, references the screenshot path, and reads in Upwind's tone; `changeSummary.intentSource` cites Jira/Slack.
- [ ] **Step 3: Verify build.** Run: `pnpm --filter @surf/docs-bot build`. Expected: compiles.
- [ ] **Step 4: Commit.** `git add services/docs-bot && git commit -m "feat(bot): Claude doc writer (Opus 4.8, Upwind tone)"`

---

## Task 10: Publisher (write files, update manifest+changelog, commit)

**Files:** Create `src/publish/publisher.ts`, `tests/publisher.test.ts`.

**Interfaces:**
- Consumes: assembled `Doc`, `Screenshot` PNG buffer, `ChangeEntry`; `Config.docsContentDir`.
- Produces: `publish(input): Promise<void>` — writes `content/docs/<docId>/index.md` + the screenshot PNG, updates `manifest.json` (replace the doc, keep ordering) and `changelog.json` (prepend the new `ChangeEntry`), then `git add` + commit with `docs: regenerate <docId> (v<n>) [skip-bot]`. Transaction-like: write to temp + rename, and only commit after all writes succeed. Exposes a `notify` hook (no-op in Plan 2; wired in Plan 3).

- [ ] **Step 1: Write failing tests.** `tests/publisher.test.ts` (point `docsContentDir` at a temp dir seeded with a v3 manifest/changelog):
  - after `publish`, `manifest.json` parses to a `DocsManifest` whose `shark-mitigation` doc is `version 4` with a non-empty `screenshots` array;
  - `changelog.json` first entry is the new `critical` `ChangeEntry` with the provenance `contextRefs`;
  - the markdown file and PNG exist on disk;
  - **`lib/content.ts`'s `getDoc('shark-mitigation')` shape is satisfiable** — assert the written manifest validates against the `@surf/types` `Doc` shape (the contract check that keeps Plan 1's reader working).
- [ ] **Step 2: Run — must fail.** Run: `pnpm --filter @surf/docs-bot test`. Expected: FAIL.
- [ ] **Step 3:** Implement `publisher.ts`.
- [ ] **Step 4: Run — must pass.** Run: `pnpm --filter @surf/docs-bot test`. Expected: PASS.
- [ ] **Step 5: Commit.** `git add services/docs-bot && git commit -m "feat(bot): publisher writes docs + manifest/changelog + commit"`

---

## Task 11: Pipeline orchestration + the demo PR asset

**Files:** Create `src/pipeline/runJob.ts`; modify `src/index.ts` (wire `makeScheduler(config, runJob)`); create the demo change on a branch.

**Interfaces:**
- Consumes: every stage above.
- Produces: `runJob(event: PullRequestEvent): Promise<void>` = `getDiff → aggregateContext → analyzeDiff → capture → visionCheck (halt + log if !showsChange) → writeDoc → assemble Doc + ChangeEntry → publish`. Each stage logs a visible progress line (`PR detected → relevant`, `Pulling context…`, `Analyzing diff…`, `Capturing UI…`, `Vision check ✓`, `Writing doc…`, `Publishing`) — these are the on-stage narration from the demo script (architecture spec §10).

- [ ] **Step 1:** Implement `runJob.ts` with typed-error handling per stage (a failure logs the job id + stage and aborts that job only; manifest untouched on mid-pipeline failure). Wire it into `index.ts` via `makeScheduler`.
- [ ] **Step 2: Prepare the demo change.** On a branch `demo/shark-siren`, edit `apps/surf-console/components/console/SharkMitigationCard.tsx` to add the red **Emergency Shark Siren** button (the after-state — reproduce `design-mock` lines 290 + the `sirenActive` banner 273–278 and zone-status flip). Commit on the branch; do **not** merge yet. The PR body references `SURF-142`.
- [ ] **Step 3: Verify end-to-end locally (manual, needs key).** With `surf-console` running, set `SCHEDULER_MODE=instant`; POST a synthesized merge payload for the `demo/shark-siren` change to `/webhook` (or call `/run-now`). Expected: the pipeline runs, logs each stage, and `content/docs/shark-mitigation/` updates to v4 with a fresh screenshot + a critical changelog entry; reloading `/docs/shark-mitigation` in the portal shows the new doc.
- [ ] **Step 4: Commit (engine only).** `git add services/docs-bot && git commit -m "feat(bot): pipeline orchestration end-to-end"` (keep the `demo/shark-siren` branch unmerged for the live demo).

---

## Task 12: Live trigger wiring (GitHub webhook tunnel)

**Files:** Create `services/docs-bot/README.md` (run + tunnel instructions).

- [ ] **Step 1:** Document the demo wiring: run the bot (`SCHEDULER_MODE=instant`), expose `/webhook` via a tunnel (`smee.io` or `ngrok http 4000`), register the tunnel URL + `GITHUB_WEBHOOK_SECRET` as a repo webhook (PR events).
- [ ] **Step 2: Verify the real loop (manual).** Merge the `demo/shark-siren` PR on GitHub → webhook fires → bot regenerates → the publish commit appears → portal shows v4. (This is steps 1–11 of the demo script.)
- [ ] **Step 3: Commit + push.** `git add services/docs-bot && git commit -m "docs(bot): webhook tunnel + run instructions; Plan 2 complete" && git push origin main`

---

## Self-Review

**Spec coverage (architecture spec §7 pipeline + §10 demo):** webhook → Task 2; filter → Task 3; scheduler (instant/throttled downgrade) → Task 4; context aggregator + fixtures (provenance) → Task 6; Claude diff analysis → Task 7; Playwright capture + vision check (Computer-Use downgrade) → Task 8; doc writer (Upwind tone) → Task 9; publisher (commit + no-loop) → Task 10; orchestration + demo narration + demo PR → Task 11; live webhook loop → Task 12. ✓ Deferred by design: RAG index + live notification + replay safety nets → Plan 3 (publisher exposes the `notify` hook + Task 10 leaves an index-rebuild hook).

**Placeholder scan:** none — Claude/Playwright stages give interface + behavior + integration-verification; pure stages are test-first with concrete assertions; design reproduction cites exact `design-mock` line ranges.

**Type consistency:** `PullRequestEvent`/`Doc`/`ChangeEntry`/`ContextRef`/`Severity` are the `@surf/types` names throughout; `DiffAnalysis`/`DocDraft`/`VisionVerdict` are engine-internal zod schemas defined in `schemas.ts` and consumed by `runJob`. Publisher output is contract-checked against `@surf/types` in Task 10's test (keeps Plan 1's `lib/content.ts` valid).

**Scope:** Plan 2 produces a working engine that turns a real PR into a regenerated, committed doc — demoable on its own. RAG and demo safety nets are Plan 3.

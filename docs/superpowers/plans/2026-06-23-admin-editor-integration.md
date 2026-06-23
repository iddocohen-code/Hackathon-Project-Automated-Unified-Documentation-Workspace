# Admin Editor Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]` checkboxes.

**Goal:** Land the existing `surf-docs-work` admin manual-editor feature onto the current product (`main`, post–Plan 3) as a new `admin-editor` branch, and surface it with in-product entry points: a discreet **Sign-in** link and an **admin-only "Edit this doc"** button on each doc page.

**Architecture:** The admin feature already exists and was proven working on `surf-docs-work` (login gate, `/admin` workspace, markdown editor, atomic save through the bot). We **reuse that code verbatim** where it's additive, and **re-apply the publisher's `saveManualEdit` onto `main`'s Plan-3 publisher** (which has diverged). Then add two UI entry points. Model A (co-located): the Next app calls the bot at `BOT_INTERNAL_URL`; the bot's publisher remains the single writer of `content/docs`.

**Tech stack:** Next.js App Router (server components + middleware, Web Crypto auth), Fastify bot (`/admin/save`, x-admin-token), `@surf/types`. No new runtime deps.

## Global Constraints
- **Publisher HARD contract is preserved** (sole writer; manifest `bodyMarkdown:""`; categories/`docCount` verbatim; other docs untouched; changelog prepend; `[skip-bot]` commit). `saveManualEdit` must reuse main's atomic helpers and honor this.
- **Manual save semantics (Tracked-B):** bump `version`, append an **`info`** `ChangeEntry`, local git commit; **skips** the AI/screenshot/PR pipeline. Per-doc lock (`withLock`) to serialize saves. Optimistic concurrency via `baseVersion` → `409` on mismatch.
- **Auth:** `/admin/:path*` gated by middleware (signed `admin_session` cookie, 12h). `ADMIN_PASSWORD` + `ADMIN_SESSION_SECRET` (portal); `BOT_ADMIN_TOKEN` shared portal↔bot (`x-admin-token`); empty token ⇒ bot endpoint disabled.
- **The "Edit this doc" button renders ONLY for an authenticated admin** (server-side cookie verification via `verifySession`), never for normal visitors. The `/admin` route stays middleware-gated regardless.
- TypeScript NodeNext (`.js` on bot relative imports); vitest. Commits authored as the repo owner, **no Claude signature / no `Co-Authored-By`**.
- Reference (the proven implementation): `git show surf-docs-work:<path>` for any admin file.

---

### Task 1: Branch + bring the additive admin files (controller-mechanical)
**Files (copied from `surf-docs-work`, all NEW on main — no conflict):** `apps/surf-console/app/admin/**`, `apps/surf-console/components/admin/**`, `apps/surf-console/lib/auth.ts`, `apps/surf-console/lib/auth.test.ts`, `apps/surf-console/middleware.ts`, `services/docs-bot/src/publish/lock.ts`, `services/docs-bot/tests/admin-endpoint.test.ts`, `services/docs-bot/tests/manual-edit.test.ts`, `docs/superpowers/specs/2026-06-23-admin-editor-design.md`.
- [ ] Create `admin-editor` off `main`; `git checkout surf-docs-work -- <each path>`; commit `chore(admin): bring admin-editor files onto main (additive)`.
- [ ] Verify: `git status` shows only additions; the 4 shared bot files are still main's versions (untouched yet).

### Task 2: Bot-side integration onto the Plan-3 code
**Files:** Modify `services/docs-bot/src/config.ts`, `services/docs-bot/src/server.ts`, `services/docs-bot/src/index.ts`, `services/docs-bot/src/publish/publisher.ts`.
**Re-apply (reference = `git show surf-docs-work:<file>`):**
- `config.ts`: add `adminToken` (env `BOT_ADMIN_TOKEN`, default `''` = disabled), wired in `loadConfig()` (preprocess pattern).
- `server.ts`: add `AdminSavePayload`/`AdminSaveResult` types + `BuildAppOptions.adminSave?`; add `POST /admin/save` — constant-time `x-admin-token` check vs `config.adminToken` (503 if unset, 401 if mismatch), delegates to the injected `adminSave`.
- `index.ts`: import `saveManualEdit` + `withLock`; define the `adminSave` handler (load manifest → `baseVersion` check (409 on mismatch) → build updated `Doc` + `info` `ChangeEntry` → `withLock(docId, () => saveManualEdit(...))`); pass it into `buildApp`.
- `publisher.ts`: add **`saveManualEdit({ doc, changeEntry, docsContentDir })`** that reuses **main's** existing atomic helpers (`atomicWriteFile`, manifest surgical-replace, changelog prepend, commit) to write `index.md` + bump the manifest entry (`bodyMarkdown:""`) + prepend the `info` entry + `[skip-bot]` commit. Do NOT touch `publish()`'s multi-PNG/video path; do NOT regress the HARD contract.
- [ ] Step 1: re-apply the four edits (publisher last, carefully).
- [ ] Step 2: make `tests/admin-endpoint.test.ts` + `tests/manual-edit.test.ts` pass (adapt them only if main's signatures legitimately differ; do not weaken assertions). `pnpm --filter @surf/docs-bot build` + `test` green (pre-existing live tests may be key-gated/ignored).
- [ ] Step 3: commit `feat(bot): admin manual-save on the Plan-3 publisher (saveManualEdit + /admin/save)`.

### Task 3: In-product entry points (the new work)
**Files:** Modify `apps/surf-console/components/docs/DocView.tsx` (or the doc page server component) and a shell location for the sign-in link (`components/shell/TopBar.tsx`); create a tiny `apps/surf-console/lib/adminSession.ts` server helper if useful.
**Produces:**
- A server-side check `isAdmin()` = read `admin_session` cookie (`next/headers`) + `verifySession(process.env.ADMIN_SESSION_SECRET, token)`.
- On the doc page: when `isAdmin()` is true, render an **"Edit this doc"** button → `next/link` to `/admin?doc=<docId>`. When false, render nothing (not hidden via CSS — not rendered).
- A **discreet "Sign in"** entry (small link, e.g. in TopBar or footer) → `/admin` (middleware redirects to `/admin/login`). Optional: when already admin, show "Admin" instead.
- [ ] Step 1: `isAdmin()` helper + Edit button (admin-only) on the doc page + Sign-in link.
- [ ] Step 2: `pnpm --filter surf-console build`; reason through: anonymous → no Edit button; signed-in → Edit button deep-links to the right doc.
- [ ] Step 3: commit `feat(docs): admin-only "Edit this doc" button + sign-in entry`.

### Task 4: Env docs + full-flow verification
**Files:** root `.env.example` (+ `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `BOT_ADMIN_TOKEN`, `BOT_INTERNAL_URL`).
- [ ] Run bot (`BOT_ADMIN_TOKEN=…`) + portal (`ADMIN_PASSWORD=… ADMIN_SESSION_SECRET=… BOT_ADMIN_TOKEN=…`). Verify: anonymous doc page has no Edit button; `/admin`→login; correct password → session; doc page now shows Edit; click → `/admin?doc=<id>`; edit + save → bot returns 200, doc `version` bumps, `info` changelog entry, local commit; stale `baseVersion` → 409.
- [ ] `pnpm build` + `pnpm lint` green workspace-wide. Commit `docs: admin editor env + integration verification`.

---

## Self-Review
- Coverage: feature reused (Task 1), re-seated on Plan-3 publisher without contract regression (Task 2), surfaced with admin-only entry points (Task 3), env+verify (Task 4).
- Risk: publisher.ts is the one delicate file — `saveManualEdit` is additive and must reuse main's helpers, never alter `publish()`.
- Security: Edit button server-gated on a verified session; `/admin` middleware-gated; bot endpoint token-gated. Defense in depth.

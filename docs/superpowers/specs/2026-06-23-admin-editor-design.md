# Admin Editor + Auth Gate — Design Spec

**Date:** 2026-06-23
**Project:** Upwind Surf Docs Workspace
**Status:** Approved design, implementation in progress
**Scope:** Admin Mode, Phase 1 — authenticated manual content editor only

---

## 1. Problem

The docs portal is currently regenerated only by the automated bot pipeline (webhook →
AI analysis → Playwright screenshot → publish). There is no way for an operator to make a
quick, manual correction to a doc's prose without pushing a code change and waiting for the
full pipeline. We need a restricted, browser-based editor that lets a single administrator
view the doc tree, open a doc, edit its markdown, and save — while preserving every integrity
guarantee of the existing system.

## 2. Solution (one sentence)

A password-gated `/admin` workspace in the existing Next.js app that lets the operator edit
a doc's markdown and save it; the save **bypasses the bot/PR/AI/screenshot pipeline** but
still flows through the bot's atomic publisher core to write to disk, bump the version, log
an `info` change in `changelog.json`, and produce a clean local `git commit`.

## 3. Locked decisions

| Decision | Value |
|---|---|
| **Runtime model** | **Model A** — co-located internal ops tool: admin UI runs on the same machine as the bot + repo checkout; reads `content/docs/` locally, calls the bot at `BOT_INTERNAL_URL` (default `http://localhost:4000`). |
| **Repo scope** | **Scope A** — this repo only (no external repos). *(Bot-trigger UI deferred; see §10.)* |
| **Write integrity** | **Single writer** — every mutation funnels through the bot's publisher; the Next app never writes `content/docs/` directly. |
| **Edit semantics** | **Tracked (B)** — a manual save bumps `version`, appends an `info` `ChangeEntry`, and commits. It skips the webhook → AI → screenshot pipeline only. |
| **Session TTL** | 12h fixed. |
| **Editor** | Plain `<textarea>` for v1 (dependency-free); CodeMirror deferred. |

## 4. Non-goals (deferred to later tracks)

- Bot-trigger UI: repo/branch dropdown, commit-diff viewer, "Trigger Bot Update", progress streaming.
- External / multi-repo support.
- Multi-user accounts, roles, SSO, password reset.
- Category create/edit/delete; new-doc creation; doc deletion. (v1 edits existing docs' prose + `title` only.)

## 5. Architecture & file map

```
apps/surf-console/
├── middleware.ts                         # NEW: gate /admin/:path* (Edge runtime, Web Crypto)
├── lib/
│   ├── content.ts                        # REUSED unchanged (read path)
│   └── auth.ts                           # NEW: sign/verify session cookie (HMAC via Web Crypto)
├── app/
│   ├── admin/
│   │   ├── layout.tsx                    # NEW: AdminShell wrapper; force-dynamic
│   │   ├── page.tsx                      # NEW: workspace server component
│   │   ├── login/page.tsx                # NEW: login page
│   │   └── api/
│   │       ├── login/route.ts            # NEW: POST set signed cookie
│   │       ├── logout/route.ts           # NEW: POST clear cookie
│   │       └── docs/[slug]/save/route.ts # NEW: proxy → bot, attaches BOT_ADMIN_TOKEN
│   └── ...
├── components/
│   ├── docs/Markdown.tsx                 # NEW (tiny): shared ReactMarkdown+remarkGfm config
│   ├── docs/DocView.tsx                  # MODIFIED: render via shared Markdown.tsx
│   └── admin/                            # NEW: AdminShell, DocTree, MarkdownEditor,
│                                         #      EditorToolbar, LivePreview, SaveButton
services/docs-bot/
└── src/
    ├── server.ts                         # MODIFIED: + POST /admin/save (token-gated)
    ├── index.ts                          # MODIFIED: pass adminToken + saveManualEdit wiring
    ├── config.ts                         # MODIFIED: + adminToken from env
    └── publish/
        ├── publisher.ts                  # REFACTOR: extract commitDocUpdate; add saveManualEdit
        └── lock.ts                       # NEW: per-docId mutex (shared by runJob + manual save)
```

Nothing in the webhook → `runJob` path changes behaviour; `publish()`'s public contract is preserved.

## 6. Auth gate

**Env (gitignored):**
- `apps/surf-console/.env.local`: `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `BOT_ADMIN_TOKEN`, `BOT_INTERNAL_URL` (default `http://localhost:4000`).
- `services/docs-bot/.env`: `BOT_ADMIN_TOKEN` (same value — the Next↔bot shared secret).

**`lib/auth.ts`** (Web Crypto, runs on Edge + Node):
- `signSession(ttlMs)` → cookie value `base64url(JSON{exp}) + "." + base64url(HMAC-SHA256(payload, ADMIN_SESSION_SECRET))`.
- `verifySession(cookieValue)` → re-compute HMAC, constant-time compare, check `exp > now`. Returns boolean.

**`middleware.ts`** (Edge):
- `matcher: ['/admin/:path*']`.
- Unauthenticated allowlist: `/admin/login`, `/admin/api/login`.
- Reads `admin_session` cookie → `verifySession`. Valid → `next()`. Invalid:
  - path under `/admin/api/*` → `401 {error:'unauthorized'}`
  - otherwise → 302 redirect to `/admin/login`.

**Cookie attributes:** `HttpOnly; SameSite=Lax; Secure; Path=/admin`. TTL 12h.

**Login/logout:**
- `POST /admin/api/login {password}` → constant-time compare to `ADMIN_PASSWORD` → set cookie, `200 {ok}`; mismatch → `401`.
- `POST /admin/api/logout` → clear cookie.

**Both doors:** middleware protects UI + `/admin/api/*`. The bot's `POST /admin/save` independently requires `x-admin-token: BOT_ADMIN_TOKEN` (attached server-side by the proxy), so the single-writer can't be driven unauthenticated even via direct `:4000` access.

## 7. Wireframes

**Login (`/admin/login`)** — centered Upwind card: logo, password field, Sign in button (`--action-primary`), inline error on `401`.

**Workspace (`/admin`)** — dedicated `AdminShell` (TopBar with `Admin` badge + Logout; not the console Sidebar). Three panes:
- **Left — DocTree:** categories → docs from `getManifest()`/`getCategories()`, nested by `DocCategory.parentId`. Selecting a doc routes/loads it.
- **Center — Editor:** plain `<textarea>` bound to the doc body; header breadcrumb (category / title), `vN → v(N+1)`, dirty dot; optional **change note** field; **Save** button.
- **Right — LivePreview:** renders the current buffer through the **same** `Markdown.tsx` config as `DocView` (WYSIWYG parity with the portal).
- Save success → reuse the existing `LiveToast`/`NotificationProvider` ("Saved v4").

## 8. Read / write paths

**READ** (reuse `lib/content.ts`, no new read code): `app/admin/layout.tsx` + `page.tsx` are server components behind the gate; they call `getCategories()`/`getManifest()` (tree) and `getDoc(slug)` (selected doc). Admin routes set `export const dynamic = 'force-dynamic'` to read fresh from disk per request.

**WRITE** (all mutations → bot = single writer):

| Hop | Endpoint | Auth | Body |
|---|---|---|---|
| Editor → Next | `POST /admin/api/docs/[slug]/save` | session cookie (middleware) | `{ bodyMarkdown, title?, changeNote?, baseVersion }` |
| Next → Bot | `POST {BOT_INTERNAL_URL}/admin/save` | `x-admin-token` (added server-side) | `{ docId, bodyMarkdown, title?, changeNote?, baseVersion }` |

**Bot `POST /admin/save`:**
1. Constant-time check `x-admin-token` → `401` on mismatch.
2. Acquire per-`docId` lock.
3. Load `manifest.json`; find doc. `baseVersion !== currentVersion` → `409 Conflict`.
4. Assemble updated `Doc`: `version+1`, `updatedAt=now`, **screenshots carried over unchanged**, `lastChange = { headline:"Manual edit", detail: changeNote ?? "", intentSource:"Manual admin edit" }`, `title` if provided.
5. Build `ChangeEntry`: `severity:'info'`, `prUrl:''`, `contextRefs:[]`, no `screenshotDiff`, `createdAt=now`, `id: chg-...`.
6. Call `saveManualEdit(...)` → atomic write + manifest merge + changelog prepend + commit.
7. Release lock → `200 {ok, version}`.

**UI error mapping:** `401`→bounce to login; `409`→"This doc changed underneath you — reload"; `5xx`→"Save failed, nothing was written" (true — publisher is atomic).

## 9. `publisher.ts` refactor

Extract the screenshot-agnostic atomic transaction; keep two thin entry points.

```ts
// NEW internal — shared atomic transaction, no AI/PNG concepts
async function commitDocUpdate(args: {
  doc: Doc;                 // assembled; doc.screenshots already correct
  changeEntry: ChangeEntry;
  docsContentDir: string;
  commitMessage: string;
  commitFn?: CommitFn;
}): Promise<void>
//   1. atomicWriteFile(<docId>/index.md, doc.bodyMarkdown)
//   2. surgical manifest merge (replace one entry, bodyMarkdown:'', keep categories + others)
//   3. prepend changeEntry to changelog.json
//   4. commitFn([paths], commitMessage)

// EXISTING bot path — behaviour unchanged
export async function publish(input: PublishInput): Promise<void> {
  // PNG write (mkdir + atomicWriteFile png; derivePngInfo → webPath; build manifest screenshots)
  // then commitDocUpdate({ doc, changeEntry, docsContentDir,
  //   commitMessage: `docs: regenerate ${doc.id} (v${doc.version}) [skip-bot]`, commitFn })
}

// NEW admin path — no pngBuffer, no screenshotsPublicDir, no AI vars
export async function saveManualEdit(input: {
  doc: Doc;                 // screenshots = existing ones from manifest
  changeEntry: ChangeEntry;
  docsContentDir: string;
  commitFn?: CommitFn;
}): Promise<void> {
  await commitDocUpdate({ ...input,
    commitMessage: `docs: manual edit ${input.doc.id} (v${input.doc.version}) [skip-bot]` });
}
```

- No AI/Playwright variables reach `saveManualEdit` — only the assembled `Doc` (carrying existing screenshots) + the `ChangeEntry`.
- PNG write stays isolated in `publish()`; `commitDocUpdate` persists whatever `doc.screenshots` already holds.
- `[skip-bot]` preserved; `content/docs/**` still fails `isRelevant` → no re-trigger (no-loop guard intact).
- Same `atomicWriteFile` tmp+rename + same surgical manifest merge → identical non-corruption guarantees.

**Concurrency (`publish/lock.ts`):** `Map<docId, Promise>` mutex. Both `runJob`'s `publish` and `/admin/save` `await withLock(docId, fn)` → serialized per doc; different docs run in parallel.

## 10. Future tracks (presented, not built)

- **Bot-trigger UI** behind the same `/admin` gate: branch dropdown (this repo), commit-diff view, "Trigger Bot Update" → a new parameterized bot endpoint feeding `runJob` via the scheduler, with SSE/poll progress matching `LiveToast`.
- External/multi-repo support (requires per-repo running deploys for the screenshot stage).
- Real multi-user auth at the same middleware seam (Model B).

## 11. Testing

- **Unit (pure):** `lib/auth.ts` (sign/verify, expiry, tamper, wrong secret); `commitDocUpdate` + `saveManualEdit` (temp dir: version bump, manifest keeps other docs + categories, changelog prepends `info`, screenshots preserved, `index.md` written, `[skip-bot]` in message); per-doc lock serialization; `409` on stale `baseVersion`.
- **Integration:** login → cookie → protected fetch (401 without cookie); save round-trip Next → bot → disk → reload shows new version; conflict path returns 409.

## 12. Chokepoints preserved

`@surf/types` (shared shapes), `publish()`/`commitDocUpdate` (only writer), `lib/content.ts` (only reader), `isRelevant` (no-loop gate). The admin feature goes *through* these, never around them.

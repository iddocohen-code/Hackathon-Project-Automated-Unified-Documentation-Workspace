# Demo Runbook — Automated & Unified Documentation Workspace

The hero demo: **merge a PR that adds the "Emergency Shark Siren" button → the docs-bot regenerates the Shark Mitigation doc to v4** (with default + activated screenshots, a looping interaction clip, and a 🔴 critical "What's New" entry that pops a live toast), then **RAG search** answers "How do I trigger the shark siren?" with a cited deep-link.

> ⚠️ **API credits (2026-06-23):** the Anthropic key in `services/docs-bot/.env` is currently **out of credits** (`400 credit balance too low`). The **LIVE rung** (real Claude analysis + vision + writing) needs a credit top-up. The **REPLAY rung** (Rung 3 below) re-publishes pre-captured real assets with **no Claude/Playwright calls** and is the demo-safe path until credits are replenished. All per-task live verifications passed before depletion.

---

## 0. Topology — what runs where

| # | Process | Command (from repo root) | Port | Branch / dir |
|---|---|---|---|---|
| A | **Docs portal** (Next.js) | `pnpm --filter surf-console dev` | 3000 | **after-state** `demo/shark-siren` (so the screenshot/clip capture the siren UI) |
| B | **Docs-bot** (Fastify engine) | `cd services/docs-bot && pnpm dev` | 4000 | `plan-3-rag` (or merged `main`) |
| C | **smee forwarder** (live rung only) | `npx smee-client --url <smee-channel> --target http://localhost:4000/webhook` | — | n/a |

- The portal runs on the **after-state** branch via a git worktree (e.g. `git worktree add ../hak-demo-portal demo/shark-siren`) so capture sees the siren; the bot + its content writes target the **before-state** baseline (shark v3) that the merge regenerates.
- The **publisher commits locally and does NOT push** — the local portal (next dev) reflects the new v4 immediately.

## 1. Environment matrix

**Bot** (`services/docs-bot/.env`, gitignored):
```
ANTHROPIC_API_KEY=sk-ant-...        # REQUIRED for LIVE rung (top up credits)
GITHUB_WEBHOOK_SECRET=<64 hex>      # for live webhook HMAC
SCHEDULER_MODE=instant
SURF_CONSOLE_URL=http://localhost:3000
DOCS_CONTENT_DIR=<repo>/apps/surf-console/content/docs
SCREENSHOTS_PUBLIC_DIR=<repo>/apps/surf-console/public/docs-screenshots
CORS_ORIGIN=http://localhost:3000
RETRIEVER_MODE=keyword
REPLAY_MODE=false                   # set true for Rung 3 (replay)
```
**Portal** (root `.env`):
```
BOT_URL=http://localhost:4000              # server-side search proxy (never exposed to browser)
NEXT_PUBLIC_BOT_URL=http://localhost:4000  # browser EventSource (SSE live toast) — needs CORS
```

## 2. Pre-flight

1. `main` / bot content is **before-state**: shark doc **v3**, no siren step. Verify: `grep -c "Emergency Shark Siren" apps/surf-console/content/docs/shark-mitigation/index.md` → `0`.
2. `pnpm build && pnpm lint` green.
3. Warm the engine: `pnpm --filter @surf/docs-bot warmup` → ✓ for Claude pings (LIVE rung only — needs credits), chromium, index rebuild. (`/health` ✓ once the bot is up.)
4. Start A + B (and C for the live rung). Open the portal `/docs` — confirm the SSE is connected (DevTools → Network → `events` stays open) and the gift badge shows the unread count.
5. `demo/shark-siren` is **unmerged**.

## 3. The fallback ladder (run the highest rung that works)

### Rung 1 — Live GitHub merge (needs credits + webhook)
1. Register the smee channel + `GITHUB_WEBHOOK_SECRET` as a repo webhook (**Pull requests** event). **Requires repo admin.**
2. Open a PR from `demo/shark-siren` → `main` and **Merge** it.
3. GitHub fires `pull_request closed/merged` → smee → smee-client → bot `POST /webhook` → HMAC verify → resolver derives changed paths from the merge SHA → `isRelevant` → enqueue.

### Rung 2 — Local signed-webhook trigger (no repo admin)
After merging the PR (or to simulate it), POST a signed `closed/merged` payload to the bot locally — sign the JSON body with `GITHUB_WEBHOOK_SECRET` (HMAC-SHA256) and POST to `http://localhost:4000/webhook`. (Build the payload around `git rev-parse origin/main` as the merge SHA.) This bypasses the admin-only webhook registration while exercising the **same** verify → resolve → enqueue → pipeline path.

### Rung 3 — REPLAY_MODE (no credits, no Playwright) ✅ demo-safe now
1. Start the bot with `REPLAY_MODE=true`.
2. Trigger one run: `curl -XPOST localhost:4000/run-now` (or the webhook).
3. The runJob **REPLAY branch** short-circuits diff/analyze/capture/vision/write and re-publishes the canned real assets from `services/docs-bot/fixtures/replay/` (`shark-mitigation.v4.md`, `shark-default.png`, `shark-active.png`, `shark-interaction.webm`, `change-entry.json`) through the **real** publish path → commit → `onIndexRebuild` → `notify`. Stages log with a `(replay)` suffix. The portal shows v4 + both screenshots + the looping clip + the 🔴 critical entry + the live toast — **identical to a live run**.

All three rungs end in the same visible result.

## 4. The narration (what to point at)

`PR detected → Pulling context → Analyzing diff → Capturing UI (default + click→activated, + clip) → Vision check ✓ (per state) → Writing doc → Publishing → Done`, then on the portal:
- The **Shark Mitigation** doc page now reads **v4** with the siren step, **both screenshots** (default → activated), and the **looping clip**.
- **What's New** gains a 🔴 **critical** entry (unread → the gift badge bumps) and a **live toast** pops with no reload.
- Click **"I read it"** → the entry leaves the feed and the badge decrements ("Show read" reveals it under *Earlier*).
- **RAG search**: type "How do I trigger the shark siren?" → ✨ AI answer card + a cited row → "Jump to section →" scrolls to the siren step (`/docs/shark-mitigation#…`). Off-topic → graceful "couldn't find"; bot stopped → "Search engine offline".

## 5. Reset between runs (operator only — nothing on the live site)

The proven 5-step reset (history: PR-merge `239f90a` → revert `abd627a`; demo branch `bc4df68`):

1. **Restore `main` to before-state.** The PR merge lands on `origin/main`. Undo it: `git revert -m 1 <merge-sha>` and push (revert is the proven move; reset-and-force-push is the cleaner alternative).
2. **Drop the bot's local publish commit.** The publisher commits locally and does NOT push — that local `[skip-bot]` commit holds v4 + manifest + changelog + the per-state PNGs + the `.webm`. Reset it out (`git reset --hard origin/main` once `origin/main` is back to before-state) so the shark doc returns to v3.
3. **Re-create the trigger branch.** Restore `demo/shark-siren` (card-only siren change, `bc4df68`) pointing at the restored before-state `main`.
4. **Clear the portal read-state.** Wipe the localStorage key `surf.docs.readEntries` (DevTools → Application → Local Storage, or `localStorage.removeItem('surf.docs.readEntries')`) so the fresh critical entry shows as **new/unread** again and the badge reappears.
5. **Restart A + B + C** and re-run pre-flight.

## 6. Quick reference

- Warm up: `pnpm --filter @surf/docs-bot warmup`
- Manual pipeline trigger: `curl -XPOST localhost:4000/run-now`
- Search: `curl -XPOST localhost:4000/search -H 'content-type: application/json' -d '{"query":"How do I trigger the shark siren?"}'`
- SSE stream: `curl -N localhost:4000/events`
- Health: `curl localhost:4000/health`

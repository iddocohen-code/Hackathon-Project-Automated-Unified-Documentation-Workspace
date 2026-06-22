# docs-bot

`docs-bot` is an automated documentation pipeline that listens for merged GitHub pull requests, analyses what changed in the UI source code, and regenerates the corresponding documentation page using Claude. When a PR that touches `apps/surf-console/components/console/**` or related UI paths is merged, the bot fetches the merge commit, runs a diff analysis, assembles context from Jira/Slack/Confluence fixtures, captures a Playwright screenshot of the updated component, drafts a new doc via the Claude API, and commits the result directly into `apps/surf-console/content/docs/`.

## Pipeline stages

1. **Webhook** — receives the GitHub `pull_request` (closed+merged) event, verifies HMAC-SHA256 signature.
2. **Resolver** — fetches `origin` so the merge SHA is local, then runs `git diff <sha>^ <sha> --name-only` to get all changed paths.
3. **Filter** — `isRelevant()` checks whether any changed path matches the watched UI globs; publish-output paths (`content/docs/**`) are never matched (no-loop guard).
4. **Scheduler** — coalesces duplicate enqueues per PR; `instant` mode flushes on next tick, `throttled` debounces by 30 s.
5. **Context aggregator** — loads Jira, Slack, and Confluence fixtures for the affected doc target.
6. **Diff analyzer** — sends the unified diff to Claude for a structured change summary.
7. **Screenshot capture** — Playwright visits the surf-console page and captures a before/after screenshot.
8. **Doc writer** — Claude drafts the updated documentation in the Upwind tone.
9. **Publisher** — commits `index.md` + screenshot into `apps/surf-console/content/docs/` with a `[skip-bot]` trailer (no-loop guard).

## Environment variables

Copy `services/docs-bot/.env.example` to `services/docs-bot/.env` and fill in the values. `.env` is gitignored and must never be committed.

| Variable | Required | Default | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | yes | — | Anthropic API key (Claude API). |
| `GITHUB_WEBHOOK_SECRET` | yes (live) | `""` | HMAC secret shared between this bot and the GitHub webhook config. Generate with `openssl rand -hex 32`. Must be identical in both places. |
| `SCHEDULER_MODE` | no | `instant` | `instant` (demo) or `throttled` (production, 30 s debounce). |
| `SURF_CONSOLE_URL` | no | `http://localhost:3000` | Base URL of the running surf-console for Playwright screenshot capture. |
| `DOCS_CONTENT_DIR` | no | `apps/surf-console/content/docs` | Absolute or repo-relative path to the docs content directory. |
| `PORT` | no | `4000` | Port for the bot HTTP server. |

## Running locally

**Step 1 — start the surf-console** (the bot captures screenshots from it):

```bash
pnpm --filter surf-console dev
# Serves on http://localhost:3000
```

**Step 2 — start the bot**:

```bash
pnpm --filter @surf/docs-bot dev
# Bot HTTP server on http://localhost:4000
# Health check: GET http://localhost:4000/health
```

## Exposing the webhook via a tunnel

GitHub cannot reach `localhost:4000` directly. Use a tunnel to expose the `/webhook` endpoint publicly.

### Option A — smee.io (no install, anonymous)

```bash
npx smee-client --url https://smee.io/<your-channel-id> --target http://localhost:4000/webhook
```

Create a channel at https://smee.io/ (click "Start a new channel"). The displayed URL is your tunnel URL.

### Option B — ngrok

```bash
ngrok http 4000
# Copy the https://.... forwarding URL; append /webhook
```

## Registering the GitHub webhook

1. Go to your repo on GitHub → **Settings** → **Webhooks** → **Add webhook**.
2. **Payload URL**: your tunnel URL + `/webhook` (e.g. `https://smee.io/xxx` or `https://abc.ngrok.io/webhook`).
3. **Content type**: `application/json`.
4. **Secret**: the value of `GITHUB_WEBHOOK_SECRET` in your `.env`. Use the SAME secret in both places — the bot verifies HMAC-SHA256 on every request.
5. **Events**: select **Let me select individual events** → check **Pull requests** only.
6. Save. GitHub immediately sends a `ping` event; the bot responds 200 (ignored, not a merge event).

> **Important — git fetch requirement**: when a webhook fires, the merge commit from GitHub may not yet be present in your local clone. The resolver runs a best-effort `git fetch origin` first so the SHA is available for diffing. If the fetch fails, the error is logged and the pipeline continues — if the SHA is already present locally (e.g. recently cloned), `getChangedPaths` succeeds and the event is enqueued normally. Only if `getChangedPaths` itself fails (the SHA is truly missing) is the error caught and the webhook acknowledged `202` without enqueue. You can use `/run-now` to retry manually after the local clone is up to date.

## Demo flow

1. Merge the `demo/shark-siren` PR on GitHub.
2. The GitHub webhook fires → bot receives the `pull_request` (closed+merged) event.
3. Bot fetches origin, diffs the merge SHA, detects `SharkMitigationCard.tsx` changed.
4. `isRelevant()` returns `true` → event is enqueued.
5. Scheduler flushes → `runJob` runs the full pipeline.
6. A new `shark-mitigation/index.md` (v4) is committed with `[skip-bot]` in the message.
7. surf-console (running in `next dev`) picks up the content change — the portal shows the updated doc.

### `/run-now` fallback

If the tunnel is flaky or the webhook did not fire, POST to the bot directly to flush the scheduler manually:

```bash
curl -X POST http://localhost:4000/run-now
# {"status":"flushed"}
```

This is useful for demo recovery without re-merging the PR.

### No-loop guard

The publisher commits docs to `apps/surf-console/content/docs/` and appends `[skip-bot]` to the commit message. Even if a webhook fires for that commit, `isRelevant()` returns `false` (publish-output paths never match the watched UI globs), so the pipeline is not re-triggered.

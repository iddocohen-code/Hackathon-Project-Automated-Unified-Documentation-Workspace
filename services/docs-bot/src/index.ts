import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { simpleGit } from 'simple-git';

import { loadConfig } from './config.js';
import { buildApp } from './server.js';
import type { AdminSavePayload, AdminSaveResult } from './server.js';
import { makeScheduler } from './pipeline/scheduler.js';
import { makeRunJob } from './pipeline/runJob.js';
import { PlaywrightCapture } from './capture/capture.js';
import { FixtureJiraSource } from './context/fixtures/jira.js';
import { FixtureSlackSource } from './context/fixtures/slack.js';
import { FixtureConfluenceSource } from './context/fixtures/confluence.js';
import { getChangedPaths } from './git/diff.js';
import { initIndex, rebuildIndex } from './rag/index-state.js';
import { saveManualEdit } from './publish/publisher.js';
import { withLock } from './publish/lock.js';
import type { PullRequestEvent, Doc, ChangeEntry, DocsManifest } from '@surf/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

const config = loadConfig();

// ---------------------------------------------------------------------------
// RAG index — initialise and build once at boot
// ---------------------------------------------------------------------------
initIndex(config);
await rebuildIndex();

// Build the real context sources (fixture-backed for Plan 2 demo)
const contextSources = [
  new FixtureJiraSource(),
  new FixtureSlackSource(),
  new FixtureConfluenceSource(),
];

// Build the Playwright screenshot capture pointed at the running surf-console
const captureBackend = new PlaywrightCapture(config.surfConsoleUrl, undefined, {
  headful: config.captureHeadful,
  slowMo: config.captureSlowMo,
});

// Assemble the runJob closure with all real dependencies
const runJob = makeRunJob({
  docsContentDir: config.docsContentDir,
  screenshotsPublicDir: config.screenshotsPublicDir,
  repoRoot,
  surfConsoleUrl: config.surfConsoleUrl,
  contextSources,
  capture: captureBackend,
  replayMode: config.replayMode,
  // commitFn: undefined → publisher uses the real simpleGit commit
  // Rebuild the RAG index after each successful publish so /search stays current.
  onIndexRebuild: () => rebuildIndex(),
});

// ---------------------------------------------------------------------------
// Real changed-paths resolver
//
// Before diffing, we best-effort `git fetch origin` so the freshly-merged SHA
// from GitHub is present in the local clone. Fetch failures are logged and
// ignored — in a local/demo environment the SHA may already be present (e.g.
// the repo was cloned recently), and failing here must NOT drop the webhook.
// ---------------------------------------------------------------------------
async function resolveChangedPaths(event: PullRequestEvent): Promise<string[]> {
  const git = simpleGit(repoRoot);
  try {
    await git.fetch('origin');
  } catch (err) {
    // Best-effort: log and continue. The SHA may already be present locally.
    console.warn({ err }, 'webhook: git fetch origin failed (best-effort, continuing)');
  }
  return getChangedPaths(event.mergedSha, repoRoot);
}

// ---------------------------------------------------------------------------
// Admin manual-save handler (admin editor → bot).
//
// Per-docId locked so a manual save and a bot job can't interleave on the same
// doc's manifest entry. Optimistic concurrency via baseVersion → 409 on stale.
// Reuses the publisher's atomic helpers via saveManualEdit (no AI, no screenshot).
// ---------------------------------------------------------------------------
async function adminSave(payload: AdminSavePayload): Promise<AdminSaveResult> {
  return withLock(payload.docId, async (): Promise<AdminSaveResult> => {
    const manifestPath = path.join(config.docsContentDir, 'manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf-8')) as DocsManifest;
    const current = manifest.docs.find((d) => d.id === payload.docId);

    if (current === undefined) {
      return { status: 404, body: { error: `doc '${payload.docId}' not found` } };
    }
    if (payload.baseVersion !== current.version) {
      return {
        status: 409,
        body: { error: 'version conflict', currentVersion: current.version },
      };
    }

    const now = new Date().toISOString();
    const newVersion = current.version + 1;
    const note = payload.changeNote ?? '';
    const summary = { headline: 'Manual edit', detail: note, intentSource: 'Manual admin edit' };

    const updatedDoc: Doc = {
      ...current,
      title: payload.title ?? current.title,
      bodyMarkdown: payload.bodyMarkdown,
      version: newVersion,
      updatedAt: now,
      lastChange: summary,
    };

    const changeEntry: ChangeEntry = {
      id: `chg-${randomUUID().slice(0, 8)}`,
      docId: payload.docId,
      summary,
      severity: 'info',
      prUrl: '',
      contextRefs: [],
      createdAt: now,
    };

    await saveManualEdit({
      doc: updatedDoc,
      changeEntry,
      docsContentDir: config.docsContentDir,
      // commitFn: undefined → publisher uses the real simpleGit commit
      // Rebuild the RAG index after a successful manual save so /search stays current.
      onIndexRebuild: () => rebuildIndex(),
    });
    return { status: 200, body: { ok: true, version: newVersion } };
  });
}

// Wire the real pipeline into the scheduler and start the server
const scheduler = makeScheduler(
  {
    schedulerMode: config.schedulerMode,
    debounceMs: 30_000,
  },
  runJob,
);

const app = buildApp(config, scheduler, { resolveChangedPaths, adminSave });
await app.listen({ port: config.port, host: '0.0.0.0' });

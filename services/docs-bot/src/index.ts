import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { simpleGit } from 'simple-git';

import { loadConfig } from './config.js';
import { buildApp } from './server.js';
import { makeScheduler } from './pipeline/scheduler.js';
import { makeRunJob } from './pipeline/runJob.js';
import { PlaywrightCapture } from './capture/capture.js';
import { FixtureJiraSource } from './context/fixtures/jira.js';
import { FixtureSlackSource } from './context/fixtures/slack.js';
import { FixtureConfluenceSource } from './context/fixtures/confluence.js';
import { getChangedPaths } from './git/diff.js';
import { initIndex, rebuildIndex } from './rag/index-state.js';
import type { PullRequestEvent } from '@surf/types';

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
const captureBackend = new PlaywrightCapture(config.surfConsoleUrl);

// Assemble the runJob closure with all real dependencies
const runJob = makeRunJob({
  docsContentDir: config.docsContentDir,
  screenshotsPublicDir: config.screenshotsPublicDir,
  repoRoot,
  surfConsoleUrl: config.surfConsoleUrl,
  contextSources,
  capture: captureBackend,
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

// Wire the real pipeline into the scheduler and start the server
const scheduler = makeScheduler(
  {
    schedulerMode: config.schedulerMode,
    debounceMs: 30_000,
  },
  runJob,
);

const app = buildApp(config, scheduler, { resolveChangedPaths });
await app.listen({ port: config.port, host: '0.0.0.0' });

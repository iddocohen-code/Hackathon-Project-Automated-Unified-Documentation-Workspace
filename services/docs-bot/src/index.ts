import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadConfig } from './config.js';
import { buildApp } from './server.js';
import { makeScheduler } from './pipeline/scheduler.js';
import { makeRunJob } from './pipeline/runJob.js';
import { PlaywrightCapture } from './capture/capture.js';
import { FixtureJiraSource } from './context/fixtures/jira.js';
import { FixtureSlackSource } from './context/fixtures/slack.js';
import { FixtureConfluenceSource } from './context/fixtures/confluence.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

const config = loadConfig();

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
});

// Wire the real pipeline into the scheduler and start the server
const scheduler = makeScheduler(
  {
    schedulerMode: config.schedulerMode,
    debounceMs: 30_000,
  },
  runJob,
);

const app = buildApp(config, scheduler);
await app.listen({ port: config.port, host: '0.0.0.0' });

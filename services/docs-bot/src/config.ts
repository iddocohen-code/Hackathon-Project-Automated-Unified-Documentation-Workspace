import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// __dirname equivalent for ESM; config.ts lives at services/docs-bot/src/
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const defaultDocsContentDir = path.resolve(repoRoot, 'apps/surf-console/content/docs');
const defaultScreenshotsPublicDir = path.resolve(repoRoot, 'apps/surf-console/public/docs-screenshots');

const configSchema = z.object({
  schedulerMode: z
    .preprocess(
      (v) => (v === '' ? undefined : v),
      z.enum(['instant', 'throttled']).default('instant'),
    ),
  surfConsoleUrl: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().url().default('http://localhost:3000'),
  ),
  docsContentDir: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().default(defaultDocsContentDir),
  ),
  screenshotsPublicDir: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().default(defaultScreenshotsPublicDir),
  ),
  webhookSecret: z
    .string()
    .default(''),
  port: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.coerce.number().int().positive().default(4000),
  ),
  corsOrigin: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().default('http://localhost:3000'),
  ),
  retrieverMode: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.enum(['keyword', 'vector']).default('keyword'),
  ),
  replayMode: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.coerce.boolean().default(false),
  ),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  return configSchema.parse({
    schedulerMode: process.env['SCHEDULER_MODE'],
    surfConsoleUrl: process.env['SURF_CONSOLE_URL'],
    docsContentDir: process.env['DOCS_CONTENT_DIR'],
    screenshotsPublicDir: process.env['SCREENSHOTS_PUBLIC_DIR'],
    webhookSecret: process.env['GITHUB_WEBHOOK_SECRET'],
    port: process.env['PORT'],
    corsOrigin: process.env['CORS_ORIGIN'],
    retrieverMode: process.env['RETRIEVER_MODE'],
    replayMode: process.env['REPLAY_MODE'],
  });
}

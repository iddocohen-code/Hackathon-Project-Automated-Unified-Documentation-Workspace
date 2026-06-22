import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// __dirname equivalent for ESM; config.ts lives at services/docs-bot/src/
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const defaultDocsContentDir = path.resolve(repoRoot, 'apps/surf-console/content/docs');

const configSchema = z.object({
  schedulerMode: z
    .enum(['instant', 'throttled'])
    .default('instant'),
  surfConsoleUrl: z
    .string()
    .url()
    .default('http://localhost:3000'),
  docsContentDir: z
    .string()
    .default(defaultDocsContentDir),
  webhookSecret: z
    .string()
    .default(''),
  port: z
    .coerce.number()
    .int()
    .positive()
    .default(4000),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  return configSchema.parse({
    schedulerMode: process.env['SCHEDULER_MODE'],
    surfConsoleUrl: process.env['SURF_CONSOLE_URL'],
    docsContentDir: process.env['DOCS_CONTENT_DIR'],
    webhookSecret: process.env['GITHUB_WEBHOOK_SECRET'],
    port: process.env['PORT'],
  });
}

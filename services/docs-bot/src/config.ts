import 'dotenv/config';
import path from 'node:path';
import { z } from 'zod';

const repoRoot = path.resolve(process.cwd(), '../..');
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

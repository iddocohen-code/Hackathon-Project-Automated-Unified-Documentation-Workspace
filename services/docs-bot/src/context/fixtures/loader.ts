import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

// src/context/fixtures/ → two levels up → services/docs-bot/
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.resolve(__dirname, '../../../fixtures');

export async function loadJsonFixture<T>(filename: string): Promise<T> {
  const content = await readFile(path.join(fixturesDir, filename), 'utf-8');
  return JSON.parse(content) as T;
}

export async function loadTextFixture(filename: string): Promise<string> {
  return readFile(path.join(fixturesDir, filename), 'utf-8');
}

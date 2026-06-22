import { describe, it, expect, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import simpleGit from 'simple-git';
import { getDiff } from '../src/git/diff.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function initRepo(repoRoot: string) {
  const git = simpleGit(repoRoot);
  await git.init();
  await git.addConfig('user.name', 'Test User');
  await git.addConfig('user.email', 'test@example.com');
  return git;
}

function writeFile(repoRoot: string, relPath: string, content: string) {
  const fullPath = join(repoRoot, relPath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content, 'utf-8');
}

async function commit(git: Awaited<ReturnType<typeof initRepo>>, message: string) {
  await git.add('.');
  await git.commit(message);
  const log = await git.log({ maxCount: 1 });
  return log.latest!.hash;
}

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const tmpRoot = mkdtempSync(join(tmpdir(), 'docs-bot-diff-test-'));
let headSha = '';

// Set up the temp repo once before tests run
const setup = (async () => {
  const git = await initRepo(tmpRoot);

  // Baseline commit: the watched UI file + a non-watched service file
  writeFile(
    tmpRoot,
    'apps/surf-console/components/console/SharkMitigationCard.tsx',
    'export function SharkMitigationCard() { return <div>base</div>; }',
  );
  writeFile(tmpRoot, 'services/docs-bot/x.ts', 'export const x = 1;');
  await commit(git, 'baseline');

  // Second commit: modify the UI file (add triggerSiren) + update the service file
  writeFile(
    tmpRoot,
    'apps/surf-console/components/console/SharkMitigationCard.tsx',
    'export function SharkMitigationCard() {\n  return (\n    <div>\n      <button onClick={triggerSiren}>Trigger Siren</button>\n    </div>\n  );\n}',
  );
  writeFile(tmpRoot, 'services/docs-bot/x.ts', 'export const x = 2;');
  headSha = await commit(git, 'feat: add triggerSiren button');
})();

afterAll(() => {
  rmSync(tmpRoot, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getDiff', () => {
  it('returns one entry for the watched UI file and filters out the non-watched file', async () => {
    await setup;

    const entries = await getDiff(headSha, tmpRoot);

    // Exactly one entry — only the watched UI file
    expect(entries).toHaveLength(1);

    const entry = entries[0]!;
    expect(entry.path.endsWith('SharkMitigationCard.tsx')).toBe(true);
    expect(entry.patch).toContain('triggerSiren');
  });

  it('non-watched file (services/docs-bot/x.ts) is NOT present in the result', async () => {
    await setup;

    const entries = await getDiff(headSha, tmpRoot);
    const paths = entries.map((e) => e.path);
    expect(paths.some((p) => p.includes('x.ts'))).toBe(false);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { mkdtemp, cp, mkdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DocsManifest, ChangeEntry } from '@surf/types';

import { makeRunJob } from '../src/pipeline/runJob.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const realDocsDir = path.resolve(repoRoot, 'apps/surf-console/content/docs');

const PR = {
  prUrl: 'https://github.com/example/surf/pull/99',
  mergedSha: 'replay123',
  changedPaths: ['apps/surf-console/components/console/SharkMitigationCard.tsx'],
  title: 'replay test',
  body: '',
};

describe('REPLAY runJob (no Claude, no Playwright)', () => {
  it('publishes canned v4 + 2 screenshots + critical entry to temp dirs', async () => {
    // Seed temp dirs from real before-state
    const base = await mkdtemp(path.join(tmpdir(), 'replay-test-'));
    const docsContentDir = path.join(base, 'docs');
    const screenshotsPublicDir = path.join(base, 'screenshots');
    await mkdir(docsContentDir, { recursive: true });
    await mkdir(screenshotsPublicDir, { recursive: true });
    await cp(realDocsDir, docsContentDir, { recursive: true });

    const noopCommit = async () => {};
    const onIndexRebuild = vi.fn().mockResolvedValue(undefined);

    const runJob = makeRunJob({
      docsContentDir,
      screenshotsPublicDir,
      repoRoot,
      surfConsoleUrl: 'http://localhost:3000',
      contextSources: [],
      capture: { capture: vi.fn(), captureStates: vi.fn() } as any,
      commitFn: noopCommit,
      onIndexRebuild,
      replayMode: true,
    });

    await runJob(PR);

    // 1. onIndexRebuild fired
    expect(onIndexRebuild).toHaveBeenCalledOnce();

    // 2. manifest shows v4 + 2 screenshots
    const manifest = JSON.parse(
      await readFile(path.join(docsContentDir, 'manifest.json'), 'utf-8'),
    ) as DocsManifest;
    const shark = manifest.docs.find((d) => d.id === 'shark-mitigation')!;
    expect(shark.version).toBe(4);
    expect(shark.screenshots.length).toBe(2);
    const filenames = shark.screenshots.map((s) => path.basename(s.path));
    expect(filenames.some((f) => f.includes('-default.png'))).toBe(true);
    expect(filenames.some((f) => f.includes('-active.png') || f.includes('siren'))).toBe(true);

    // 3. v4 body mentions siren
    const body = await readFile(path.join(docsContentDir, 'shark-mitigation', 'index.md'), 'utf-8');
    expect(body.toLowerCase()).toContain('siren');

    // 4. changelog has critical entry
    const changelog = JSON.parse(
      await readFile(path.join(docsContentDir, 'changelog.json'), 'utf-8'),
    ) as ChangeEntry[];
    const entry = changelog[0]!;
    expect(entry.severity).toBe('critical');
    expect(entry.docId).toBe('shark-mitigation');
  }, 30_000);
});

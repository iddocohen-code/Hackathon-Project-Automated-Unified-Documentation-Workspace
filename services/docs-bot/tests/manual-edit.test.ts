/**
 * Tests for the admin manual-editor write path:
 *   - saveManualEdit() reuses the publisher's atomic core (no PNG, no AI vars)
 *   - withLock() serializes writes per docId
 *
 * Strategy mirrors publisher.test.ts: seed a temp dir from the real
 * content/docs before-state and pass a spy commitFn so no real git runs.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp, cp, mkdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Doc, ChangeEntry, DocsManifest, Changelog } from '@surf/types';
import { saveManualEdit } from '../src/publish/publisher.js';
import { withLock } from '../src/publish/lock.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const realDocsDir = path.resolve(repoRoot, 'apps/surf-console/content/docs');

async function seedTempDir(): Promise<string> {
  const base = await mkdtemp(path.join(tmpdir(), 'manual-edit-test-'));
  const docsContentDir = path.join(base, 'docs');
  await mkdir(docsContentDir, { recursive: true });
  await cp(realDocsDir, docsContentDir, { recursive: true });
  return docsContentDir;
}

async function readManifest(dir: string): Promise<DocsManifest> {
  return JSON.parse(await readFile(path.join(dir, 'manifest.json'), 'utf-8')) as DocsManifest;
}
async function readChangelog(dir: string): Promise<Changelog> {
  return JSON.parse(await readFile(path.join(dir, 'changelog.json'), 'utf-8')) as Changelog;
}

const NOW = '2026-06-23T08:00:00Z';

/** Build an assembled manual-edit Doc from a baseline manifest entry. */
function assembleEdit(baseline: Doc, newBody: string, note: string): Doc {
  return {
    ...baseline,
    bodyMarkdown: newBody,
    version: baseline.version + 1,
    updatedAt: NOW,
    // screenshots carried over verbatim from the baseline manifest entry
    lastChange: { headline: 'Manual edit', detail: note, intentSource: 'Manual admin edit' },
  };
}

function manualChangeEntry(docId: string, note: string): ChangeEntry {
  return {
    id: 'chg-manual-test',
    docId,
    summary: { headline: 'Manual edit', detail: note, intentSource: 'Manual admin edit' },
    severity: 'info',
    prUrl: '',
    contextRefs: [],
    createdAt: NOW,
  };
}

describe('saveManualEdit()', () => {
  let docsContentDir: string;
  let baseline: Doc;
  let commits: { paths: string[]; message: string }[];
  const spyCommit = async (paths: string[], message: string) => {
    commits.push({ paths, message });
  };

  beforeEach(async () => {
    docsContentDir = await seedTempDir();
    const manifest = await readManifest(docsContentDir);
    baseline = manifest.docs.find((d) => d.id === 'shark-mitigation')!;
    commits = [];
  });

  it('bumps version by 1 and writes the new body to index.md', async () => {
    const edit = assembleEdit(baseline, '## Edited\n\nManually corrected prose.', 'fix typo');
    await saveManualEdit({ doc: edit, changeEntry: manualChangeEntry('shark-mitigation', 'fix typo'), docsContentDir, commitFn: spyCommit });

    const manifest = await readManifest(docsContentDir);
    const updated = manifest.docs.find((d) => d.id === 'shark-mitigation')!;
    expect(updated.version).toBe(baseline.version + 1);

    const body = await readFile(path.join(docsContentDir, 'shark-mitigation', 'index.md'), 'utf-8');
    expect(body).toContain('Manually corrected prose.');
  });

  it('keeps manifest bodyMarkdown === "" (body lives in index.md)', async () => {
    const edit = assembleEdit(baseline, '## X', 'n');
    await saveManualEdit({ doc: edit, changeEntry: manualChangeEntry('shark-mitigation', 'n'), docsContentDir, commitFn: spyCommit });
    const manifest = await readManifest(docsContentDir);
    expect(manifest.docs.find((d) => d.id === 'shark-mitigation')!.bodyMarkdown).toBe('');
  });

  it('preserves the doc\'s existing screenshots verbatim (no new capture)', async () => {
    const edit = assembleEdit(baseline, '## X', 'n');
    await saveManualEdit({ doc: edit, changeEntry: manualChangeEntry('shark-mitigation', 'n'), docsContentDir, commitFn: spyCommit });
    const manifest = await readManifest(docsContentDir);
    const updated = manifest.docs.find((d) => d.id === 'shark-mitigation')!;
    expect(updated.screenshots).toEqual(baseline.screenshots);
  });

  it('prepends an info ChangeEntry to changelog.json', async () => {
    const before = await readChangelog(docsContentDir);
    const edit = assembleEdit(baseline, '## X', 'note here');
    await saveManualEdit({ doc: edit, changeEntry: manualChangeEntry('shark-mitigation', 'note here'), docsContentDir, commitFn: spyCommit });
    const after = await readChangelog(docsContentDir);
    expect(after).toHaveLength(before.length + 1);
    expect(after[0].id).toBe('chg-manual-test');
    expect(after[0].severity).toBe('info');
    expect(after[0].summary.intentSource).toBe('Manual admin edit');
  });

  it('preserves categories and leaves other docs untouched', async () => {
    const before = await readManifest(docsContentDir);
    const otherBefore = before.docs.filter((d) => d.id !== 'shark-mitigation');
    const edit = assembleEdit(baseline, '## X', 'n');
    await saveManualEdit({ doc: edit, changeEntry: manualChangeEntry('shark-mitigation', 'n'), docsContentDir, commitFn: spyCommit });
    const after = await readManifest(docsContentDir);
    expect(after.categories).toEqual(before.categories);
    for (const d of otherBefore) {
      expect(after.docs.find((x) => x.id === d.id)).toEqual(d);
    }
  });

  it('commits with a [skip-bot] manual-edit message and does NOT include any PNG path', async () => {
    const edit = assembleEdit(baseline, '## X', 'n');
    await saveManualEdit({ doc: edit, changeEntry: manualChangeEntry('shark-mitigation', 'n'), docsContentDir, commitFn: spyCommit });
    expect(commits).toHaveLength(1);
    expect(commits[0].message).toBe(`docs: manual edit shark-mitigation (v${baseline.version + 1}) [skip-bot]`);
    expect(commits[0].paths.some((p) => p.endsWith('.png'))).toBe(false);
    expect(commits[0].paths.some((p) => p.endsWith('index.md'))).toBe(true);
    expect(commits[0].paths.some((p) => p.endsWith('manifest.json'))).toBe(true);
    expect(commits[0].paths.some((p) => p.endsWith('changelog.json'))).toBe(true);
  });
});

describe('withLock()', () => {
  it('serializes operations on the same docId in arrival order', async () => {
    const order: string[] = [];
    const op = (label: string, delay: number) =>
      withLock('doc-a', async () => {
        order.push(`${label}:start`);
        await new Promise((r) => setTimeout(r, delay));
        order.push(`${label}:end`);
      });

    await Promise.all([op('first', 30), op('second', 1)]);
    // second must not start until first ends (no interleaving)
    expect(order).toEqual(['first:start', 'first:end', 'second:start', 'second:end']);
  });

  it('allows different docIds to run concurrently', async () => {
    const order: string[] = [];
    const a = withLock('doc-x', async () => {
      order.push('x:start');
      await new Promise((r) => setTimeout(r, 20));
      order.push('x:end');
    });
    const b = withLock('doc-y', async () => {
      order.push('y:start');
      await new Promise((r) => setTimeout(r, 1));
      order.push('y:end');
    });
    await Promise.all([a, b]);
    // y started before x ended → genuine concurrency across different docIds
    expect(order.indexOf('y:start')).toBeLessThan(order.indexOf('x:end'));
  });

  it('a throwing critical section does not block later waiters on the same docId', async () => {
    await expect(withLock('doc-z', async () => { throw new Error('boom'); })).rejects.toThrow('boom');
    const result = await withLock('doc-z', async () => 'ok');
    expect(result).toBe('ok');
  });

  it('returns the critical section\'s resolved value', async () => {
    const v = await withLock('doc-r', async () => 42);
    expect(v).toBe(42);
  });
});

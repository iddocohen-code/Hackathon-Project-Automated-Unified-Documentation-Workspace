/**
 * Tests for publisher.ts — the ONLY writer of content/docs.
 *
 * Strategy for git step: the `publish` function accepts an optional
 * `commitFn` override that replaces the real `simpleGit` commit.
 * In tests we pass a no-op (or spy) so file-write assertions run
 * without touching the actual git repo. The real commit path is
 * exercised only in production/integration contexts.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, cp, mkdir, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Doc, ChangeEntry, DocsManifest, Changelog } from '@surf/types';
import { publish } from '../src/publish/publisher.js';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const realDocsDir = path.resolve(repoRoot, 'apps/surf-console/content/docs');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** v4 shark Doc that publisher should write */
const V4_SHARK_DOC: Doc = {
  id: 'shark-mitigation',
  title: 'Shark Mitigation Protocol',
  category: {
    id: 'incident-protocols',
    name: 'Incident Protocols',
    icon: 'shield',
  },
  bodyMarkdown:
    '# Shark Mitigation Protocol (v4)\n\n## Emergency Shark Siren\n\nVersion 4 adds one-press Emergency Shark Siren for instant zone-wide evacuation.',
  screenshots: [
    {
      path: '/docs-screenshots/shark-mitigation/screenshot-v4.png',
      alt: 'Shark mitigation panel with emergency siren button',
      capturedAt: '2025-06-22T10:00:00Z',
      targetSelector: '.shark-mitigation-card',
    },
  ],
  sourceComponent: 'apps/surf-console/components/console/SharkMitigationCard.tsx',
  version: 4,
  updatedAt: '2025-06-22T10:00:00Z',
  lastChange: {
    headline: 'Shark Mitigation Protocol updated to v4',
    detail: 'One-press Emergency Shark Siren added for instant zone-wide evacuation. Resolves SURF-142.',
    intentSource: 'JIRA SURF-142',
  },
};

const NEW_CHANGE_ENTRY: ChangeEntry = {
  id: 'chg-142',
  docId: 'shark-mitigation',
  summary: {
    headline: 'Shark Mitigation Protocol updated to v4',
    detail: 'One-press Emergency Shark Siren added for instant zone-wide evacuation. Resolves SURF-142.',
    intentSource: 'JIRA SURF-142',
  },
  severity: 'critical',
  prUrl: 'https://github.com/org/surf-console/pull/142',
  contextRefs: [
    {
      kind: 'jira',
      ref: 'JIRA SURF-142',
      url: 'https://jira.example.com/browse/SURF-142',
      excerpt: 'Lifeguards need instant zone-wide evacuation trigger.',
    },
  ],
  screenshotDiff: {
    after: '/docs-screenshots/shark-mitigation/screenshot-v4.png',
  },
  createdAt: '2025-06-22T10:00:00Z',
};

/** A small but valid PNG buffer (1x1 white pixel) */
const FAKE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function seedTempDir(): Promise<{ docsContentDir: string; screenshotsPublicDir: string }> {
  const base = await mkdtemp(path.join(tmpdir(), 'publisher-test-'));
  const docsContentDir = path.join(base, 'docs');
  const screenshotsPublicDir = path.join(base, 'screenshots');

  await mkdir(docsContentDir, { recursive: true });
  await mkdir(screenshotsPublicDir, { recursive: true });

  // Copy the real before-state files into the temp docs dir
  await cp(realDocsDir, docsContentDir, { recursive: true });

  return { docsContentDir, screenshotsPublicDir };
}

/** No-op commit function for tests — skips actual git operations */
const noopCommit = async (_paths: string[], _message: string): Promise<void> => {
  // intentionally no-op
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('publisher.publish()', () => {
  let docsContentDir: string;
  let screenshotsPublicDir: string;

  beforeEach(async () => {
    const dirs = await seedTempDir();
    docsContentDir = dirs.docsContentDir;
    screenshotsPublicDir = dirs.screenshotsPublicDir;
  });

  it('writes index.md with the regenerated body', async () => {
    await publish({
      doc: V4_SHARK_DOC,
      screenshots: [{ screenshot: V4_SHARK_DOC.screenshots[0], pngBuffer: FAKE_PNG }],
      changeEntry: NEW_CHANGE_ENTRY,
      docsContentDir,
      screenshotsPublicDir,
      commitFn: noopCommit,
    });

    const mdPath = path.join(docsContentDir, 'shark-mitigation', 'index.md');
    const content = await readFile(mdPath, 'utf-8');
    expect(content).toContain('Emergency Shark Siren');
    expect(content.length).toBeGreaterThan(0);
  });

  it('writes the PNG to screenshotsPublicDir/<docId>/', async () => {
    await publish({
      doc: V4_SHARK_DOC,
      screenshots: [{ screenshot: V4_SHARK_DOC.screenshots[0], pngBuffer: FAKE_PNG }],
      changeEntry: NEW_CHANGE_ENTRY,
      docsContentDir,
      screenshotsPublicDir,
      commitFn: noopCommit,
    });

    // The PNG should exist somewhere under screenshotsPublicDir/shark-mitigation/
    const sharkScreenshotDir = path.join(screenshotsPublicDir, 'shark-mitigation');
    const dirStat = await stat(sharkScreenshotDir);
    expect(dirStat.isDirectory()).toBe(true);

    // At least one .png file exists
    const { readdir } = await import('node:fs/promises');
    const files = await readdir(sharkScreenshotDir);
    const pngFiles = files.filter((f) => f.endsWith('.png'));
    expect(pngFiles.length).toBeGreaterThan(0);
  });

  it('updates manifest: shark-mitigation doc is version 4, has non-empty screenshots with web paths, and bodyMarkdown === ""', async () => {
    await publish({
      doc: V4_SHARK_DOC,
      screenshots: [{ screenshot: V4_SHARK_DOC.screenshots[0], pngBuffer: FAKE_PNG }],
      changeEntry: NEW_CHANGE_ENTRY,
      docsContentDir,
      screenshotsPublicDir,
      commitFn: noopCommit,
    });

    const manifestRaw = await readFile(path.join(docsContentDir, 'manifest.json'), 'utf-8');
    const manifest = JSON.parse(manifestRaw) as DocsManifest;

    const sharkDoc = manifest.docs.find((d) => d.id === 'shark-mitigation');
    expect(sharkDoc).toBeDefined();
    expect(sharkDoc!.version).toBe(4);
    expect(sharkDoc!.bodyMarkdown).toBe('');
    expect(sharkDoc!.screenshots.length).toBeGreaterThan(0);
    expect(sharkDoc!.screenshots[0].path).toMatch(/^\/docs-screenshots\//);
  });

  it('preserves categories verbatim (still 4 categories each with docCount)', async () => {
    await publish({
      doc: V4_SHARK_DOC,
      screenshots: [{ screenshot: V4_SHARK_DOC.screenshots[0], pngBuffer: FAKE_PNG }],
      changeEntry: NEW_CHANGE_ENTRY,
      docsContentDir,
      screenshotsPublicDir,
      commitFn: noopCommit,
    });

    const manifestRaw = await readFile(path.join(docsContentDir, 'manifest.json'), 'utf-8');
    const manifest = JSON.parse(manifestRaw) as DocsManifest;

    expect(manifest.categories).toHaveLength(4);
    for (const cat of manifest.categories) {
      expect(typeof cat.docCount).toBe('number');
      expect(cat.docCount).toBeGreaterThan(0);
    }
  });

  it('leaves other docs (storm-surge-response, wave-height-telemetry, currents-drifts) untouched', async () => {
    await publish({
      doc: V4_SHARK_DOC,
      screenshots: [{ screenshot: V4_SHARK_DOC.screenshots[0], pngBuffer: FAKE_PNG }],
      changeEntry: NEW_CHANGE_ENTRY,
      docsContentDir,
      screenshotsPublicDir,
      commitFn: noopCommit,
    });

    const manifestRaw = await readFile(path.join(docsContentDir, 'manifest.json'), 'utf-8');
    const manifest = JSON.parse(manifestRaw) as DocsManifest;

    const stormSurge = manifest.docs.find((d) => d.id === 'storm-surge-response');
    const waveHeight = manifest.docs.find((d) => d.id === 'wave-height-telemetry');
    const currents = manifest.docs.find((d) => d.id === 'currents-drifts');

    expect(stormSurge?.version).toBe(1);
    expect(waveHeight?.version).toBe(2);
    expect(currents?.version).toBe(1);

    // None of the others should have screenshots (they had none in the before-state)
    expect(stormSurge?.screenshots).toEqual([]);
    expect(waveHeight?.screenshots).toEqual([]);
    expect(currents?.screenshots).toEqual([]);
  });

  it('prepends the new ChangeEntry to changelog.json; 2 pre-existing info entries remain', async () => {
    await publish({
      doc: V4_SHARK_DOC,
      screenshots: [{ screenshot: V4_SHARK_DOC.screenshots[0], pngBuffer: FAKE_PNG }],
      changeEntry: NEW_CHANGE_ENTRY,
      docsContentDir,
      screenshotsPublicDir,
      commitFn: noopCommit,
    });

    const changelogRaw = await readFile(path.join(docsContentDir, 'changelog.json'), 'utf-8');
    const changelog = JSON.parse(changelogRaw) as Changelog;

    // Total entries should be 3 (1 new + 2 existing)
    expect(changelog).toHaveLength(3);

    // The new entry should be findable
    const newEntry = changelog.find((e) => e.id === 'chg-142');
    expect(newEntry).toBeDefined();
    expect(newEntry!.severity).toBe('critical');
    expect(newEntry!.screenshotDiff?.after).toMatch(/^\/docs-screenshots\//);

    // The 2 pre-existing info entries are still present
    const infoEntries = changelog.filter((e) => e.severity === 'info');
    expect(infoEntries).toHaveLength(2);
    expect(infoEntries.some((e) => e.id === 'chg-126')).toBe(true);
    expect(infoEntries.some((e) => e.id === 'chg-121')).toBe(true);
  });

  it('after sort by createdAt desc, the new critical entry comes first', async () => {
    await publish({
      doc: V4_SHARK_DOC,
      screenshots: [{ screenshot: V4_SHARK_DOC.screenshots[0], pngBuffer: FAKE_PNG }],
      changeEntry: NEW_CHANGE_ENTRY,
      docsContentDir,
      screenshotsPublicDir,
      commitFn: noopCommit,
    });

    const changelogRaw = await readFile(path.join(docsContentDir, 'changelog.json'), 'utf-8');
    const changelog = (JSON.parse(changelogRaw) as Changelog).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );

    expect(changelog[0].id).toBe('chg-142');
    expect(changelog[0].severity).toBe('critical');
  });

  it('contract check: manifest doc validates as Doc shape; getDoc-equivalent yields v4 with real body', async () => {
    await publish({
      doc: V4_SHARK_DOC,
      screenshots: [{ screenshot: V4_SHARK_DOC.screenshots[0], pngBuffer: FAKE_PNG }],
      changeEntry: NEW_CHANGE_ENTRY,
      docsContentDir,
      screenshotsPublicDir,
      commitFn: noopCommit,
    });

    // Read manifest and inject body (same logic as content.ts getDoc)
    const manifestRaw = await readFile(path.join(docsContentDir, 'manifest.json'), 'utf-8');
    const manifest = JSON.parse(manifestRaw) as DocsManifest;
    const entry = manifest.docs.find((d) => d.id === 'shark-mitigation')!;

    // Doc shape validation: required fields present
    expect(typeof entry.id).toBe('string');
    expect(typeof entry.title).toBe('string');
    expect(typeof entry.category).toBe('object');
    expect(typeof entry.bodyMarkdown).toBe('string');
    expect(Array.isArray(entry.screenshots)).toBe(true);
    expect(typeof entry.sourceComponent).toBe('string');
    expect(typeof entry.version).toBe('number');
    expect(typeof entry.updatedAt).toBe('string');

    // HARD contract: bodyMarkdown must be "" in manifest
    expect(entry.bodyMarkdown).toBe('');

    // getDoc equivalent: inject from index.md
    const mdPath = path.join(docsContentDir, 'shark-mitigation', 'index.md');
    const bodyMarkdown = await readFile(mdPath, 'utf-8');
    const fullDoc: Doc = { ...entry, bodyMarkdown };

    expect(fullDoc.version).toBe(4);
    expect(fullDoc.bodyMarkdown.length).toBeGreaterThan(0);
    expect(fullDoc.bodyMarkdown).toContain('Emergency Shark Siren');
  });

  it('manifest doc screenshots use web paths (not filesystem paths)', async () => {
    await publish({
      doc: V4_SHARK_DOC,
      screenshots: [{ screenshot: V4_SHARK_DOC.screenshots[0], pngBuffer: FAKE_PNG }],
      changeEntry: NEW_CHANGE_ENTRY,
      docsContentDir,
      screenshotsPublicDir,
      commitFn: noopCommit,
    });

    const manifestRaw = await readFile(path.join(docsContentDir, 'manifest.json'), 'utf-8');
    const manifest = JSON.parse(manifestRaw) as DocsManifest;
    const sharkDoc = manifest.docs.find((d) => d.id === 'shark-mitigation')!;

    for (const screenshot of sharkDoc.screenshots) {
      expect(screenshot.path).toMatch(/^\/docs-screenshots\/shark-mitigation\//);
      // Must NOT be an absolute filesystem path
      expect(screenshot.path).not.toMatch(/^\/Users\//);
      expect(screenshot.path).not.toMatch(/^\/tmp\//);
    }
  });
});

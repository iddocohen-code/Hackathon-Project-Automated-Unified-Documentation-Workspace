import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Doc, DocsManifest } from '@surf/types';
import { loadCorpus } from '../src/rag/corpus.js';

// ---------------------------------------------------------------------------
// Temp dir lifecycle
// ---------------------------------------------------------------------------

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), 'corpus-test-'));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SHARK_BODY = `## Overview

Sharks are apex predators requiring a specific mitigation protocol.

## Emergency Shark Siren

Press the red button to activate the Emergency Shark Siren.
`.trim();

const sharkDocStub: Doc = {
  id: 'shark-mitigation',
  title: 'Shark Mitigation Guide',
  category: { id: 'safety', name: 'Safety', icon: '🦈' },
  bodyMarkdown: '',
  screenshots: [],
  sourceComponent: 'SharkMitigationCard',
  version: 1,
  updatedAt: '2026-01-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function buildTempCorpus(docs: Doc[], bodies: Record<string, string>) {
  const manifest: DocsManifest = {
    categories: [sharkDocStub.category],
    docs,
  };

  await writeFile(
    path.join(tempDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8',
  );

  for (const [docId, body] of Object.entries(bodies)) {
    const docDir = path.join(tempDir, docId);
    await mkdir(docDir, { recursive: true });
    await writeFile(path.join(docDir, 'index.md'), body, 'utf-8');
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('loadCorpus', () => {
  it('returns one Doc with bodyMarkdown injected from index.md', async () => {
    await buildTempCorpus([sharkDocStub], { 'shark-mitigation': SHARK_BODY });

    const docs = await loadCorpus(tempDir);

    expect(docs).toHaveLength(1);
    expect(docs[0]!.id).toBe('shark-mitigation');
    expect(docs[0]!.bodyMarkdown).toBe(SHARK_BODY);
  });

  it('preserves all other manifest fields on the returned Doc', async () => {
    await buildTempCorpus([sharkDocStub], { 'shark-mitigation': SHARK_BODY });

    const docs = await loadCorpus(tempDir);
    const doc = docs[0]!;

    expect(doc.title).toBe(sharkDocStub.title);
    expect(doc.category.id).toBe('safety');
    expect(doc.version).toBe(1);
    expect(doc.updatedAt).toBe('2026-01-01T00:00:00Z');
    expect(doc.sourceComponent).toBe('SharkMitigationCard');
    expect(doc.screenshots).toEqual([]);
  });

  it('handles multiple docs, injecting the correct body for each', async () => {
    const telemetryDocStub: Doc = {
      id: 'telemetry-overview',
      title: 'Telemetry Overview',
      category: { id: 'observability', name: 'Observability', icon: '📊' },
      bodyMarkdown: '',
      screenshots: [],
      sourceComponent: 'TelemetryDashboard',
      version: 2,
      updatedAt: '2026-02-01T00:00:00Z',
    };

    const telemetryBody = '## Telemetry\n\nCaptures usage metrics.';

    await buildTempCorpus([sharkDocStub, telemetryDocStub], {
      'shark-mitigation': SHARK_BODY,
      'telemetry-overview': telemetryBody,
    });

    const docs = await loadCorpus(tempDir);

    expect(docs).toHaveLength(2);
    const shark = docs.find((d) => d.id === 'shark-mitigation')!;
    const telemetry = docs.find((d) => d.id === 'telemetry-overview')!;
    expect(shark.bodyMarkdown).toBe(SHARK_BODY);
    expect(telemetry.bodyMarkdown).toBe(telemetryBody);
  });

  it('throws a clear error when a doc index.md is missing', async () => {
    // Write manifest but NO index.md for the doc
    const manifest: DocsManifest = {
      categories: [sharkDocStub.category],
      docs: [sharkDocStub],
    };
    await writeFile(
      path.join(tempDir, 'manifest.json'),
      JSON.stringify(manifest),
      'utf-8',
    );
    // No shark-mitigation/index.md written

    await expect(loadCorpus(tempDir)).rejects.toThrow('shark-mitigation');
  });
});

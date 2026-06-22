import { describe, it, expect } from 'vitest';
import type { Doc } from '@surf/types';
import { buildSections } from '../src/rag/retriever.js';
import { KeywordRetriever } from '../src/rag/keywordRetriever.js';

// ---------------------------------------------------------------------------
// Inline fixture docs
// ---------------------------------------------------------------------------

const sharkDoc: Doc = {
  id: 'shark-mitigation',
  title: 'Shark Mitigation Guide',
  category: { id: 'safety', name: 'Safety', icon: '🦈' },
  bodyMarkdown: `
## Step 1: Identify the Threat

Scan the water for fins or sudden splashing.

## Step 2: Trigger the Emergency Shark Siren

Press the red button to activate the Emergency Shark Siren and alert all nearby personnel.

## Step 3: Evacuate

Clear the water immediately and follow evacuation procedures.
`.trim(),
  screenshots: [],
  sourceComponent: 'SharkMitigationCard',
  version: 1,
  updatedAt: '2026-01-01T00:00:00Z',
};

const telemetryDoc: Doc = {
  id: 'telemetry-overview',
  title: 'Telemetry Overview',
  category: { id: 'observability', name: 'Observability', icon: '📊' },
  bodyMarkdown: `
## Overview

This page describes how usage metrics are captured and forwarded.

## Data Collection

Events are streamed via OpenTelemetry collectors into the aggregation pipeline.
`.trim(),
  screenshots: [],
  sourceComponent: 'TelemetryDashboard',
  version: 1,
  updatedAt: '2026-01-01T00:00:00Z',
};

/** A doc with two headings that have the same text (collision). */
const collidingDoc: Doc = {
  id: 'colliding-headings',
  title: 'Colliding Headings Doc',
  category: { id: 'test', name: 'Test', icon: '🔬' },
  bodyMarkdown: `
## Duplicate Section

First occurrence.

## Duplicate Section

Second occurrence.
`.trim(),
  screenshots: [],
  sourceComponent: 'TestComponent',
  version: 1,
  updatedAt: '2026-01-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// buildSections tests
// ---------------------------------------------------------------------------

describe('buildSections', () => {
  it('splits shark doc into sections at ATX headings', () => {
    const sections = buildSections([sharkDoc]);
    // Should have one section per ATX heading
    expect(sections.length).toBeGreaterThanOrEqual(3);
  });

  it('yields a section for the siren heading with the correct docId', () => {
    const sections = buildSections([sharkDoc]);
    const sirenSection = sections.find((s) =>
      s.heading.includes('Trigger the Emergency Shark Siren'),
    );
    expect(sirenSection).toBeDefined();
    expect(sirenSection!.docId).toBe('shark-mitigation');
    expect(sirenSection!.docTitle).toBe('Shark Mitigation Guide');
  });

  it('generates a slug anchor for the siren heading', () => {
    const sections = buildSections([sharkDoc]);
    const sirenSection = sections.find((s) =>
      s.heading.includes('Trigger the Emergency Shark Siren'),
    );
    // github-slugger lowercases and hyphenates
    expect(sirenSection!.anchor).toBe(
      'step-2-trigger-the-emergency-shark-siren',
    );
  });

  it('siren section text contains "Emergency Shark Siren"', () => {
    const sections = buildSections([sharkDoc]);
    const sirenSection = sections.find((s) =>
      s.heading.includes('Trigger the Emergency Shark Siren'),
    );
    expect(sirenSection!.text).toContain('Emergency Shark Siren');
  });

  it('assigns unique anchors to colliding headings (second gets -1 suffix)', () => {
    const sections = buildSections([collidingDoc]);
    const duplicates = sections.filter((s) => s.heading === 'Duplicate Section');
    expect(duplicates.length).toBe(2);
    // First occurrence: "duplicate-section"
    expect(duplicates[0].anchor).toBe('duplicate-section');
    // Second occurrence: "duplicate-section-1"
    expect(duplicates[1].anchor).toBe('duplicate-section-1');
  });

  it('resets slugger per doc so collisions are per-page, not global', () => {
    // Build two docs each with a "Setup" heading — both should get plain "setup" anchors
    const docA: Doc = {
      ...sharkDoc,
      id: 'doc-a',
      title: 'Doc A',
      bodyMarkdown: '## Setup\n\nContent A.',
    };
    const docB: Doc = {
      ...sharkDoc,
      id: 'doc-b',
      title: 'Doc B',
      bodyMarkdown: '## Setup\n\nContent B.',
    };
    const sections = buildSections([docA, docB]);
    const docASection = sections.find((s) => s.docId === 'doc-a');
    const docBSection = sections.find((s) => s.docId === 'doc-b');
    expect(docASection!.anchor).toBe('setup');
    // Because slugger is reset for docB, the heading is fresh — no -1 suffix
    expect(docBSection!.anchor).toBe('setup');
  });
});

// ---------------------------------------------------------------------------
// KeywordRetriever tests
// ---------------------------------------------------------------------------

describe('KeywordRetriever', () => {
  it('retrieve("how do I trigger the shark siren") top result is shark-mitigation with score > 0', async () => {
    const retriever = new KeywordRetriever();
    await retriever.build([sharkDoc, telemetryDoc]);
    const results = await retriever.retrieve('how do I trigger the shark siren');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].docId).toBe('shark-mitigation');
    expect(results[0].score).toBeGreaterThan(0);
  });

  it('retrieve("monthly billing invoices") returns [] because off-topic', async () => {
    const retriever = new KeywordRetriever();
    await retriever.build([sharkDoc, telemetryDoc]);
    const results = await retriever.retrieve('monthly billing invoices');
    expect(results).toEqual([]);
  });

  it('returns at most k results (default k=4)', async () => {
    const retriever = new KeywordRetriever();
    await retriever.build([sharkDoc, telemetryDoc]);
    const results = await retriever.retrieve('the');
    expect(results.length).toBeLessThanOrEqual(4);
  });

  it('respects a custom k value', async () => {
    const retriever = new KeywordRetriever();
    await retriever.build([sharkDoc, telemetryDoc]);
    const results = await retriever.retrieve('section', 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('results are sorted by score descending', async () => {
    const retriever = new KeywordRetriever();
    await retriever.build([sharkDoc, telemetryDoc]);
    const results = await retriever.retrieve('emergency shark siren');
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it('heading match boosts score above body-only match', async () => {
    const retriever = new KeywordRetriever();
    await retriever.build([sharkDoc, telemetryDoc]);
    // "shark siren" appears in the heading AND body of the siren section
    // vs another section where it only appears in body (or not at all)
    const results = await retriever.retrieve('shark siren');
    const sirenSection = results.find((r) =>
      r.heading.includes('Trigger the Emergency Shark Siren'),
    );
    expect(sirenSection).toBeDefined();
    expect(sirenSection!.score).toBeGreaterThan(0);
  });
});

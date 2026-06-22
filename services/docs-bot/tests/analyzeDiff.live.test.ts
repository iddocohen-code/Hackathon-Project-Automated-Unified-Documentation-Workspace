import { describe, it, expect } from 'vitest';
import { analyzeDiff } from '../src/claude/analyzeDiff.js';
import { aggregateContext } from '../src/context/source.js';
import { FixtureJiraSource } from '../src/context/fixtures/jira.js';
import { FixtureSlackSource } from '../src/context/fixtures/slack.js';
import { FixtureConfluenceSource } from '../src/context/fixtures/confluence.js';
import type { PullRequestEvent, DocsManifest } from '@surf/types';
import type { FilePatch } from '../src/git/diff.js';

// Skip the entire suite when no API key is present
const hasKey = Boolean(process.env['ANTHROPIC_API_KEY']);

// A purely static diff: adds a read-only label with no interactive controls
const STATIC_DIFF: FilePatch[] = [
  {
    path: 'apps/surf-console/components/console/WaveHeightChart.tsx',
    patch: `--- a/apps/surf-console/components/console/WaveHeightChart.tsx
+++ b/apps/surf-console/components/console/WaveHeightChart.tsx
@@ -3,6 +3,7 @@
 export function WaveHeightChart() {
   return (
     <div className="wave-chart">
+      <span className="last-updated-label">Last updated: {new Date().toLocaleTimeString()}</span>
       <h2>Wave Height</h2>`,
  },
];

// The demo siren diff: adding an Emergency Shark Siren button to SharkMitigationCard
const SIREN_DIFF: FilePatch[] = [
  {
    path: 'apps/surf-console/components/console/SharkMitigationCard.tsx',
    patch: `--- a/apps/surf-console/components/console/SharkMitigationCard.tsx
+++ b/apps/surf-console/components/console/SharkMitigationCard.tsx
@@ -1,6 +1,7 @@
 import React from 'react';
+import { triggerSiren } from '../../actions/siren';

 export function SharkMitigationCard() {
   return (
     <div className="mitigation-card">
+      <button
+        className="siren-btn emergency-red full-width"
+        onClick={() => triggerSiren({ zone: 'current', broadcast: true })}
+      >
+        Emergency Shark Siren
+      </button>
       <h2>Shark Mitigation Protocol</h2>`,
  },
];

// Minimal docs manifest containing just the shark-mitigation doc and others
const MANIFEST: DocsManifest = {
  categories: [
    { id: 'incident-protocols', name: 'Incident Protocols', icon: 'shield' },
    { id: 'telemetry-metrics', name: 'Telemetry & Metrics', icon: 'chart-bar' },
  ],
  docs: [
    {
      id: 'shark-mitigation',
      title: 'Shark Mitigation Protocol',
      category: { id: 'incident-protocols', name: 'Incident Protocols', icon: 'shield' },
      bodyMarkdown: '',
      screenshots: [],
      sourceComponent: 'apps/surf-console/components/console/SharkMitigationCard.tsx',
      version: 3,
      updatedAt: '2025-03-12T10:00:00Z',
    },
    {
      id: 'storm-surge-response',
      title: 'Storm Surge Response',
      category: { id: 'incident-protocols', name: 'Incident Protocols', icon: 'shield' },
      bodyMarkdown: '',
      screenshots: [],
      sourceComponent: 'apps/surf-console/components/console/StormSurgeCard.tsx',
      version: 1,
      updatedAt: '2025-01-20T08:30:00Z',
    },
    {
      id: 'wave-height-telemetry',
      title: 'Wave Height Telemetry',
      category: { id: 'telemetry-metrics', name: 'Telemetry & Metrics', icon: 'chart-bar' },
      bodyMarkdown: '',
      screenshots: [],
      sourceComponent: 'apps/surf-console/components/console/WaveHeightChart.tsx',
      version: 2,
      updatedAt: '2025-04-05T14:15:00Z',
    },
  ],
};

const PR: PullRequestEvent = {
  prUrl: 'https://github.com/example/surf/pull/42',
  mergedSha: 'abc1234',
  changedPaths: ['apps/surf-console/components/console/SharkMitigationCard.tsx'],
  title: 'feat: add one-press Emergency Shark Siren to mitigation panel',
  body: 'Resolves SURF-142. Lifeguards need to trigger zone-wide evacuation instantly. See #surf-safety discussion.',
};

describe.skipIf(!hasKey)('analyzeDiff (live, requires ANTHROPIC_API_KEY)', () => {
  it(
    'identifies shark-mitigation doc, critical severity, and siren button in structural change',
    async () => {
      const context = await aggregateContext(PR, [
        new FixtureJiraSource(),
        new FixtureSlackSource(),
        new FixtureConfluenceSource(),
      ]);

      const result = await analyzeDiff({
        diff: SIREN_DIFF,
        context,
        existingDocs: MANIFEST,
      });

      // Must correctly identify the affected doc
      expect(result.docId).toBe('shark-mitigation');

      // Must classify as critical (life-safety siren trigger)
      expect(result.severity).toBe('critical');

      // Structural change must mention the siren
      const sc = result.structuralChange.toLowerCase();
      expect(
        sc.includes('siren') || sc.includes('emergency'),
        `structuralChange should mention siren or emergency, got: "${result.structuralChange}"`,
      ).toBe(true);

      // All fields must be non-empty
      expect(result.docId.length).toBeGreaterThan(0);
      expect(result.targetRoute.length).toBeGreaterThan(0);
      expect(result.structuralChange.length).toBeGreaterThan(0);
      expect(result.humanIntent.length).toBeGreaterThan(0);
    },
    // 60 second timeout for live API call with extended thinking
    60_000,
  );

  it(
    'siren diff: interactions includes Emergency Shark Siren entry',
    async () => {
      const context = await aggregateContext(PR, [
        new FixtureJiraSource(),
        new FixtureSlackSource(),
        new FixtureConfluenceSource(),
      ]);

      const result = await analyzeDiff({
        diff: SIREN_DIFF,
        context,
        existingDocs: MANIFEST,
      });

      // interactions must be an array
      expect(Array.isArray(result.interactions)).toBe(true);

      // Must include at least one entry for the Emergency Shark Siren button
      const sirenEntry = result.interactions.find(
        (i) => /Emergency Shark Siren/i.test(i.label),
      );
      expect(
        sirenEntry,
        `interactions should contain an entry with label matching /Emergency Shark Siren/i, got: ${JSON.stringify(result.interactions)}`,
      ).toBeDefined();

      // The reveals field must describe the activated siren state (banner, siren active, evacuation, broadcast, etc.)
      expect(
        /banner|siren active|siren|evacuation|broadcast/i.test(sirenEntry!.reveals),
        `reveals should match /banner|siren active|siren|evacuation|broadcast/i, got: "${sirenEntry!.reveals}"`,
      ).toBe(true);
    },
    60_000,
  );

  it(
    'static-only diff: interactions is empty array',
    async () => {
      const staticPR: PullRequestEvent = {
        prUrl: 'https://github.com/example/surf/pull/99',
        mergedSha: 'def5678',
        changedPaths: ['apps/surf-console/components/console/WaveHeightChart.tsx'],
        title: 'chore: add last-updated timestamp label to wave height chart',
        body: 'Minor cosmetic addition — shows last refresh time.',
      };

      const context = await aggregateContext(staticPR, [
        new FixtureJiraSource(),
        new FixtureSlackSource(),
        new FixtureConfluenceSource(),
      ]);

      const result = await analyzeDiff({
        diff: STATIC_DIFF,
        context,
        existingDocs: MANIFEST,
      });

      // interactions must be an empty array for a purely static change
      expect(Array.isArray(result.interactions)).toBe(true);
      expect(
        result.interactions,
        `interactions should be [] for a static-only diff, got: ${JSON.stringify(result.interactions)}`,
      ).toHaveLength(0);
    },
    60_000,
  );
});

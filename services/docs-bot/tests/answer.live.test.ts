import { describe, it, expect, beforeAll } from 'vitest';
import type { Doc } from '@surf/types';
import { KeywordRetriever } from '../src/rag/keywordRetriever.js';
import { answerQuery } from '../src/rag/answer.js';

// Skip when no Anthropic key (keeps keyless CI green)
const hasKey = Boolean(process.env['ANTHROPIC_API_KEY']);

// ---------------------------------------------------------------------------
// Fixture docs (after-state shark doc includes the Emergency Shark Siren step)
// ---------------------------------------------------------------------------

const sharkDoc: Doc = {
  id: 'shark-mitigation',
  title: 'Shark Mitigation Guide',
  category: { id: 'safety', name: 'Safety', icon: '🦈' },
  bodyMarkdown: `
## Step 1: Identify the Threat

Scan the water for fins or sudden splashing near the perimeter. Alert nearby personnel verbally before taking action.

## Step 2: Trigger the Emergency Shark Siren

Press the red button on the control panel to activate the Emergency Shark Siren. The siren emits a 120 dB alert tone audible across the entire facility and automatically locks the access gates.

## Step 3: Evacuate

Clear the water immediately. All personnel must follow the posted evacuation routes and proceed to the muster point at Zone C.
`.trim(),
  screenshots: [],
  sourceComponent: 'SharkMitigationCard',
  version: 4,
  updatedAt: '2026-06-01T00:00:00Z',
};

const telemetryDoc: Doc = {
  id: 'telemetry-overview',
  title: 'Telemetry Overview',
  category: { id: 'observability', name: 'Observability', icon: '📊' },
  bodyMarkdown: `
## Overview

This page describes how usage metrics are captured and forwarded to the aggregation pipeline.

## Data Collection

Events are streamed via OpenTelemetry collectors into the central metrics store. Each collector runs as a sidecar container.

## Retention

Raw events are retained for 30 days. Aggregated metrics are retained for 12 months.
`.trim(),
  screenshots: [],
  sourceComponent: 'TelemetryDashboard',
  version: 1,
  updatedAt: '2026-01-01T00:00:00Z',
};

const accessControlDoc: Doc = {
  id: 'access-control',
  title: 'Access Control Settings',
  category: { id: 'security', name: 'Security', icon: '🔒' },
  bodyMarkdown: `
## Overview

Manage user roles and permissions from the Access Control panel in Settings.

## Roles

Three built-in roles are available: Viewer, Operator, and Admin. Each role has a fixed permission set.

## Inviting Users

Navigate to Settings > Access Control > Invite User. Enter the user's email address and select a role, then click Send Invitation.
`.trim(),
  screenshots: [],
  sourceComponent: 'AccessControlPanel',
  version: 2,
  updatedAt: '2026-03-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Live tests
// ---------------------------------------------------------------------------

describe.skipIf(!hasKey)('answerQuery (live, requires ANTHROPIC_API_KEY)', () => {
  let retriever: KeywordRetriever;

  beforeAll(async () => {
    retriever = new KeywordRetriever();
    await retriever.build([sharkDoc, telemetryDoc, accessControlDoc]);
  });

  it(
    'answers "How do I trigger the shark siren?" with a grounded answer citing shark-mitigation',
    async () => {
      const result = await answerQuery('How do I trigger the shark siren?', retriever);

      console.log('[answer.live] query:', result.query);
      console.log('[answer.live] answer:', result.answer);
      console.log('[answer.live] citations:', JSON.stringify(result.citations, null, 2));

      // Answer must mention the siren by name
      expect(result.answer).toMatch(/Emergency Shark Siren/i);

      // Must have at least one citation
      expect(result.citations.length).toBeGreaterThan(0);

      // First citation must point to shark-mitigation
      expect(result.citations[0]!.docId).toBe('shark-mitigation');

      // DeepLink must start with /docs/shark-mitigation#
      expect(result.citations[0]!.deepLink).toMatch(/^\/docs\/shark-mitigation#/);
    },
    60_000,
  );

  it(
    'returns empty citations for an off-topic billing query (no relevant passages)',
    async () => {
      const result = await answerQuery('How do I view my monthly billing invoice?', retriever);

      console.log('[answer.live] billing query answer:', result.answer);
      console.log('[answer.live] billing citations:', result.citations);

      // The retriever returns [] for billing — short-circuit path
      expect(result.citations.length).toBe(0);
    },
    30_000,
  );
});

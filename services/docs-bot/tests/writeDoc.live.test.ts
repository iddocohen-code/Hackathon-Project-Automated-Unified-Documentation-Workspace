import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { writeDoc } from '../src/claude/writeDoc.js';
import { aggregateContext } from '../src/context/source.js';
import { FixtureJiraSource } from '../src/context/fixtures/jira.js';
import { FixtureSlackSource } from '../src/context/fixtures/slack.js';
import { FixtureConfluenceSource } from '../src/context/fixtures/confluence.js';
import type { PullRequestEvent } from '@surf/types';
import type { DiffAnalysis } from '../src/claude/schemas.js';

// Skip when no API key (keeps keyless CI green)
const hasKey = Boolean(process.env['ANTHROPIC_API_KEY']);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The demo DiffAnalysis: siren button added to SharkMitigationCard
const SIREN_DIFF_ANALYSIS: DiffAnalysis = {
  docId: 'shark-mitigation',
  targetRoute: '/docs/shark-mitigation',
  structuralChange:
    'Added `Emergency Shark Siren` action button wired to `triggerSiren({ zone: "current", broadcast: true })` in `SharkMitigationCard`. The button carries class `siren-btn emergency-red full-width` and triggers zone-wide broadcast on click.',
  humanIntent:
    'Lifeguards needed a one-press mechanism to trigger zone-wide evacuation in under 500 ms — manual PA coordination was too slow for close-range shark encounters. SURF-142 (Jira) and the #surf-safety Slack discussion confirmed the safety rationale.',
  severity: 'critical',
};

const PR: PullRequestEvent = {
  prUrl: 'https://github.com/example/surf/pull/42',
  mergedSha: 'abc1234',
  changedPaths: ['apps/surf-console/components/console/SharkMitigationCard.tsx'],
  title: 'feat: add one-press Emergency Shark Siren to mitigation panel',
  body: 'Resolves SURF-142. Lifeguards need to trigger zone-wide evacuation instantly. See #surf-safety discussion.',
};

describe.skipIf(!hasKey)('writeDoc (live, requires ANTHROPIC_API_KEY)', () => {
  it(
    'regenerates shark-mitigation doc with Emergency Shark Siren ## step, no inline image, Jira/Slack in intentSource',
    async () => {
      // Read the real v3 shark body from the repo
      const sharkBodyPath = path.resolve(
        __dirname,
        '../../../apps/surf-console/content/docs/shark-mitigation/index.md',
      );
      const existingBodyMarkdown = await readFile(sharkBodyPath, 'utf-8');

      // Gather context references using fixtures
      const context = await aggregateContext(PR, [
        new FixtureJiraSource(),
        new FixtureSlackSource(),
        new FixtureConfluenceSource(),
      ]);

      // Screenshot metadata stub (path + alt — no actual buffer needed for writeDoc)
      const screenshotMeta = {
        alt: 'SharkMitigationCard showing the new Emergency Shark Siren red button at top of panel',
        path: 'content/docs/shark-mitigation/screenshots/v4-siren.png',
      };

      const draft = await writeDoc({
        existingDoc: {
          id: 'shark-mitigation',
          title: 'Shark Mitigation Protocol',
          bodyMarkdown: existingBodyMarkdown,
          version: 3,
        },
        diffAnalysis: SIREN_DIFF_ANALYSIS,
        context,
        screenshotMeta,
      });

      // Log the output so the CI / test runner captures it
      console.log('\n=== LIVE WRITER OUTPUT ===');
      console.log('Title:', draft.title);
      console.log('\n--- bodyMarkdown excerpt (first 1500 chars) ---');
      console.log(draft.bodyMarkdown.slice(0, 1500));
      console.log('\n--- changeSummary ---');
      console.log(JSON.stringify(draft.changeSummary, null, 2));
      console.log('=== END LIVE WRITER OUTPUT ===\n');

      // 1. bodyMarkdown contains "Emergency Shark Siren"
      expect(
        draft.bodyMarkdown.toLowerCase().includes('emergency shark siren'),
        `bodyMarkdown should contain "Emergency Shark Siren", got excerpt: "${draft.bodyMarkdown.slice(0, 300)}"`,
      ).toBe(true);

      // 2. bodyMarkdown has a ## step heading about the siren
      const sirenStepMatch = /^##\s+Step\s+\d+[:\s].*siren/im.exec(draft.bodyMarkdown);
      expect(
        sirenStepMatch !== null,
        `bodyMarkdown should have a ## Step heading mentioning siren. Got headings: ${
          draft.bodyMarkdown.match(/^##\s+.+$/gm)?.join(' | ') ?? '(none)'
        }`,
      ).toBe(true);

      // 3. bodyMarkdown still uses ## heading steps (at least 4 steps: existing 4 + new 1 = 5)
      const stepHeadings = draft.bodyMarkdown.match(/^##\s+Step\s+\d+/gm) ?? [];
      expect(
        stepHeadings.length,
        `Expected at least 5 ## Step headings (4 existing + 1 new siren step), got ${stepHeadings.length}: ${stepHeadings.join(', ')}`,
      ).toBeGreaterThanOrEqual(5);

      // 4. bodyMarkdown contains NO inline markdown images
      expect(
        draft.bodyMarkdown.includes('!['),
        `bodyMarkdown must NOT contain inline markdown images (![...](...)). Found: ${
          draft.bodyMarkdown.match(/!\[.*?\]\(.*?\)/g)?.join(', ') ?? '(none found but check failed)'
        }`,
      ).toBe(false);

      // 5. changeSummary.intentSource references Jira and/or Slack
      const intentSrc = draft.changeSummary.intentSource.toLowerCase();
      expect(
        intentSrc.includes('jira') || intentSrc.includes('surf-142') || intentSrc.includes('slack') || intentSrc.includes('surf-safety'),
        `changeSummary.intentSource should reference Jira and/or Slack, got: "${draft.changeSummary.intentSource}"`,
      ).toBe(true);

      // 6. All fields non-empty
      expect(draft.bodyMarkdown.length).toBeGreaterThan(100);
      expect(draft.changeSummary.headline.length).toBeGreaterThan(0);
      expect(draft.changeSummary.detail.length).toBeGreaterThan(0);
      expect(draft.changeSummary.intentSource.length).toBeGreaterThan(0);
      expect(draft.title.length).toBeGreaterThan(0);
    },
    120_000, // 2-minute timeout for Opus 4.8 with extended thinking
  );
});

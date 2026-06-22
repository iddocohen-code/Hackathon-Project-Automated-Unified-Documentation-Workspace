/**
 * runJob.e2e.live.test.ts — LIVE end-to-end of the interactive-capture path.
 *
 * Requires:
 *   - ANTHROPIC_API_KEY (present in services/docs-bot/.env)
 *   - the surf-console portal running at http://localhost:3000 serving the
 *     AFTER-state: the SharkMitigationCard with an "Emergency Shark Siren"
 *     button that, when clicked, reveals an evacuation banner / "Siren active".
 *
 * This exercises Stage 4-8 of the pipeline with the REAL capture (Playwright),
 * REAL per-state vision check, REAL writeDoc (Opus), assembling a MULTI-state
 * Doc and publishing every per-state PNG into temp content dirs with a no-op
 * commit. It asserts the multi-screenshot contract end-to-end.
 *
 * NOTE: We compose the post-analyze stages directly (rather than calling
 * makeRunJob, which would re-run getDiff/analyzeDiff against the repo) so the
 * DiffAnalysis — including the siren interaction — is deterministic. The
 * capture → per-state vision → multi-screenshot assembly → multi-PNG publish
 * logic under test is the exact same code paths.
 */

import { describe, it, expect } from 'vitest';
import { mkdtemp, cp, mkdir, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Doc, ChangeEntry, DocsManifest, Screenshot } from '@surf/types';

import { PlaywrightCapture } from '../src/capture/capture.js';
import type { CapturedState } from '../src/capture/capture.js';
import { visionCheck } from '../src/claude/visionCheck.js';
import { writeDoc } from '../src/claude/writeDoc.js';
import { publish } from '../src/publish/publisher.js';
import type { PublishScreenshot } from '../src/publish/publisher.js';
import { aggregateContext } from '../src/context/source.js';
import { FixtureJiraSource } from '../src/context/fixtures/jira.js';
import { FixtureSlackSource } from '../src/context/fixtures/slack.js';
import { FixtureConfluenceSource } from '../src/context/fixtures/confluence.js';
import type { DiffAnalysis } from '../src/claude/schemas.js';
import type { PullRequestEvent } from '@surf/types';

const hasKey = Boolean(process.env['ANTHROPIC_API_KEY']);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const realDocsDir = path.resolve(repoRoot, 'apps/surf-console/content/docs');
const PORTAL_URL = 'http://localhost:3000';

const SIREN_DIFF_ANALYSIS: DiffAnalysis = {
  docId: 'shark-mitigation',
  targetRoute: '/',
  structuralChange:
    'Added `Emergency Shark Siren` action button to `SharkMitigationCard`. The button is wired to trigger a zone-wide evacuation broadcast on click.',
  humanIntent:
    'Lifeguards needed a one-press mechanism to trigger zone-wide evacuation in under 500 ms. SURF-142 and the #surf-safety Slack discussion confirmed the safety rationale.',
  severity: 'critical',
  interactions: [
    {
      label: 'Emergency Shark Siren',
      reveals:
        'An evacuation banner / active-siren indicator ("Siren active") appears, confirming the zone-wide evacuation broadcast was triggered.',
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

const noopCommit = async (_paths: string[], _message: string): Promise<void> => {
  /* no-op for tests */
};

async function seedTempDir(): Promise<{ docsContentDir: string; screenshotsPublicDir: string }> {
  const base = await mkdtemp(path.join(tmpdir(), 'runjob-e2e-'));
  const docsContentDir = path.join(base, 'docs');
  const screenshotsPublicDir = path.join(base, 'screenshots');
  await mkdir(docsContentDir, { recursive: true });
  await mkdir(screenshotsPublicDir, { recursive: true });
  await cp(realDocsDir, docsContentDir, { recursive: true });
  return { docsContentDir, screenshotsPublicDir };
}

describe.skipIf(!hasKey)('runJob interactive e2e (live, requires API key + portal)', () => {
  it(
    'captures default + activated states, vision-checks each, publishes a 2-screenshot Doc',
    async () => {
      const { docsContentDir, screenshotsPublicDir } = await seedTempDir();
      const captureSelector = `[data-doc-target="${SIREN_DIFF_ANALYSIS.docId}"]`;

      // --- Stage 4: multi-state capture ---
      const capture = new PlaywrightCapture(PORTAL_URL);
      const capturedStates = await capture.captureStates({
        route: SIREN_DIFF_ANALYSIS.targetRoute,
        selector: captureSelector,
        interactions: SIREN_DIFF_ANALYSIS.interactions,
      });
      expect(capturedStates.length).toBe(2); // default + siren-active

      // --- Stage 5: per-state vision check (default halts, activated degrades) ---
      const passingStates: CapturedState[] = [];
      for (let i = 0; i < capturedStates.length; i += 1) {
        const captured = capturedStates[i]!;
        const isDefault = i === 0;
        const claim = isDefault
          ? SIREN_DIFF_ANALYSIS.structuralChange
          : SIREN_DIFF_ANALYSIS.interactions[i - 1]!.reveals;
        const verdict = await visionCheck(captured.pngBuffer, claim);
        console.log(`[e2e] vision state=${captured.state} showsChange=${verdict.showsChange} note=${verdict.note}`);
        if (verdict.showsChange) passingStates.push(captured);
        else if (isDefault) throw new Error(`default state failed vision: ${verdict.note}`);
      }
      // Both default and activated must pass for the full demo
      expect(passingStates.length).toBe(2);

      // --- Stage 6: writeDoc ---
      const manifest = JSON.parse(
        await readFile(path.join(docsContentDir, 'manifest.json'), 'utf-8'),
      ) as DocsManifest;
      const found = manifest.docs.find((d) => d.id === SIREN_DIFF_ANALYSIS.docId)!;
      const existingBody = await readFile(
        path.join(docsContentDir, SIREN_DIFF_ANALYSIS.docId, 'index.md'),
        'utf-8',
      );
      const context = await aggregateContext(PR, [
        new FixtureJiraSource(),
        new FixtureSlackSource(),
        new FixtureConfluenceSource(),
      ]);
      const newVersion = found.version + 1;
      const defaultState = passingStates[0]!;
      const draft = await writeDoc({
        existingDoc: { id: found.id, title: found.title, bodyMarkdown: existingBody, version: found.version },
        diffAnalysis: SIREN_DIFF_ANALYSIS,
        context,
        screenshotMeta: {
          alt: defaultState.alt,
          path: `/docs-screenshots/${SIREN_DIFF_ANALYSIS.docId}/screenshot-v${newVersion}-${defaultState.state}.png`,
        },
        capturedStates: passingStates.map((s) => ({ state: s.state, alt: s.alt })),
      });

      // --- Stage 7: assemble multi-screenshot Doc + ChangeEntry ---
      const now = new Date().toISOString();
      const publishScreenshots: PublishScreenshot[] = passingStates.map((s) => {
        const screenshot: Screenshot = {
          path: `/docs-screenshots/${SIREN_DIFF_ANALYSIS.docId}/screenshot-v${newVersion}-${s.state}.png`,
          alt: s.alt,
          capturedAt: now,
          targetSelector: captureSelector,
        };
        return { screenshot, pngBuffer: s.pngBuffer };
      });
      const assembledDoc: Doc = {
        ...found,
        title: draft.title,
        bodyMarkdown: draft.bodyMarkdown,
        version: newVersion,
        updatedAt: now,
        lastChange: draft.changeSummary,
        screenshots: publishScreenshots.map((ps) => ps.screenshot),
      };
      const afterScreenshot =
        publishScreenshots.length > 1
          ? publishScreenshots[publishScreenshots.length - 1]!.screenshot
          : publishScreenshots[0]!.screenshot;
      const changeEntry: ChangeEntry = {
        id: 'chg-e2e',
        docId: SIREN_DIFF_ANALYSIS.docId,
        summary: draft.changeSummary,
        severity: SIREN_DIFF_ANALYSIS.severity,
        prUrl: PR.prUrl,
        contextRefs: context,
        screenshotDiff: { after: afterScreenshot.path },
        createdAt: now,
      };

      // --- Stage 8: publish (no-op commit, temp dirs) ---
      await publish({
        doc: assembledDoc,
        screenshots: publishScreenshots,
        changeEntry,
        docsContentDir,
        screenshotsPublicDir,
        commitFn: noopCommit,
      });

      // ===== Assertions (brief Step 2) =====

      // 1. Doc has exactly 2 screenshots (default + activated)
      expect(assembledDoc.screenshots.length).toBe(2);
      const states = assembledDoc.screenshots.map((s) => path.basename(s.path));
      console.log('[e2e] screenshot web paths:', assembledDoc.screenshots.map((s) => s.path));
      expect(states.some((f) => f.includes('-default.png'))).toBe(true);
      expect(states.some((f) => f.includes('-active.png'))).toBe(true);

      // 2. Both PNGs written to disk with matching web paths in the manifest
      const writtenManifest = JSON.parse(
        await readFile(path.join(docsContentDir, 'manifest.json'), 'utf-8'),
      ) as DocsManifest;
      const sharkDoc = writtenManifest.docs.find((d) => d.id === SIREN_DIFF_ANALYSIS.docId)!;
      expect(sharkDoc.version).toBe(newVersion);
      expect(sharkDoc.bodyMarkdown).toBe(''); // HARD contract
      expect(sharkDoc.screenshots.length).toBe(2);
      for (const sc of sharkDoc.screenshots) {
        expect(sc.path).toMatch(/^\/docs-screenshots\/shark-mitigation\//);
        const fsPath = path.join(screenshotsPublicDir, sharkDoc.id, path.basename(sc.path));
        const st = await stat(fsPath);
        expect(st.isFile()).toBe(true);
        expect(st.size).toBeGreaterThan(0);
      }

      // 3. v4 index.md body documents pressing the siren AND the resulting state
      const body = (await readFile(path.join(docsContentDir, SIREN_DIFF_ANALYSIS.docId, 'index.md'), 'utf-8'));
      console.log('[e2e] v4 body excerpt:\n', body.slice(0, 1200));
      const lower = body.toLowerCase();
      expect(lower.includes('emergency shark siren') || lower.includes('siren')).toBe(true);
      expect(
        lower.includes('evacuat') || lower.includes('siren active') || lower.includes('active'),
        `v4 body should mention the resulting evacuation/active state. Got headings: ${body.match(/^#+ .+$/gm)?.join(' | ')}`,
      ).toBe(true);

      // 4. changeEntry.screenshotDiff.after is the ACTIVATED state's path
      const changelog = JSON.parse(
        await readFile(path.join(docsContentDir, 'changelog.json'), 'utf-8'),
      ) as ChangeEntry[];
      const written = changelog.find((e) => e.id === 'chg-e2e')!;
      console.log('[e2e] screenshotDiff.after:', written.screenshotDiff?.after);
      expect(written.screenshotDiff?.after).toMatch(/-active\.png$/);

      // 5. categories preserved verbatim, other docs untouched
      expect(writtenManifest.categories).toHaveLength(4);
      expect(writtenManifest.docs.find((d) => d.id === 'storm-surge-response')?.version).toBe(1);
      expect(writtenManifest.docs.find((d) => d.id === 'wave-height-telemetry')?.version).toBe(2);
    },
    180_000,
  );
});

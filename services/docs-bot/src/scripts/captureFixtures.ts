/**
 * captureFixtures.ts — one-off script to capture v4 canned assets for REPLAY_MODE.
 *
 * Requires:
 *   - ANTHROPIC_API_KEY in environment
 *   - surf-console portal running at http://localhost:3000 (after-state with siren button)
 *
 * Seeds a TEMP dir from real content/docs, captures the siren interaction via
 * PlaywrightCapture, runs vision check + writeDoc + publish (with noopCommit
 * into temp dirs), then copies the resulting fixtures to:
 *   services/docs-bot/fixtures/replay/
 *     shark-mitigation.v4.md
 *     shark-default.png
 *     shark-active.png
 *     shark-interaction.webm   (if captured)
 *     change-entry.json
 *
 * Does NOT modify apps/surf-console/content or apps/surf-console/public.
 * Run with:
 *   tsx --tsconfig services/docs-bot/tsconfig.json services/docs-bot/src/scripts/captureFixtures.ts
 */

import 'dotenv/config';
import { mkdtemp, cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Doc, ChangeEntry, DocsManifest, Screenshot } from '@surf/types';

import { PlaywrightCapture } from '../capture/capture.js';
import type { CapturedState } from '../capture/capture.js';
import { visionCheck } from '../claude/visionCheck.js';
import { writeDoc } from '../claude/writeDoc.js';
import { publish } from '../publish/publisher.js';
import type { PublishScreenshot } from '../publish/publisher.js';
import { aggregateContext } from '../context/source.js';
import { FixtureJiraSource } from '../context/fixtures/jira.js';
import { FixtureSlackSource } from '../context/fixtures/slack.js';
import { FixtureConfluenceSource } from '../context/fixtures/confluence.js';
import type { DiffAnalysis } from '../claude/schemas.js';
import type { PullRequestEvent } from '@surf/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../../..');
const realDocsDir = path.resolve(repoRoot, 'apps/surf-console/content/docs');
const fixturesDir = path.resolve(__dirname, '../../fixtures/replay');
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
  /* no-op for script — we don't want to git commit anything */
};

async function main(): Promise<void> {
  console.log('[captureFixtures] Starting fixture capture...');
  console.log('[captureFixtures] repoRoot:', repoRoot);
  console.log('[captureFixtures] realDocsDir:', realDocsDir);
  console.log('[captureFixtures] fixturesDir:', fixturesDir);

  // Seed temp dir from real content/docs (NEVER write to real dirs)
  const base = await mkdtemp(path.join(tmpdir(), 'capture-fixtures-'));
  const docsContentDir = path.join(base, 'docs');
  const screenshotsPublicDir = path.join(base, 'screenshots');
  await mkdir(docsContentDir, { recursive: true });
  await mkdir(screenshotsPublicDir, { recursive: true });
  await cp(realDocsDir, docsContentDir, { recursive: true });
  console.log('[captureFixtures] Seeded temp dir:', base);

  const captureSelector = `[data-doc-target="${SIREN_DIFF_ANALYSIS.docId}"]`;

  // Stage 4: multi-state capture
  console.log('[captureFixtures] Capturing UI states via Playwright...');
  const capture = new PlaywrightCapture(PORTAL_URL);
  const { states: capturedStates, videoWebm } = await capture.captureStates({
    route: SIREN_DIFF_ANALYSIS.targetRoute,
    selector: captureSelector,
    interactions: SIREN_DIFF_ANALYSIS.interactions,
  });
  console.log(`[captureFixtures] Captured ${capturedStates.length} states`);
  if (videoWebm) {
    console.log('[captureFixtures] Video clip captured:', videoWebm.length, 'bytes');
  }

  // Stage 5: per-state vision check
  console.log('[captureFixtures] Running vision checks...');
  const passingStates: CapturedState[] = [];
  for (let i = 0; i < capturedStates.length; i += 1) {
    const captured = capturedStates[i]!;
    const isDefault = i === 0;
    const claim = isDefault
      ? SIREN_DIFF_ANALYSIS.structuralChange
      : SIREN_DIFF_ANALYSIS.interactions[i - 1]!.reveals;
    const verdict = await visionCheck(captured.pngBuffer, claim);
    console.log(`[captureFixtures] vision state=${captured.state} showsChange=${verdict.showsChange} note=${verdict.note}`);
    if (verdict.showsChange) {
      passingStates.push(captured);
    } else if (isDefault) {
      throw new Error(`[captureFixtures] default state failed vision check: ${verdict.note}`);
    }
  }
  console.log(`[captureFixtures] ${passingStates.length} states passed vision check`);

  // Stage 6: writeDoc
  console.log('[captureFixtures] Writing doc via Claude...');
  const manifest = JSON.parse(
    await readFile(path.join(docsContentDir, 'manifest.json'), 'utf-8'),
  ) as DocsManifest;
  const found = manifest.docs.find((d) => d.id === SIREN_DIFF_ANALYSIS.docId);
  if (!found) throw new Error('shark-mitigation not found in manifest');

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
    existingDoc: {
      id: found.id,
      title: found.title,
      bodyMarkdown: existingBody,
      version: found.version,
    },
    diffAnalysis: SIREN_DIFF_ANALYSIS,
    context,
    screenshotMeta: {
      alt: defaultState.alt,
      path: `/docs-screenshots/${SIREN_DIFF_ANALYSIS.docId}/screenshot-v${newVersion}-${defaultState.state}.png`,
    },
    capturedStates: passingStates.map((s) => ({ state: s.state, alt: s.alt })),
  });
  console.log('[captureFixtures] Doc written, title:', draft.title);

  // Stage 7: assemble Doc + ChangeEntry
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
    ...(videoWebm !== undefined
      ? {
          video: {
            path: `/docs-videos/${SIREN_DIFF_ANALYSIS.docId}/interaction-v${newVersion}.webm`,
            alt: 'Looping interaction clip: Emergency Shark Siren activation',
            capturedAt: now,
          },
        }
      : {}),
  };

  const afterScreenshot =
    publishScreenshots.length > 1
      ? publishScreenshots[publishScreenshots.length - 1]!.screenshot
      : publishScreenshots[0]!.screenshot;

  const changeEntry: ChangeEntry = {
    id: 'chg-replay',
    docId: SIREN_DIFF_ANALYSIS.docId,
    summary: draft.changeSummary,
    severity: SIREN_DIFF_ANALYSIS.severity,
    prUrl: PR.prUrl,
    contextRefs: context,
    screenshotDiff: { after: afterScreenshot.path },
    createdAt: now,
  };

  // Stage 8: publish to TEMP dirs (no-op commit)
  console.log('[captureFixtures] Publishing to temp dirs...');
  await publish({
    doc: assembledDoc,
    screenshots: publishScreenshots,
    changeEntry,
    docsContentDir,
    screenshotsPublicDir,
    ...(videoWebm !== undefined ? { videoBuffer: videoWebm } : {}),
    commitFn: noopCommit,
  });
  console.log('[captureFixtures] Published to temp dirs successfully');

  // Copy fixtures to services/docs-bot/fixtures/replay/
  console.log('[captureFixtures] Copying fixtures to', fixturesDir);
  await mkdir(fixturesDir, { recursive: true });

  // shark-mitigation.v4.md — the written body
  const bodyMd = await readFile(
    path.join(docsContentDir, 'shark-mitigation', 'index.md'),
    'utf-8',
  );
  await writeFile(path.join(fixturesDir, 'shark-mitigation.v4.md'), bodyMd, 'utf-8');
  console.log('[captureFixtures] Wrote shark-mitigation.v4.md');

  // PNG screenshots — write directly from the in-memory buffers in publishScreenshots

  // Default screenshot
  const defaultShot = publishScreenshots.find((ps) =>
    ps.screenshot.path.includes('-default.png'),
  );
  if (!defaultShot) throw new Error('default screenshot not found in publishScreenshots');
  await writeFile(path.join(fixturesDir, 'shark-default.png'), defaultShot.pngBuffer);
  console.log('[captureFixtures] Wrote shark-default.png');

  // Active screenshot
  const activeShot = publishScreenshots.find((ps) =>
    ps.screenshot.path.includes('-active.png') || ps.screenshot.path.includes('siren'),
  );
  if (!activeShot) {
    // Fallback: use last screenshot
    const lastShot = publishScreenshots[publishScreenshots.length - 1]!;
    await writeFile(path.join(fixturesDir, 'shark-active.png'), lastShot.pngBuffer);
    console.log('[captureFixtures] Wrote shark-active.png (fallback to last screenshot)');
  } else {
    await writeFile(path.join(fixturesDir, 'shark-active.png'), activeShot.pngBuffer);
    console.log('[captureFixtures] Wrote shark-active.png');
  }

  // Video clip (optional)
  if (videoWebm !== undefined) {
    await writeFile(path.join(fixturesDir, 'shark-interaction.webm'), videoWebm);
    console.log('[captureFixtures] Wrote shark-interaction.webm');
  } else {
    console.log('[captureFixtures] No video clip captured (skipped)');
  }

  // change-entry.json — the canned ChangeEntry
  await writeFile(
    path.join(fixturesDir, 'change-entry.json'),
    JSON.stringify(changeEntry, null, 2),
    'utf-8',
  );
  console.log('[captureFixtures] Wrote change-entry.json');

  console.log('\n[captureFixtures] All fixtures written to:', fixturesDir);
  console.log('[captureFixtures] Files:');
  console.log('  - shark-mitigation.v4.md');
  console.log('  - shark-default.png');
  console.log('  - shark-active.png');
  if (videoWebm !== undefined) console.log('  - shark-interaction.webm');
  console.log('  - change-entry.json');
}

main().catch((err) => {
  console.error('[captureFixtures] FATAL:', err);
  process.exit(1);
});

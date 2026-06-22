/**
 * runJob.ts — Pipeline orchestration for the docs-bot.
 *
 * Wires all stages in order with visible narration logging and per-stage
 * typed error handling. A failure in any stage aborts only that job; the
 * server continues running and content/docs is untouched on mid-pipeline
 * failures (the publisher writes last).
 *
 * Stage order:
 *   getDiff → aggregateContext → analyzeDiff → capture → visionCheck
 *   → writeDoc → assemble Doc + ChangeEntry → publish
 */

import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

import type { PullRequestEvent, Doc, ChangeEntry, DocsManifest } from '@surf/types';

import { getDiff } from '../git/diff.js';
import { aggregateContext } from '../context/source.js';
import type { ContextSource } from '../context/source.js';
import { analyzeDiff } from '../claude/analyzeDiff.js';
import type { ScreenshotCapture } from '../capture/capture.js';
import { visionCheck } from '../claude/visionCheck.js';
import { writeDoc } from '../claude/writeDoc.js';
import { publish } from '../publish/publisher.js';
import type { CommitFn } from '../publish/publisher.js';

// ---------------------------------------------------------------------------
// Narration helper — these are the on-stage demo console lines (spec §10)
// ---------------------------------------------------------------------------

function log(stage: string, extra?: Record<string, unknown>): void {
  const ts = new Date().toISOString();
  if (extra) {
    console.log(`[docs-bot] ${ts}  ${stage}`, extra);
  } else {
    console.log(`[docs-bot] ${ts}  ${stage}`);
  }
}

// ---------------------------------------------------------------------------
// RunJob dependencies — injected so tests can override without real I/O
// ---------------------------------------------------------------------------

export interface RunJobDeps {
  /** Filesystem path to content/docs root. */
  docsContentDir: string;
  /** Filesystem path to public/docs-screenshots root. */
  screenshotsPublicDir: string;
  /** Repo root (for getDiff). */
  repoRoot: string;
  /** URL of the running surf-console portal. */
  surfConsoleUrl: string;
  /** Context sources to query for PR context. */
  contextSources: ContextSource[];
  /** Screenshot capture backend (PlaywrightCapture or a test stub). */
  capture: ScreenshotCapture;
  /** Git commit function (injectable for tests). */
  commitFn?: CommitFn;
}

// ---------------------------------------------------------------------------
// Main orchestration function
// ---------------------------------------------------------------------------

export function makeRunJob(deps: RunJobDeps) {
  const {
    docsContentDir,
    screenshotsPublicDir,
    repoRoot,
    contextSources,
    capture,
    commitFn,
  } = deps;

  return async function runJob(event: PullRequestEvent): Promise<void> {
    const jobId = randomUUID().slice(0, 8);
    log(`PR detected → relevant  [job=${jobId}]`, { prUrl: event.prUrl });

    // -----------------------------------------------------------------------
    // Stage 1: getDiff
    // -----------------------------------------------------------------------
    let diff: Awaited<ReturnType<typeof getDiff>>;
    try {
      diff = await getDiff(event.mergedSha, repoRoot);
      if (diff.length === 0) {
        log(`[job=${jobId}] No watched UI files changed — skipping`);
        return;
      }
    } catch (err) {
      log(`[job=${jobId}] ABORT at getDiff`, { error: String(err) });
      return;
    }

    // -----------------------------------------------------------------------
    // Stage 2: aggregateContext
    // -----------------------------------------------------------------------
    log(`Pulling context…  [job=${jobId}]`);
    let contextRefs: Awaited<ReturnType<typeof aggregateContext>>;
    try {
      contextRefs = await aggregateContext(event, contextSources);
    } catch (err) {
      log(`[job=${jobId}] ABORT at aggregateContext`, { error: String(err) });
      return;
    }

    // -----------------------------------------------------------------------
    // Stage 3: analyzeDiff — load manifest for existing docs
    // -----------------------------------------------------------------------
    log(`Analyzing diff…  [job=${jobId}]`);
    let diffAnalysis: Awaited<ReturnType<typeof analyzeDiff>>;
    try {
      const manifestRaw = await readFile(path.join(docsContentDir, 'manifest.json'), 'utf-8');
      const manifest = JSON.parse(manifestRaw) as DocsManifest;
      diffAnalysis = await analyzeDiff({ diff, context: contextRefs, existingDocs: manifest });
    } catch (err) {
      log(`[job=${jobId}] ABORT at analyzeDiff`, { error: String(err) });
      return;
    }

    // -----------------------------------------------------------------------
    // Stage 4: capture screenshot
    // -----------------------------------------------------------------------
    log(`Capturing UI…  [job=${jobId}]`, { docId: diffAnalysis.docId, route: diffAnalysis.targetRoute });
    const captureRoute = diffAnalysis.targetRoute ?? '/';
    const captureSelector = `[data-doc-target="${diffAnalysis.docId}"]`;
    let captureResult: Awaited<ReturnType<ScreenshotCapture['capture']>>;
    try {
      captureResult = await capture.capture({ route: captureRoute, selector: captureSelector });
    } catch (err) {
      log(`[job=${jobId}] ABORT at capture`, { error: String(err) });
      return;
    }

    // -----------------------------------------------------------------------
    // Stage 5: visionCheck
    // -----------------------------------------------------------------------
    let visionVerdict: Awaited<ReturnType<typeof visionCheck>>;
    try {
      visionVerdict = await visionCheck(captureResult.pngBuffer, diffAnalysis.structuralChange);
    } catch (err) {
      log(`[job=${jobId}] ABORT at visionCheck`, { error: String(err) });
      return;
    }

    if (!visionVerdict.showsChange) {
      log(`[job=${jobId}] Vision check MISMATCH — halting without publish`, {
        note: visionVerdict.note,
        claimedChange: diffAnalysis.structuralChange,
      });
      return;
    }
    log(`Vision check ✓  [job=${jobId}]`, { note: visionVerdict.note });

    // -----------------------------------------------------------------------
    // Stage 6: writeDoc — load existing doc for context
    // -----------------------------------------------------------------------
    log(`Writing doc…  [job=${jobId}]`);
    let docDraft: Awaited<ReturnType<typeof writeDoc>>;
    let existingDoc: Pick<Doc, 'id' | 'title' | 'bodyMarkdown' | 'version'>;
    let currentDoc: Doc;
    try {
      const manifestRaw = await readFile(path.join(docsContentDir, 'manifest.json'), 'utf-8');
      const manifest = JSON.parse(manifestRaw) as DocsManifest;
      const found = manifest.docs.find((d) => d.id === diffAnalysis.docId);
      if (!found) {
        throw new Error(`Doc '${diffAnalysis.docId}' not found in manifest`);
      }
      currentDoc = found;

      // Load body from index.md (manifest stores bodyMarkdown: "")
      let bodyMarkdown = '';
      try {
        bodyMarkdown = await readFile(
          path.join(docsContentDir, diffAnalysis.docId, 'index.md'),
          'utf-8',
        );
      } catch {
        // index.md may not exist yet — use empty body
      }

      existingDoc = {
        id: found.id,
        title: found.title,
        bodyMarkdown,
        version: found.version,
      };

      docDraft = await writeDoc({
        existingDoc,
        diffAnalysis,
        context: contextRefs,
        screenshotMeta: { alt: captureResult.alt, path: `/docs-screenshots/${diffAnalysis.docId}/screenshot-v${found.version + 1}.png` },
      });
    } catch (err) {
      log(`[job=${jobId}] ABORT at writeDoc`, { error: String(err) });
      return;
    }

    // -----------------------------------------------------------------------
    // Stage 7: Assemble the full Doc + ChangeEntry
    // -----------------------------------------------------------------------
    const now = new Date().toISOString();
    const newVersion = currentDoc.version + 1;
    const screenshotPath = `/docs-screenshots/${diffAnalysis.docId}/screenshot-v${newVersion}.png`;

    const assembledDoc: Doc = {
      ...currentDoc,
      title: docDraft.title,
      bodyMarkdown: docDraft.bodyMarkdown,
      version: newVersion,
      updatedAt: now,
      lastChange: docDraft.changeSummary,
      screenshots: [
        {
          path: screenshotPath,
          alt: captureResult.alt,
          capturedAt: now,
          targetSelector: captureSelector,
        },
      ],
    };

    const changeEntry: ChangeEntry = {
      id: `chg-${randomUUID().slice(0, 8)}`,
      docId: diffAnalysis.docId,
      summary: docDraft.changeSummary,
      severity: diffAnalysis.severity,
      prUrl: event.prUrl,
      contextRefs,
      screenshotDiff: { after: screenshotPath },
      createdAt: now,
    };

    // -----------------------------------------------------------------------
    // Stage 8: publish
    // -----------------------------------------------------------------------
    log(`Publishing  [job=${jobId}]`, { docId: diffAnalysis.docId, version: newVersion });
    try {
      await publish({
        doc: assembledDoc,
        pngBuffer: captureResult.pngBuffer,
        changeEntry,
        docsContentDir,
        screenshotsPublicDir,
        ...(commitFn ? { commitFn } : {}),
      });
    } catch (err) {
      log(`[job=${jobId}] ABORT at publish`, { error: String(err) });
      return;
    }

    log(`Done  [job=${jobId}]`, { docId: diffAnalysis.docId, version: newVersion, severity: diffAnalysis.severity });
  };
}

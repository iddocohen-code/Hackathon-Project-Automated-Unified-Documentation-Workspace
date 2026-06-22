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

import type { PullRequestEvent, Doc, ChangeEntry, DocsManifest, Screenshot } from '@surf/types';

import { getDiff } from '../git/diff.js';
import { aggregateContext } from '../context/source.js';
import type { ContextSource } from '../context/source.js';
import { analyzeDiff } from '../claude/analyzeDiff.js';
import type { ScreenshotCapture, CapturedState } from '../capture/capture.js';
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
    // Stage 4: capture screenshots — default state + one per interaction
    // -----------------------------------------------------------------------
    log(`Capturing UI…  [job=${jobId}]`, {
      docId: diffAnalysis.docId,
      route: diffAnalysis.targetRoute,
      interactions: diffAnalysis.interactions.length,
    });
    const captureRoute = diffAnalysis.targetRoute ?? '/';
    const captureSelector = `[data-doc-target="${diffAnalysis.docId}"]`;
    let capturedStates: CapturedState[];
    // Optional looping interaction clip (GIF-like .webm). STRETCH + NON-BLOCKING:
    // never vision-checked, never affects halt logic; undefined if not recorded.
    let videoWebm: Buffer | undefined;
    try {
      const captured = await capture.captureStates({
        route: captureRoute,
        selector: captureSelector,
        interactions: diffAnalysis.interactions,
      });
      capturedStates = captured.states;
      videoWebm = captured.videoWebm;
    } catch (err) {
      log(`[job=${jobId}] ABORT at capture`, { error: String(err) });
      return;
    }

    // -----------------------------------------------------------------------
    // Stage 5: visionCheck — verify EACH state.
    //
    // The first captured state is always "default"; the remaining states map
    // 1:1 (in order) to diffAnalysis.interactions. The claim used for the
    // vision check is:
    //   - default state  → diffAnalysis.structuralChange
    //   - activated state → the matching interaction's `reveals`
    //
    // Halt the whole job ONLY if the DEFAULT state fails (the core change is
    // not visible). If an ACTIVATED state fails, log a warning and DROP that
    // screenshot — never halt on a click-only / conditional state.
    // -----------------------------------------------------------------------
    const passingStates: CapturedState[] = [];
    let defaultStateFailed = false;
    for (let i = 0; i < capturedStates.length; i += 1) {
      const captured = capturedStates[i]!;
      const isDefault = i === 0;
      const claim = isDefault
        ? diffAnalysis.structuralChange
        : (diffAnalysis.interactions[i - 1]?.reveals ?? diffAnalysis.structuralChange);

      let verdict: Awaited<ReturnType<typeof visionCheck>>;
      try {
        verdict = await visionCheck(captured.pngBuffer, claim);
      } catch (err) {
        if (isDefault) {
          log(`[job=${jobId}] ABORT at visionCheck`, { error: String(err) });
          return;
        }
        // Activated-state vision error → degrade gracefully, drop screenshot
        log(`[job=${jobId}] Vision check ERROR on activated state — dropping`, {
          state: captured.state,
          error: String(err),
        });
        continue;
      }

      if (verdict.showsChange) {
        log(`Vision check ✓  [job=${jobId}]`, { state: captured.state, note: verdict.note });
        passingStates.push(captured);
      } else if (isDefault) {
        defaultStateFailed = true;
        log(`[job=${jobId}] Vision check MISMATCH (default) — halting without publish`, {
          note: verdict.note,
          claimedChange: claim,
        });
        break;
      } else {
        // Activated state failed — warn and drop, do NOT halt
        log(`[job=${jobId}] Vision check MISMATCH (activated) — dropping screenshot`, {
          state: captured.state,
          note: verdict.note,
          claimedChange: claim,
        });
      }
    }

    if (defaultStateFailed) {
      return;
    }

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

      const defaultState = passingStates[0]!; // guaranteed: default passed (else we returned)
      docDraft = await writeDoc({
        existingDoc,
        diffAnalysis,
        context: contextRefs,
        screenshotMeta: {
          alt: defaultState.alt,
          path: `/docs-screenshots/${diffAnalysis.docId}/screenshot-v${found.version + 1}-${defaultState.state}.png`,
        },
        capturedStates: passingStates.map((s) => ({ state: s.state, alt: s.alt })),
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

    // One Screenshot per PASSING state, paired with its PNG buffer for the
    // publisher. Filenames embed the state slug: screenshot-v<n>-<state>.png.
    const publishScreenshots = passingStates.map((s) => {
      const screenshotPath = `/docs-screenshots/${diffAnalysis.docId}/screenshot-v${newVersion}-${s.state}.png`;
      const screenshot: Screenshot = {
        path: screenshotPath,
        alt: s.alt,
        capturedAt: now,
        targetSelector: captureSelector,
      };
      return { screenshot, pngBuffer: s.pngBuffer };
    });

    // Optional looping interaction clip. STRETCH + NON-BLOCKING: only attach
    // when a clip was actually recorded; it is never vision-checked.
    const videoPath = `/docs-videos/${diffAnalysis.docId}/interaction-v${newVersion}.webm`;
    const videoAlt =
      diffAnalysis.interactions.length > 0
        ? `Looping clip: ${diffAnalysis.interactions
            .map((i) => i.label)
            .join(', ')} and the resulting revealed state`
        : `Looping interaction clip for ${docDraft.title}`;

    const assembledDoc: Doc = {
      ...currentDoc,
      title: docDraft.title,
      bodyMarkdown: docDraft.bodyMarkdown,
      version: newVersion,
      updatedAt: now,
      lastChange: docDraft.changeSummary,
      screenshots: publishScreenshots.map((ps) => ps.screenshot),
      ...(videoWebm !== undefined
        ? { video: { path: videoPath, alt: videoAlt, capturedAt: now } }
        : {}),
    };

    // screenshotDiff.after = the most informative new state: the last activated
    // state if any passed, else the default state. passingStates[0] is default.
    const afterScreenshot =
      publishScreenshots.length > 1
        ? publishScreenshots[publishScreenshots.length - 1]!.screenshot
        : publishScreenshots[0]!.screenshot;

    // before = the prior doc's most recent screenshot path, if any.
    const beforePath = currentDoc.screenshots[currentDoc.screenshots.length - 1]?.path;

    const changeEntry: ChangeEntry = {
      id: `chg-${randomUUID().slice(0, 8)}`,
      docId: diffAnalysis.docId,
      summary: docDraft.changeSummary,
      severity: diffAnalysis.severity,
      prUrl: event.prUrl,
      contextRefs,
      screenshotDiff: {
        ...(beforePath ? { before: beforePath } : {}),
        after: afterScreenshot.path,
      },
      createdAt: now,
    };

    // -----------------------------------------------------------------------
    // Stage 8: publish
    // -----------------------------------------------------------------------
    log(`Publishing  [job=${jobId}]`, {
      docId: diffAnalysis.docId,
      version: newVersion,
      screenshots: publishScreenshots.length,
      video: videoWebm !== undefined,
    });
    try {
      await publish({
        doc: assembledDoc,
        screenshots: publishScreenshots,
        changeEntry,
        docsContentDir,
        screenshotsPublicDir,
        ...(videoWebm !== undefined ? { videoBuffer: videoWebm } : {}),
        ...(commitFn ? { commitFn } : {}),
      });
    } catch (err) {
      log(`[job=${jobId}] ABORT at publish`, { error: String(err) });
      return;
    }

    log(`Done  [job=${jobId}]`, { docId: diffAnalysis.docId, version: newVersion, severity: diffAnalysis.severity });
  };
}

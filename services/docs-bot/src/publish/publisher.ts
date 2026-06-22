/**
 * publisher.ts — the ONLY writer of content/docs.
 *
 * Responsibility: given a regenerated Doc, its PNG screenshot Buffer, and a
 * ChangeEntry, atomically update the on-disk content directory and commit.
 *
 * Transaction model:
 *   1. Write body to <docsContentDir>/<docId>/index.md
 *   2. Write PNG to <screenshotsPublicDir>/<docId>/<filename>.png
 *   3. Surgically update manifest.json (replace one doc entry; preserve all else)
 *   4. Prepend to changelog.json
 *   5. git add + commit (via injectable commitFn so tests bypass real git)
 *
 * HARD contract:
 *   - manifest doc keeps bodyMarkdown: "" (body lives only in index.md)
 *   - manifest categories + docCount are preserved verbatim
 *   - other docs are left completely untouched
 *   - screenshot.path + screenshotDiff.after use the WEB path /docs-screenshots/...
 *
 * Hooks (no-op in Plan 2; wired in Plan 3):
 *   - notify: called after a successful publish
 *   - onIndexRebuild: called after a successful publish (index rebuild trigger)
 */

import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import path from 'node:path';
import { simpleGit } from 'simple-git';
import type { Doc, ChangeEntry, DocsManifest, Changelog, Screenshot } from '@surf/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Injectable commit function — replaces real git in tests. */
export type CommitFn = (paths: string[], message: string) => Promise<void>;

/** No-op hook type for Plan 2 */
export type NoOpHook = () => Promise<void>;

/**
 * A single per-state screenshot to publish: the Screenshot metadata (already
 * present on the Doc) paired with its raw PNG bytes. The `screenshot.path` is
 * the web path (`/docs-screenshots/<docId>/...`) and determines the on-disk
 * filename the PNG is written to.
 */
export interface PublishScreenshot {
  screenshot: Screenshot;
  pngBuffer: Buffer;
}

export interface PublishInput {
  /** The assembled, regenerated Doc (with new body, version, screenshots, lastChange). */
  doc: Doc;
  /**
   * Per-state screenshots to write. Each entry pairs a Screenshot (whose
   * `path` matches an entry in `doc.screenshots`) with its raw PNG bytes.
   * Every PNG is written to its web path's on-disk location.
   */
  screenshots: PublishScreenshot[];
  /** The new ChangeEntry to prepend to changelog. */
  changeEntry: ChangeEntry;
  /** Filesystem path to content/docs root. */
  docsContentDir: string;
  /** Filesystem path to public/docs-screenshots root. */
  screenshotsPublicDir: string;
  /**
   * Override the git commit step. Pass a no-op in tests to avoid
   * writing into the real repo. Defaults to the real simpleGit commit.
   */
  commitFn?: CommitFn;
  /** Called after successful publish (no-op in Plan 2). */
  notify?: NoOpHook;
  /** Called after successful publish to trigger index rebuild (no-op in Plan 2). */
  onIndexRebuild?: NoOpHook;
}

// ---------------------------------------------------------------------------
// Default commit function (real git)
// ---------------------------------------------------------------------------

async function defaultCommitFn(paths: string[], message: string): Promise<void> {
  // Resolve repo root: publisher.ts lives at services/docs-bot/src/publish/
  const __filename = new URL(import.meta.url).pathname;
  const repoRoot = path.resolve(path.dirname(__filename), '../../../..');
  const git = simpleGit(repoRoot);
  await git.add(paths);
  await git.commit(message);
}

// ---------------------------------------------------------------------------
// Atomic write helper: write to a .tmp file then rename
// ---------------------------------------------------------------------------

async function atomicWriteFile(filePath: string, content: string | Buffer): Promise<void> {
  const tmpPath = `${filePath}.tmp`;
  if (typeof content === 'string') {
    await writeFile(tmpPath, content, 'utf-8');
  } else {
    await writeFile(tmpPath, content);
  }
  await rename(tmpPath, filePath);
}

// ---------------------------------------------------------------------------
// Derive the on-disk PNG filename for a screenshot's web path
// ---------------------------------------------------------------------------

function derivePngInfo(
  doc: Doc,
  screenshot: Screenshot,
): { filename: string; webPath: string } {
  // screenshot.path is the web path, e.g.
  //   /docs-screenshots/shark-mitigation/screenshot-v4-default.png
  let filename: string;
  if (screenshot.path) {
    filename = path.basename(screenshot.path);
  } else {
    filename = `screenshot-v${doc.version}.png`;
  }

  const webPath = `/docs-screenshots/${doc.id}/${filename}`;
  return { filename, webPath };
}

// ---------------------------------------------------------------------------
// Main publish function
// ---------------------------------------------------------------------------

export async function publish(input: PublishInput): Promise<void> {
  const {
    doc,
    screenshots,
    changeEntry,
    docsContentDir,
    screenshotsPublicDir,
    commitFn = defaultCommitFn,
    notify,
    onIndexRebuild,
  } = input;

  // Filesystem paths
  const docDir = path.join(docsContentDir, doc.id);
  const indexMdPath = path.join(docDir, 'index.md');
  const manifestPath = path.join(docsContentDir, 'manifest.json');
  const changelogPath = path.join(docsContentDir, 'changelog.json');
  const screenshotDocDir = path.join(screenshotsPublicDir, doc.id);

  // -------------------------------------------------------------------------
  // Step 1: Write index.md (body markdown only — no frontmatter)
  // -------------------------------------------------------------------------
  await mkdir(docDir, { recursive: true });
  await atomicWriteFile(indexMdPath, doc.bodyMarkdown);

  // -------------------------------------------------------------------------
  // Step 2: Write EACH per-state PNG to screenshotsPublicDir/<docId>/<file>.png
  // -------------------------------------------------------------------------
  await mkdir(screenshotDocDir, { recursive: true });
  const writtenPngFsPaths: string[] = [];
  for (const { screenshot, pngBuffer } of screenshots) {
    const { filename } = derivePngInfo(doc, screenshot);
    const pngFsPath = path.join(screenshotDocDir, filename);
    await atomicWriteFile(pngFsPath, pngBuffer);
    writtenPngFsPaths.push(pngFsPath);
  }

  // -------------------------------------------------------------------------
  // Step 3: Update manifest.json — surgical replacement of one doc entry
  //
  // HARD contract:
  //   - bodyMarkdown MUST be "" (body lives in index.md only)
  //   - categories are preserved verbatim (incl. docCount)
  //   - all other doc entries are untouched
  // -------------------------------------------------------------------------
  const manifestRaw = await readFile(manifestPath, 'utf-8');
  const manifest = JSON.parse(manifestRaw) as DocsManifest;

  // Build the updated screenshot list for the manifest entry.
  // One entry per Doc screenshot; recompute each path from ground truth so the
  // manifest always carries the web path (/docs-screenshots/...).
  const manifestScreenshots: Screenshot[] = doc.screenshots.map((s) => {
    const { webPath } = derivePngInfo(doc, s);
    return {
      path: webPath,
      alt: s.alt ?? `${doc.title} screenshot`,
      capturedAt: s.capturedAt ?? new Date().toISOString(),
      ...(s.targetSelector ? { targetSelector: s.targetSelector } : {}),
    };
  });

  // Replace ONLY the matching doc entry; leave all others untouched.
  const updatedDocs = manifest.docs.map((existing) => {
    if (existing.id !== doc.id) {
      return existing; // untouched
    }

    // Replace with new metadata; MUST keep bodyMarkdown: ""
    return {
      ...existing,            // preserve any fields not explicitly overwritten
      title: doc.title,
      category: doc.category,
      bodyMarkdown: '',       // HARD contract: body lives in index.md
      screenshots: manifestScreenshots,
      sourceComponent: doc.sourceComponent,
      version: doc.version,
      updatedAt: doc.updatedAt,
      lastChange: doc.lastChange,
    };
  });

  const updatedManifest: DocsManifest = {
    categories: manifest.categories, // preserved verbatim
    docs: updatedDocs,
  };

  await atomicWriteFile(manifestPath, JSON.stringify(updatedManifest, null, 2));

  // -------------------------------------------------------------------------
  // Step 4: Update changelog.json — prepend the new ChangeEntry
  //
  // The ChangeEntry's screenshotDiff.after must use the web path.
  // -------------------------------------------------------------------------
  const changelogRaw = await readFile(changelogPath, 'utf-8');
  const changelog = JSON.parse(changelogRaw) as Changelog;

  // Ensure screenshotDiff.after uses the correct web path. The caller sets
  // `after` to the most-informative new state's web path; normalize it to the
  // canonical /docs-screenshots/<docId>/<file> form (filename only).
  const entryToWrite: ChangeEntry = {
    ...changeEntry,
    screenshotDiff: changeEntry.screenshotDiff
      ? {
          ...changeEntry.screenshotDiff,
          after: `/docs-screenshots/${doc.id}/${path.basename(changeEntry.screenshotDiff.after)}`,
        }
      : undefined,
  };

  const updatedChangelog: Changelog = [entryToWrite, ...changelog];
  await atomicWriteFile(changelogPath, JSON.stringify(updatedChangelog, null, 2));

  // -------------------------------------------------------------------------
  // Step 5: git add + commit (injectable for tests)
  //
  // Collect paths relative to repo root for git add.
  // The commit message includes [skip-bot] so the path filter doesn't
  // re-trigger the bot on this commit.
  // -------------------------------------------------------------------------
  const commitMessage = `docs: regenerate ${doc.id} (v${doc.version}) [skip-bot]`;

  // Pass filesystem paths; the commitFn is responsible for resolving them
  // relative to the repo root if needed.
  await commitFn(
    [indexMdPath, manifestPath, changelogPath, ...writtenPngFsPaths],
    commitMessage,
  );

  // -------------------------------------------------------------------------
  // Hooks (no-op in Plan 2)
  // -------------------------------------------------------------------------
  if (notify) {
    await notify();
  }
  if (onIndexRebuild) {
    await onIndexRebuild();
  }
}

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

export interface PublishInput {
  /** The assembled, regenerated Doc (with new body, version, screenshots, lastChange). */
  doc: Doc;
  /** Raw PNG bytes for the screenshot. */
  pngBuffer: Buffer;
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
// Derive the PNG filename and web path from the doc
// ---------------------------------------------------------------------------

function derivePngInfo(doc: Doc): { filename: string; webPath: string } {
  // Use the first screenshot's path if present (strip the leading /docs-screenshots/<docId>/)
  // Otherwise derive a name from the doc id + version
  const screenshotInDoc = doc.screenshots[0];
  let filename: string;

  if (screenshotInDoc && screenshotInDoc.path) {
    // path is like /docs-screenshots/shark-mitigation/screenshot-v4.png
    filename = path.basename(screenshotInDoc.path);
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
    pngBuffer,
    changeEntry,
    docsContentDir,
    screenshotsPublicDir,
    commitFn = defaultCommitFn,
    notify,
    onIndexRebuild,
  } = input;

  const { filename: pngFilename, webPath: pngWebPath } = derivePngInfo(doc);

  // Filesystem paths
  const docDir = path.join(docsContentDir, doc.id);
  const indexMdPath = path.join(docDir, 'index.md');
  const manifestPath = path.join(docsContentDir, 'manifest.json');
  const changelogPath = path.join(docsContentDir, 'changelog.json');
  const screenshotDocDir = path.join(screenshotsPublicDir, doc.id);
  const pngFsPath = path.join(screenshotDocDir, pngFilename);

  // -------------------------------------------------------------------------
  // Step 1: Write index.md (body markdown only — no frontmatter)
  // -------------------------------------------------------------------------
  await mkdir(docDir, { recursive: true });
  await atomicWriteFile(indexMdPath, doc.bodyMarkdown);

  // -------------------------------------------------------------------------
  // Step 2: Write PNG to screenshotsPublicDir/<docId>/<file>.png
  // -------------------------------------------------------------------------
  await mkdir(screenshotDocDir, { recursive: true });
  await atomicWriteFile(pngFsPath, pngBuffer);

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
  // Use the web path from the published PNG, not the doc's screenshots
  // (which may already be correct, but we recompute from ground truth).
  const manifestScreenshots: Screenshot[] = [
    {
      path: pngWebPath,
      alt: doc.screenshots[0]?.alt ?? `${doc.title} screenshot`,
      capturedAt: doc.screenshots[0]?.capturedAt ?? new Date().toISOString(),
      ...(doc.screenshots[0]?.targetSelector
        ? { targetSelector: doc.screenshots[0].targetSelector }
        : {}),
    },
  ];

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

  // Ensure screenshotDiff.after uses the correct web path
  const entryToWrite: ChangeEntry = {
    ...changeEntry,
    screenshotDiff: changeEntry.screenshotDiff
      ? {
          ...changeEntry.screenshotDiff,
          after: pngWebPath,
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
    [indexMdPath, manifestPath, changelogPath, pngFsPath],
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

import { simpleGit } from 'simple-git';
import picomatch from 'picomatch';
import { WATCHED_UI_GLOBS } from '../pipeline/filter.js';

export interface FilePatch {
  path: string;
  patch: string;
}

const isWatchedUI = picomatch(WATCHED_UI_GLOBS as string[]);

/**
 * Returns per-file unified-diff patches for files changed in `mergedSha`
 * relative to its first parent, filtered to the watched UI globs.
 *
 * Only files that match `WATCHED_UI_GLOBS` are returned.
 */
export async function getDiff(mergedSha: string, repoRoot: string): Promise<FilePatch[]> {
  const git = simpleGit(repoRoot);

  // Get the list of changed files between the commit and its first parent
  const summary = await git.diffSummary([`${mergedSha}^`, mergedSha]);

  // Filter to watched UI paths
  const watchedFiles = summary.files
    .map((f: { file: string }) => f.file)
    .filter((file: string) => isWatchedUI(file));

  if (watchedFiles.length === 0) {
    return [];
  }

  // Fetch per-file patch for each watched file
  const results: FilePatch[] = [];

  for (const file of watchedFiles) {
    const patch = await git.diff([`${mergedSha}^`, mergedSha, '--', file]);
    if (patch.trim().length > 0) {
      results.push({ path: file, patch });
    }
  }

  return results;
}

import picomatch from 'picomatch';

/**
 * Glob patterns for UI source paths that warrant regenerating docs.
 * Exported so downstream tasks (e.g. Task 5's diff filter) can reuse them.
 */
export const WATCHED_UI_GLOBS: readonly string[] = [
  'apps/surf-console/components/console/**',
  'apps/surf-console/components/docs/**',
  'apps/surf-console/app/**',
];

/**
 * Glob patterns for paths that are NEVER counted as a watched UI match.
 * A change set consisting only of these paths is NOT relevant (no-loop guard).
 * Note: these don't need to be checked explicitly — they simply never satisfy
 * WATCHED_UI_GLOBS, so a publish-only commit is automatically irrelevant.
 */
export const IGNORE_GLOBS: readonly string[] = [
  'apps/surf-console/content/docs/**',
  'apps/surf-console/public/docs-screenshots/**',
  'services/**',
];

const isWatchedUI = picomatch(WATCHED_UI_GLOBS as string[]);

/**
 * Pure function — no I/O, no side effects.
 *
 * Returns `true` iff at least one path in `changedPaths` matches a watched UI
 * glob. Paths under `content/docs/**`, `public/docs-screenshots/**`, or
 * `services/**` never match the watched globs, so a publish commit (which only
 * touches those) is automatically irrelevant — the no-loop guard.
 */
export function isRelevant(changedPaths: string[]): boolean {
  return changedPaths.some((p) => isWatchedUI(p));
}

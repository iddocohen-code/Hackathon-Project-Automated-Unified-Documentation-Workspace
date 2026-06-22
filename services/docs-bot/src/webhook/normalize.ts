import type { PullRequestEvent } from '@surf/types';

/**
 * Normalises a raw GitHub webhook payload into a typed PullRequestEvent.
 *
 * Returns null for:
 *   - Non-`pull_request` events (no `pull_request` field).
 *   - PR events that are not `closed` with `merged: true`.
 *
 * Note on `changedPaths`: GitHub's PR webhook payload does NOT include the
 * list of changed files. This field is intentionally left as an empty array
 * here. Task 5 (diff stage) derives the real paths from `mergedSha` via the
 * GitHub REST API / git diff.
 */
export function toPullRequestEvent(payload: unknown): PullRequestEvent | null {
  if (payload == null || typeof payload !== 'object') {
    return null;
  }

  const p = payload as Record<string, unknown>;

  if (p['action'] !== 'closed') {
    return null;
  }

  const pr = p['pull_request'];
  if (pr == null || typeof pr !== 'object') {
    return null;
  }

  const prObj = pr as Record<string, unknown>;

  if (prObj['merged'] !== true) {
    return null;
  }

  return {
    prUrl: String(prObj['html_url'] ?? ''),
    mergedSha: String(prObj['merge_commit_sha'] ?? ''),
    changedPaths: [], // derived from mergedSha in Task 5 (diff stage)
    title: String(prObj['title'] ?? ''),
    body: String(prObj['body'] ?? ''),
  };
}

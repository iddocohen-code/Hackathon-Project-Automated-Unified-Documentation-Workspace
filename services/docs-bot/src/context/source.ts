import type { ContextRef, PullRequestEvent } from '@surf/types';

/**
 * A source that can fetch context references relevant to a pull request.
 * Live connectors (real Jira/Slack/Confluence APIs) implement this same
 * interface — fixture sources are the demo stand-ins.
 */
export interface ContextSource {
  fetch(pr: PullRequestEvent): Promise<ContextRef[]>;
}

/**
 * Runs all sources against the given PR, concatenates results, and deduplicates
 * by `ref` value (first occurrence wins).
 */
export async function aggregateContext(
  pr: PullRequestEvent,
  sources: ContextSource[],
): Promise<ContextRef[]> {
  const allRefs = (await Promise.all(sources.map((s) => s.fetch(pr)))).flat();

  const seen = new Set<string>();
  const deduped: ContextRef[] = [];
  for (const ref of allRefs) {
    if (!seen.has(ref.ref)) {
      seen.add(ref.ref);
      deduped.push(ref);
    }
  }
  return deduped;
}

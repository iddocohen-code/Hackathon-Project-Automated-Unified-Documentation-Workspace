import type { ContextRef, PullRequestEvent } from '@surf/types';
import type { ContextSource } from '../source.js';
import { loadJsonFixture } from './loader.js';

interface JiraFixture {
  key: string;
  summary: string;
  description: string;
}

/**
 * Triggering logic: scans the PR title and body for Jira-style ticket refs
 * matching `SURF-\d+`. For each match that has a corresponding fixture file,
 * returns a ContextRef.
 */
export class FixtureJiraSource implements ContextSource {
  async fetch(pr: PullRequestEvent): Promise<ContextRef[]> {
    const text = `${pr.title} ${pr.body}`;
    const matches = [...new Set(text.match(/SURF-\d+/g) ?? [])];
    if (matches.length === 0) return [];

    const refs: ContextRef[] = [];
    for (const key of matches) {
      const filename = `jira-${key}.json`;
      let fixture: JiraFixture;
      try {
        fixture = await loadJsonFixture<JiraFixture>(filename);
      } catch {
        // No fixture for this ticket key — skip silently
        continue;
      }
      refs.push({
        kind: 'jira',
        ref: key,
        url: `https://jira.example.com/browse/${key}`,
        excerpt: `[${key}] ${fixture.summary} — ${fixture.description.slice(0, 200).replace(/\n/g, ' ')}…`,
      });
    }
    return refs;
  }
}

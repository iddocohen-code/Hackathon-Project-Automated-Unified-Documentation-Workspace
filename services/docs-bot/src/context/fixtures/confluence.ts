import type { ContextRef, PullRequestEvent } from '@surf/types';
import type { ContextSource } from '../source.js';
import { loadTextFixture } from './loader.js';

/**
 * Triggering logic: the Confluence source is keyword-triggered. If the PR
 * title or body mentions "shark" (case-insensitive), the shark runbook fixture
 * is included. This is intentionally broad for the demo — it mirrors how a
 * real connector might search Confluence by keyword and return the most relevant
 * page. A live connector would call the Confluence search API instead.
 */
export class FixtureConfluenceSource implements ContextSource {
  async fetch(pr: PullRequestEvent): Promise<ContextRef[]> {
    const text = `${pr.title} ${pr.body}`.toLowerCase();
    if (!text.includes('shark')) return [];

    let content: string;
    try {
      content = await loadTextFixture('confluence-shark-runbook.md');
    } catch {
      return [];
    }

    // Extract the page title from the first H1
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const pageTitle = titleMatch?.[1]?.trim() ?? 'Shark Incident Response Runbook';

    // Extract the step-2 paragraph (the siren step) as the excerpt
    const sirenStepMatch = content.match(/## Step 2[^\n]*\n([\s\S]+?)(?=\n## )/);
    const excerpt = sirenStepMatch?.[1] != null
      ? sirenStepMatch[1].replace(/\n+/g, ' ').trim().slice(0, 300)
      : content.slice(0, 300);

    return [
      {
        kind: 'confluence',
        ref: pageTitle,
        url: 'https://confluence.example.com/display/SURFOPS/Shark+Incident+Response+Runbook',
        excerpt,
      },
    ];
  }
}

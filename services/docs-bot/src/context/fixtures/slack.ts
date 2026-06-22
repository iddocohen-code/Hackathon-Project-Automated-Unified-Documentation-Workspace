import type { ContextRef, PullRequestEvent } from '@surf/types';
import type { ContextSource } from '../source.js';
import { loadJsonFixture } from './loader.js';

interface SlackMessage {
  user: string;
  ts: string;
  text: string;
}

interface SlackFixture {
  channel: string;
  threadTs: string;
  permalink: string;
  messages: SlackMessage[];
}

/**
 * Triggering logic: scans the PR title and body for Slack channel mentions
 * in the form `#<channel-name>`. For each match that has a corresponding
 * fixture file (`slack-<channel>.json`), returns a ContextRef.
 */
export class FixtureSlackSource implements ContextSource {
  async fetch(pr: PullRequestEvent): Promise<ContextRef[]> {
    const text = `${pr.title} ${pr.body}`;
    const matches = [...new Set((text.match(/#([\w-]+)/g) ?? []))];
    if (matches.length === 0) return [];

    const refs: ContextRef[] = [];
    for (const mention of matches) {
      const channelName = mention.slice(1); // strip leading #
      const filename = `slack-${channelName}.json`;
      let fixture: SlackFixture;
      try {
        fixture = await loadJsonFixture<SlackFixture>(filename);
      } catch {
        continue;
      }
      // Build excerpt from the last (summary) message in the thread
      const summary = fixture.messages.at(-1)?.text ?? fixture.messages[0]?.text ?? '';
      refs.push({
        kind: 'slack',
        ref: `#${fixture.channel}`,
        url: fixture.permalink,
        excerpt: summary.slice(0, 280),
      });
    }
    return refs;
  }
}

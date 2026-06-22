import { describe, it, expect } from 'vitest';
import { aggregateContext } from '../src/context/source.js';
import { FixtureJiraSource } from '../src/context/fixtures/jira.js';
import { FixtureSlackSource } from '../src/context/fixtures/slack.js';
import { FixtureConfluenceSource } from '../src/context/fixtures/confluence.js';
import type { PullRequestEvent } from '@surf/types';

const PR: PullRequestEvent = {
  prUrl: 'https://github.com/example/surf/pull/42',
  mergedSha: 'abc1234',
  changedPaths: ['apps/surf-console/components/console/SharkMitigationCard.tsx'],
  title: 'feat: add one-press Emergency Shark Siren to mitigation panel',
  body: 'Resolves SURF-142. Lifeguards need to trigger zone-wide evacuation instantly. See #surf-safety discussion.',
};

describe('aggregateContext', () => {
  it('returns a jira ref for SURF-142 detected in the PR body', async () => {
    const refs = await aggregateContext(PR, [new FixtureJiraSource()]);
    const jiraRef = refs.find((r) => r.kind === 'jira');
    expect(jiraRef).toBeDefined();
    expect(jiraRef?.ref).toBe('SURF-142');
    expect(jiraRef?.url).toMatch(/SURF-142/);
    expect(jiraRef?.excerpt.length).toBeGreaterThan(0);
  });

  it('returns a slack ref for #surf-safety detected in the PR body', async () => {
    const refs = await aggregateContext(PR, [new FixtureSlackSource()]);
    const slackRef = refs.find((r) => r.kind === 'slack');
    expect(slackRef).toBeDefined();
    expect(slackRef?.ref).toBe('#surf-safety');
    expect(slackRef?.excerpt.length).toBeGreaterThan(0);
  });

  it('returns a confluence ref for the shark runbook', async () => {
    const refs = await aggregateContext(PR, [new FixtureConfluenceSource()]);
    const confRef = refs.find((r) => r.kind === 'confluence');
    expect(confRef).toBeDefined();
    expect(confRef?.ref.length).toBeGreaterThan(0);
    expect(confRef?.excerpt.length).toBeGreaterThan(0);
  });

  it('returns all three kinds when all sources are combined', async () => {
    const refs = await aggregateContext(PR, [
      new FixtureJiraSource(),
      new FixtureSlackSource(),
      new FixtureConfluenceSource(),
    ]);
    expect(refs.some((r) => r.kind === 'jira')).toBe(true);
    expect(refs.some((r) => r.kind === 'slack')).toBe(true);
    expect(refs.some((r) => r.kind === 'confluence')).toBe(true);
  });

  it('deduplicates refs by ref value when the same source is included twice', async () => {
    const refs = await aggregateContext(PR, [
      new FixtureJiraSource(),
      new FixtureJiraSource(),
    ]);
    const jiraRefs = refs.filter((r) => r.kind === 'jira' && r.ref === 'SURF-142');
    expect(jiraRefs).toHaveLength(1);
  });

  it('all returned refs have non-empty excerpt, url, ref, and kind', async () => {
    const refs = await aggregateContext(PR, [
      new FixtureJiraSource(),
      new FixtureSlackSource(),
      new FixtureConfluenceSource(),
    ]);
    for (const r of refs) {
      expect(r.kind).toBeTruthy();
      expect(r.ref.length).toBeGreaterThan(0);
      expect(r.url.length).toBeGreaterThan(0);
      expect(r.excerpt.length).toBeGreaterThan(0);
    }
  });
});

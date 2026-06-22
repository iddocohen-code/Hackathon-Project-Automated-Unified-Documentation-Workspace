import { createHmac } from 'node:crypto';
import { describe, it, expect, vi } from 'vitest';
import { verifyGithubSignature } from '../src/webhook/verify.js';
import { toPullRequestEvent } from '../src/webhook/normalize.js';
import { buildApp } from '../src/server.js';
import type { Scheduler } from '../src/pipeline/scheduler.js';
import type { PullRequestEvent } from '@surf/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSignature(secret: string, body: Buffer): string {
  const hmac = createHmac('sha256', secret);
  hmac.update(body);
  return `sha256=${hmac.digest('hex')}`;
}

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------

describe('verifyGithubSignature', () => {
  const secret = 'test-secret-abc123';
  const body = Buffer.from(JSON.stringify({ action: 'closed' }));
  const validSig = makeSignature(secret, body);

  it('returns true for a body signed with the correct secret', () => {
    expect(verifyGithubSignature(secret, body, validSig)).toBe(true);
  });

  it('returns false for a tampered body', () => {
    const tamperedBody = Buffer.from(JSON.stringify({ action: 'closed', extra: 'injected' }));
    expect(verifyGithubSignature(secret, tamperedBody, validSig)).toBe(false);
  });

  it('returns false for a wrong secret', () => {
    expect(verifyGithubSignature('wrong-secret', body, validSig)).toBe(false);
  });

  it('returns false for a missing/empty signature header', () => {
    expect(verifyGithubSignature(secret, body, '')).toBe(false);
  });

  it('returns false for a malformed signature header (no sha256= prefix)', () => {
    expect(verifyGithubSignature(secret, body, 'abc123')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Payload normalisation
// ---------------------------------------------------------------------------

const mergedPrFixture = {
  action: 'closed',
  pull_request: {
    merged: true,
    merge_commit_sha: 'deadbeefcafe1234567890abcdef01234567890a',
    html_url: 'https://github.com/org/repo/pull/42',
    title: 'feat: update docs for new API',
    body: 'This PR updates the documentation to reflect the new API changes.',
  },
};

const openedPrFixture = {
  action: 'opened',
  pull_request: {
    merged: false,
    merge_commit_sha: null,
    html_url: 'https://github.com/org/repo/pull/43',
    title: 'feat: work in progress',
    body: 'WIP PR',
  },
};

const closedNotMergedFixture = {
  action: 'closed',
  pull_request: {
    merged: false,
    merge_commit_sha: null,
    html_url: 'https://github.com/org/repo/pull/44',
    title: 'feat: abandoned',
    body: 'Closing without merge',
  },
};

describe('toPullRequestEvent', () => {
  it('returns a PullRequestEvent for a closed+merged pull_request', () => {
    const result = toPullRequestEvent(mergedPrFixture);
    expect(result).not.toBeNull();
    expect(result!.mergedSha).toBe('deadbeefcafe1234567890abcdef01234567890a');
    expect(result!.prUrl).toBe('https://github.com/org/repo/pull/42');
    expect(result!.title).toBe('feat: update docs for new API');
    expect(result!.body).toBe(
      'This PR updates the documentation to reflect the new API changes.',
    );
    // changedPaths: GitHub PR webhook does not include file paths; Task 5 derives
    // real paths from the merge SHA. Default to empty array.
    expect(result!.changedPaths).toEqual([]);
  });

  it('returns null for an opened (non-merge) event', () => {
    expect(toPullRequestEvent(openedPrFixture)).toBeNull();
  });

  it('returns null for a closed-but-not-merged event', () => {
    expect(toPullRequestEvent(closedNotMergedFixture)).toBeNull();
  });

  it('returns null for a non-PR event type', () => {
    expect(toPullRequestEvent({ action: 'created', comment: {} })).toBeNull();
  });

  it('returns null for null/undefined payload', () => {
    expect(toPullRequestEvent(null)).toBeNull();
    expect(toPullRequestEvent(undefined)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Route integration tests via app.inject()
// ---------------------------------------------------------------------------

describe('POST /webhook route', () => {
  const TEST_SECRET = 'route-test-secret-xyz';

  function sign(secret: string, body: string): string {
    const hmac = createHmac('sha256', secret);
    hmac.update(Buffer.from(body, 'utf8'));
    return `sha256=${hmac.digest('hex')}`;
  }

  it('returns 202 for a valid signature over a merged-PR payload', async () => {
    const app = buildApp({ webhookSecret: TEST_SECRET, port: 0, schedulerMode: 'instant', surfConsoleUrl: 'http://localhost:3000', docsContentDir: '/tmp' });
    const body = JSON.stringify(mergedPrFixture);
    const sig = sign(TEST_SECRET, body);

    const response = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': sig,
      },
      payload: body,
    });

    expect(response.statusCode).toBe(202);
  });

  it('returns 401 for an invalid signature', async () => {
    const app = buildApp({ webhookSecret: TEST_SECRET, port: 0, schedulerMode: 'instant', surfConsoleUrl: 'http://localhost:3000', docsContentDir: '/tmp' });
    const body = JSON.stringify(mergedPrFixture);

    const response = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': 'sha256=deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      },
      payload: body,
    });

    expect(response.statusCode).toBe(401);
  });

  it('returns 200 for a valid signature over a non-merge (opened) payload', async () => {
    const app = buildApp({ webhookSecret: TEST_SECRET, port: 0, schedulerMode: 'instant', surfConsoleUrl: 'http://localhost:3000', docsContentDir: '/tmp' });
    const body = JSON.stringify(openedPrFixture);
    const sig = sign(TEST_SECRET, body);

    const response = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': sig,
      },
      payload: body,
    });

    expect(response.statusCode).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Enqueue wiring tests (bug fix: resolver derives changedPaths from mergedSha)
// ---------------------------------------------------------------------------

describe('POST /webhook enqueue wiring with injected resolver', () => {
  const TEST_SECRET = 'enqueue-wiring-test-secret';

  function sign(secret: string, body: string): string {
    const hmac = createHmac('sha256', secret);
    hmac.update(Buffer.from(body, 'utf8'));
    return `sha256=${hmac.digest('hex')}`;
  }

  /** Build a spy scheduler that records enqueue calls. */
  function makeSpyScheduler(): Scheduler & { enqueuedEvents: PullRequestEvent[] } {
    const enqueuedEvents: PullRequestEvent[] = [];
    return {
      enqueuedEvents,
      enqueue(event: PullRequestEvent) {
        enqueuedEvents.push(event);
      },
      async runNow() {},
    };
  }

  it('enqueues the event when resolver returns a watched UI path', async () => {
    const spyScheduler = makeSpyScheduler();

    // Resolver returns a path that matches WATCHED_UI_GLOBS
    const resolver = vi.fn().mockResolvedValue([
      'apps/surf-console/components/console/SharkMitigationCard.tsx',
    ]);

    const app = buildApp(
      { webhookSecret: TEST_SECRET, port: 0, schedulerMode: 'instant', surfConsoleUrl: 'http://localhost:3000', docsContentDir: '/tmp' },
      spyScheduler,
      { resolveChangedPaths: resolver },
    );

    const body = JSON.stringify(mergedPrFixture);
    const sig = sign(TEST_SECRET, body);

    const response = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: { 'content-type': 'application/json', 'x-hub-signature-256': sig },
      payload: body,
    });

    expect(response.statusCode).toBe(202);
    expect(resolver).toHaveBeenCalledOnce();
    expect(spyScheduler.enqueuedEvents).toHaveLength(1);
    // The event's changedPaths should be populated by the resolver
    expect(spyScheduler.enqueuedEvents[0]!.changedPaths).toContain(
      'apps/surf-console/components/console/SharkMitigationCard.tsx',
    );
  });

  it('does NOT enqueue when resolver returns only publish-output paths (no-loop guard)', async () => {
    const spyScheduler = makeSpyScheduler();

    // Resolver returns only docs publish output — NOT a watched UI path
    const resolver = vi.fn().mockResolvedValue([
      'apps/surf-console/content/docs/shark-mitigation/index.md',
    ]);

    const app = buildApp(
      { webhookSecret: TEST_SECRET, port: 0, schedulerMode: 'instant', surfConsoleUrl: 'http://localhost:3000', docsContentDir: '/tmp' },
      spyScheduler,
      { resolveChangedPaths: resolver },
    );

    const body = JSON.stringify(mergedPrFixture);
    const sig = sign(TEST_SECRET, body);

    const response = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: { 'content-type': 'application/json', 'x-hub-signature-256': sig },
      payload: body,
    });

    expect(response.statusCode).toBe(202);
    expect(resolver).toHaveBeenCalledOnce();
    // No enqueue — publish commits must not trigger the pipeline
    expect(spyScheduler.enqueuedEvents).toHaveLength(0);
  });

  it('returns 401 for an invalid signature regardless of resolver', async () => {
    const spyScheduler = makeSpyScheduler();
    const resolver = vi.fn().mockResolvedValue(['apps/surf-console/components/console/Foo.tsx']);

    const app = buildApp(
      { webhookSecret: TEST_SECRET, port: 0, schedulerMode: 'instant', surfConsoleUrl: 'http://localhost:3000', docsContentDir: '/tmp' },
      spyScheduler,
      { resolveChangedPaths: resolver },
    );

    const body = JSON.stringify(mergedPrFixture);

    const response = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': 'sha256=deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      },
      payload: body,
    });

    expect(response.statusCode).toBe(401);
    expect(resolver).not.toHaveBeenCalled();
    expect(spyScheduler.enqueuedEvents).toHaveLength(0);
  });

  it('responds 202 without enqueue when resolver throws (graceful degradation)', async () => {
    const spyScheduler = makeSpyScheduler();
    const resolver = vi.fn().mockRejectedValue(new Error('git fetch failed'));

    const app = buildApp(
      { webhookSecret: TEST_SECRET, port: 0, schedulerMode: 'instant', surfConsoleUrl: 'http://localhost:3000', docsContentDir: '/tmp' },
      spyScheduler,
      { resolveChangedPaths: resolver },
    );

    const body = JSON.stringify(mergedPrFixture);
    const sig = sign(TEST_SECRET, body);

    const response = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: { 'content-type': 'application/json', 'x-hub-signature-256': sig },
      payload: body,
    });

    // Must not 500 — webhook is acknowledged even when resolver fails
    expect(response.statusCode).toBe(202);
    expect(spyScheduler.enqueuedEvents).toHaveLength(0);
  });
});

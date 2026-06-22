/**
 * Integration test for GET /events (SSE endpoint).
 *
 * Fastify `inject` does not support streaming, so we start the app on an
 * ephemeral port, read from a raw http.get() client, verify headers and
 * data frames, then shut down the server.
 */

import http from 'node:http';
import { describe, it, expect, afterAll } from 'vitest';
import { buildApp } from '../src/server.js';
import { notifier } from '../src/events/notifier.js';
import type { ChangeEntry } from '@surf/types';

// Minimal ChangeEntry for the test
const TEST_ENTRY: ChangeEntry = {
  id: 'chg-evt-test-001',
  docId: 'shark-mitigation',
  summary: {
    headline: 'SSE integration test change',
    detail: 'Integration test detail',
    intentSource: 'test',
  },
  severity: 'critical',
  prUrl: 'https://github.com/example/repo/pull/99',
  contextRefs: [],
  createdAt: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// Helper: open a TCP connection to the SSE endpoint, collect chunks until
// a predicate is satisfied or the timeout expires. Returns collected data.
// ---------------------------------------------------------------------------
function readSseChunks(
  port: number,
  durationMs: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const collected: string[] = [];
    let resolved = false;

    const req = http.get(`http://127.0.0.1:${port}/events`, (res) => {
      res.setEncoding('utf8');
      res.on('data', (chunk: string) => {
        collected.push(chunk);
      });
      res.on('end', () => {
        if (!resolved) {
          resolved = true;
          resolve(collected.join(''));
        }
      });
      res.on('error', (err) => {
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      });

      // Store the response object so callers can check headers
      (req as unknown as { _sseRes: typeof res })._sseRes = res;
    });

    req.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        reject(err);
      }
    });

    // Resolve with whatever we have after `durationMs`
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        req.destroy();
        resolve(collected.join(''));
      }
    }, durationMs);
  });
}

// ---------------------------------------------------------------------------
// Helper: get just the response headers from GET /events without reading body
// ---------------------------------------------------------------------------
function getHeaders(port: number): Promise<http.IncomingMessage> {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${port}/events`, (res) => {
      resolve(res);
      req.destroy(); // don't need the body
    });
    req.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

const app = buildApp();
let port: number;

// Start the server before tests, get assigned ephemeral port
await (async () => {
  await app.listen({ port: 0, host: '127.0.0.1' });
  const addr = app.server.address();
  if (!addr || typeof addr === 'string') throw new Error('Could not determine port');
  port = addr.port;
})();

afterAll(async () => {
  await app.close();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /events — SSE endpoint', () => {
  it('responds with Content-Type: text/event-stream', async () => {
    const res = await getHeaders(port);
    expect(res.headers['content-type']).toMatch(/text\/event-stream/);
  });

  it('streams a data frame when notifier.emit() is called', async () => {
    // Start reading, emit after a short delay, collect for 300ms total
    const readPromise = readSseChunks(port, 400);

    await new Promise((r) => setTimeout(r, 50)); // let the connection establish
    notifier.emit(TEST_ENTRY);

    const body = await readPromise;

    expect(body).toContain('data:');
    expect(body).toContain(TEST_ENTRY.id);

    const dataLine = body.split('\n').find((l) => l.startsWith('data:'));
    expect(dataLine).toBeDefined();
    const parsed = JSON.parse(dataLine!.slice('data:'.length).trim()) as ChangeEntry;
    expect(parsed.id).toBe(TEST_ENTRY.id);
    expect(parsed.severity).toBe('critical');
  });

  it('includes Cache-Control: no-cache header', async () => {
    const res = await getHeaders(port);
    expect(res.headers['cache-control']).toBe('no-cache');
  });
});

import Fastify from 'fastify';
import cors from '@fastify/cors';
import type { Config } from './config.js';
import { verifyGithubSignature } from './webhook/verify.js';
import { toPullRequestEvent } from './webhook/normalize.js';
import { isRelevant } from './pipeline/filter.js';
import { makeScheduler } from './pipeline/scheduler.js';
import type { Scheduler } from './pipeline/scheduler.js';
import type { PullRequestEvent } from '@surf/types';
import { answerQuery } from './rag/answer.js';
import { getRetriever } from './rag/index-state.js';

export interface BuildAppOptions {
  /**
   * Injectable resolver that, given a PullRequestEvent, fetches the list of
   * changed paths for the merge commit (UNFILTERED). Used by the /webhook
   * handler to resolve relevance when GitHub's payload lacks changed-file info.
   *
   * If undefined (legacy / test callers), the handler falls back to using
   * event.changedPaths as-is (which is [] for live GitHub payloads).
   *
   * Must resolve; on error the handler logs and responds 202 without enqueue.
   */
  resolveChangedPaths?: (event: PullRequestEvent) => Promise<string[]>;
}

export function buildApp(config?: Config, scheduler?: Scheduler, options?: BuildAppOptions) {
  const app = Fastify({ logger: true });

  // ---------------------------------------------------------------------------
  // CORS — allow requests from the configured frontend origin.
  // ---------------------------------------------------------------------------
  void app.register(cors, {
    origin: config?.corsOrigin ?? 'http://localhost:3000',
  });

  // ---------------------------------------------------------------------------
  // Scheduler setup
  //
  // In production, `index.ts` injects a real scheduler (with `makeRunJob` as
  // the run callback) so the stub below is never used. The stub exists only as
  // a fallback when `buildApp` is called WITHOUT an injected scheduler — e.g.
  // in unit tests that exercise the HTTP layer without a live pipeline.
  // app.log is passed as the scheduler logger so timer-path flush errors are
  // visible in the Fastify log stream rather than silently swallowed.
  // ---------------------------------------------------------------------------
  const stubRun = async (event: PullRequestEvent): Promise<void> => {
    app.log.info({ prUrl: event.prUrl }, 'scheduler: stub run (pipeline not yet wired)');
  };

  const activeScheduler: Scheduler =
    scheduler ?? makeScheduler(
      {
        schedulerMode: config?.schedulerMode ?? 'instant',
        debounceMs: 30_000,
      },
      stubRun,
      app.log,
    );

  app.get('/health', async () => {
    return { ok: true };
  });

  // POST /run-now — trigger the scheduler flush immediately.
  app.post('/run-now', async (_request, reply) => {
    await activeScheduler.runNow();
    return reply.code(202).send({ status: 'flushed' });
  });

  // POST /webhook — receives GitHub PR events.
  //
  // Raw-body capture: Fastify by default parses JSON and discards the raw
  // bytes, but HMAC must be computed over the exact bytes GitHub sent.
  // We register a custom content-type parser for application/json that
  // stashes the raw Buffer on `request.rawBody` before parsing.
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (req, body, done) => {
      // Attach raw bytes for HMAC verification.
      (req as unknown as { rawBody: Buffer }).rawBody = body as Buffer;
      try {
        done(null, JSON.parse((body as Buffer).toString('utf8')));
      } catch (err) {
        done(err as Error);
      }
    },
  );

  app.post('/webhook', async (request, reply) => {
    const rawBody: Buffer | undefined = (request as unknown as { rawBody?: Buffer }).rawBody;

    if (!rawBody || rawBody.length === 0) {
      return reply.code(400).send({ error: 'missing or unparseable body' });
    }

    const sigHeader = (request.headers['x-hub-signature-256'] ?? '') as string;
    const secret = config?.webhookSecret ?? '';

    if (!verifyGithubSignature(secret, rawBody, sigHeader)) {
      return reply.code(401).send({ error: 'invalid signature' });
    }

    const event = toPullRequestEvent(request.body);

    if (event !== null) {
      const resolveChangedPaths = options?.resolveChangedPaths;

      if (resolveChangedPaths !== undefined) {
        // Resolve changed paths from the merge SHA via the injected resolver.
        // On error: log, respond 202 (webhook acknowledged) but skip enqueue.
        let changedPaths: string[];
        try {
          changedPaths = await resolveChangedPaths(event);
        } catch (err) {
          app.log.error({ err, prUrl: event.prUrl }, 'webhook: failed to resolve changed paths; skipping enqueue');
          return reply.code(202).send({ status: 'accepted' });
        }
        event.changedPaths = changedPaths;
        if (isRelevant(changedPaths)) {
          activeScheduler.enqueue(event);
        }
      } else {
        // Legacy / test callers without a resolver: use event.changedPaths as-is.
        if (isRelevant(event.changedPaths)) {
          activeScheduler.enqueue(event);
        }
      }

      return reply.code(202).send({ status: 'accepted' });
    }

    return reply.code(200).send({ status: 'ignored' });
  });

  // POST /search — RAG query endpoint.
  //
  // Body: { query: string }
  // Success (200): RagAnswer from answerQuery(query, getRetriever())
  // Error (400): empty or missing query
  app.post('/search', async (request, reply) => {
    const body = request.body as { query?: unknown } | null | undefined;
    const query = typeof body?.query === 'string' ? body.query.trim() : '';

    if (query === '') {
      return reply.code(400).send({ error: 'query must be a non-empty string' });
    }

    const answer = await answerQuery(query, getRetriever());
    return reply.code(200).send(answer);
  });

  return app;
}

export async function start(config: Config): Promise<void> {
  const app = buildApp(config);
  await app.listen({ port: config.port, host: '0.0.0.0' });
}

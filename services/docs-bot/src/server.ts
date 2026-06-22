import Fastify from 'fastify';
import type { Config } from './config.js';
import { verifyGithubSignature } from './webhook/verify.js';
import { toPullRequestEvent } from './webhook/normalize.js';
import { isRelevant } from './pipeline/filter.js';
import { makeScheduler } from './pipeline/scheduler.js';
import type { Scheduler } from './pipeline/scheduler.js';
import type { PullRequestEvent } from '@surf/types';

export function buildApp(config?: Config, scheduler?: Scheduler) {
  const app = Fastify({ logger: true });

  // ---------------------------------------------------------------------------
  // Scheduler setup
  //
  // A stub `run` callback is used until Task 11 wires the real pipeline.
  // Note: changedPaths is currently always [] from toPullRequestEvent (the
  // GitHub PR webhook payload doesn't include file paths). isRelevant([]) is
  // always false, so scheduler.enqueue will rarely fire from the webhook until
  // Task 5 populates changedPaths from the mergedSha. The wiring is correct
  // and future-proof for when Task 5/11 are in place.
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
      // Enqueue only if the changed paths are relevant (UI source files).
      // changedPaths is [] until Task 5 populates it from mergedSha — so
      // isRelevant([]) = false and this branch won't fire from the webhook
      // until then. The wiring is intentionally correct for Task 5/11.
      if (isRelevant(event.changedPaths)) {
        activeScheduler.enqueue(event);
      }
      return reply.code(202).send({ status: 'accepted' });
    }

    return reply.code(200).send({ status: 'ignored' });
  });

  return app;
}

export async function start(config: Config): Promise<void> {
  const app = buildApp(config);
  await app.listen({ port: config.port, host: '0.0.0.0' });
}

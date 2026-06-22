import Fastify from 'fastify';
import type { Config } from './config.js';
import { verifyGithubSignature } from './webhook/verify.js';
import { toPullRequestEvent } from './webhook/normalize.js';

/**
 * Stub handler for a normalised PR event.
 * The real scheduler/pipeline is wired in Task 4.
 */
function handlePullRequestEvent(event: ReturnType<typeof toPullRequestEvent>): void {
  // no-op for now; Task 4 wires the scheduler
  void event;
}

export function buildApp(config?: Config) {
  const app = Fastify({ logger: true });

  app.get('/health', async () => {
    return { ok: true };
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
    const rawBody: Buffer = (request as unknown as { rawBody: Buffer }).rawBody;
    const sigHeader = (request.headers['x-hub-signature-256'] ?? '') as string;
    const secret = config?.webhookSecret ?? '';

    if (!verifyGithubSignature(secret, rawBody, sigHeader)) {
      return reply.code(401).send({ error: 'invalid signature' });
    }

    const event = toPullRequestEvent(request.body);

    if (event !== null) {
      handlePullRequestEvent(event);
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

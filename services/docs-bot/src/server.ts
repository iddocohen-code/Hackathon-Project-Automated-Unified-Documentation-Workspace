import Fastify from 'fastify';
import type { Config } from './config.js';

export function buildApp() {
  const app = Fastify({ logger: true });

  app.get('/health', async () => {
    return { ok: true };
  });

  return app;
}

export async function start(config: Config): Promise<void> {
  const app = buildApp();
  await app.listen({ port: config.port, host: '0.0.0.0' });
}

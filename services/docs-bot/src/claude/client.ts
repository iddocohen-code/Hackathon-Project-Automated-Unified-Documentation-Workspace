import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Lazy singleton Anthropic client.
 * `dotenv/config` is imported first so `ANTHROPIC_API_KEY` is available
 * from a local `.env` file in development.
 */
let _client: Anthropic | undefined;

export function getClient(): Anthropic {
  if (_client === undefined) {
    _client = new Anthropic();
  }
  return _client;
}

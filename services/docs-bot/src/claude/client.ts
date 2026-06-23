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
    // maxRetries with the SDK's exponential backoff so transient capacity
    // errors (429 / 5xx, incl. 529 "overloaded") are ridden through rather
    // than aborting a pipeline job — important for live demos.
    _client = new Anthropic({ maxRetries: 8 });
  }
  return _client;
}

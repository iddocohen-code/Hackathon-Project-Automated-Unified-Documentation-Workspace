import type { Config } from '../config.js';
import { KeywordRetriever } from './keywordRetriever.js';
import type { Retriever } from './retriever.js';

/**
 * Factory that returns the appropriate Retriever implementation based on config.
 *
 * Current modes:
 *   - 'keyword' (default): deterministic in-memory BM25-lite KeywordRetriever
 *   - 'vector': seam for Task 8's VectorRetriever — throws until implemented
 */
export function makeRetriever(config: Pick<Config, 'retrieverMode'>): Retriever {
  switch (config.retrieverMode) {
    case 'keyword':
      return new KeywordRetriever();

    case 'vector':
      // Task 8 seam: VectorRetriever will be wired here.
      throw new Error(
        'retrieverMode=vector is not yet implemented (Task 8). Use retrieverMode=keyword.',
      );

    default: {
      // TypeScript exhaustiveness guard — should never be reached with valid config.
      const _exhaustive: never = config.retrieverMode;
      throw new Error(`Unknown retrieverMode: ${String(_exhaustive)}`);
    }
  }
}

/**
 * index-state.ts — module-held retriever singleton for the docs-bot.
 *
 * Design:
 *   - `initIndex(config)` must be called once at boot (index.ts) before any
 *     `getRetriever()` / `rebuildIndex()` call. It stores the config and
 *     creates the retriever via `makeRetriever`.
 *   - `rebuildIndex()` loads the corpus from disk and calls `retriever.build()`.
 *     It can be called again whenever the content changes (e.g. after publish).
 *   - `getRetriever()` returns the module-held retriever instance (already built).
 *
 * Testability: `initIndex` accepts any object satisfying the two config fields
 * it needs, making it straightforward to inject a test config without side effects.
 */

import { makeRetriever } from './makeRetriever.js';
import { loadCorpus } from './corpus.js';
import type { Retriever } from './retriever.js';
import type { Config } from '../config.js';

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let retriever: Retriever | null = null;
let indexConfig: Pick<Config, 'retrieverMode' | 'docsContentDir'> | null = null;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialize the index state with the given config. Must be called once before
 * `getRetriever()` or `rebuildIndex()`. Safe to call again (re-creates retriever
 * and clears old index — call `rebuildIndex()` after to re-populate).
 */
export function initIndex(config: Pick<Config, 'retrieverMode' | 'docsContentDir'>): void {
  indexConfig = config;
  retriever = makeRetriever(config);
}

/**
 * Returns the module-held Retriever instance.
 * @throws if `initIndex` has not been called.
 */
export function getRetriever(): Retriever {
  if (retriever === null) {
    throw new Error('getRetriever: index not initialised — call initIndex(config) at boot');
  }
  return retriever;
}

/**
 * Loads the corpus from disk and rebuilds the retriever index in-place.
 * Call once at boot after `initIndex`, and again after each successful publish.
 *
 * @throws if `initIndex` has not been called, or if corpus loading fails.
 */
export async function rebuildIndex(): Promise<void> {
  if (retriever === null || indexConfig === null) {
    throw new Error('rebuildIndex: index not initialised — call initIndex(config) at boot');
  }
  const docs = await loadCorpus(indexConfig.docsContentDir);
  await retriever.build(docs);
}

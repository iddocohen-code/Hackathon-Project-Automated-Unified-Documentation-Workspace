import type { Doc } from '@surf/types';
import { buildSections } from './retriever.js';
import type { DocSection, RetrievedPassage, Retriever } from './retriever.js';

// ---------------------------------------------------------------------------
// Stopword list
// A small, practical set of common English function words that add no signal.
// Tokens shorter than 3 characters are also dropped in tokenisation.
// ---------------------------------------------------------------------------
const STOPWORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can',
  'her', 'was', 'one', 'our', 'out', 'had', 'has', 'its', 'his',
  'how', 'did', 'get', 'him', 'let', 'put', 'say', 'she', 'too',
  'use', 'way', 'who', 'will', 'with', 'this', 'that', 'they',
  'from', 'have', 'been', 'were', 'said', 'each', 'what', 'when',
  'which', 'their', 'there', 'about', 'would', 'these', 'other',
  'into', 'than', 'then', 'some', 'could', 'time', 'your', 'more',
  'also', 'over', 'such', 'even', 'most', 'after',
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Lowercase-tokenise a string, drop stopwords and tokens shorter than 3 chars.
 */
function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

// ---------------------------------------------------------------------------
// KeywordRetriever
// ---------------------------------------------------------------------------

/**
 * An in-memory, deterministic keyword retriever.
 *
 * Scoring:
 *   For each query token present in a section, add 1 to the score.
 *   If the token also appears in the section heading, add 3 instead.
 *   Total score = sum of per-token contributions across all query tokens.
 *
 * Only sections with score > 0 are returned. Results are sorted by score
 * descending and truncated to k (default 4).
 */
export class KeywordRetriever implements Retriever {
  private sections: DocSection[] = [];

  async build(docs: Doc[]): Promise<void> {
    this.sections = buildSections(docs);
  }

  async retrieve(query: string, k = 4): Promise<RetrievedPassage[]> {
    const queryTokens = tokenise(query);
    if (queryTokens.length === 0) return [];

    const scored: RetrievedPassage[] = [];

    for (const section of this.sections) {
      const bodyTokenSet = new Set(tokenise(section.text));
      const headingTokenSet = new Set(tokenise(section.heading));

      let score = 0;
      for (const token of queryTokens) {
        if (headingTokenSet.has(token)) {
          // Heading match: weight ×3
          score += 3;
        } else if (bodyTokenSet.has(token)) {
          // Body-only match: weight ×1
          score += 1;
        }
      }

      if (score > 0) {
        scored.push({ ...section, score });
      }
    }

    // Sort by score descending, then return top k.
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  }
}

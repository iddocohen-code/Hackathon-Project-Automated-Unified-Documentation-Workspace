import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { getClient } from '../claude/client.js';
import { RagSynthesisSchema } from '../claude/schemas.js';
import { buildRagPrompt } from '../claude/prompts.js';
import type { RagAnswer } from '@surf/types';
import type { Retriever } from './retriever.js';

/**
 * Retrieves relevant passages for `query` using `retriever`, then calls
 * Claude Sonnet 4.6 to synthesize a grounded answer with cited passage indices.
 *
 * Short-circuits (no Claude call) when the retriever returns no passages.
 *
 * @param query   The user's natural-language question.
 * @param retriever A built Retriever (KeywordRetriever or any compatible impl).
 * @returns A RagAnswer with the synthesized answer and deep-linked citations.
 */
export async function answerQuery(
  query: string,
  retriever: Retriever,
): Promise<RagAnswer> {
  const passages = await retriever.retrieve(query, 4);

  // Short-circuit: no passages → no Claude call, no citations
  if (passages.length === 0) {
    return {
      query,
      answer: "I couldn't find anything about that in the current documentation.",
      citations: [],
    };
  }

  const client = getClient();
  const message = await buildRagPrompt({ query, passages });

  const response = await client.messages.parse({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    output_config: {
      format: zodOutputFormat(RagSynthesisSchema),
    },
    messages: [message],
  });

  if (response.parsed_output == null) {
    throw new Error('Claude returned no parsed output for RAG synthesis');
  }

  const { answer, citedPassageIndices } = response.parsed_output;

  // Assemble citations from the cited indices, guarding against out-of-range indices
  const citations = citedPassageIndices
    .map((i) => passages[i])
    .filter((p): p is NonNullable<typeof p> => p != null)
    .map((p) => ({
      docId: p.docId,
      title: p.docTitle,
      snippet: p.text.length > 240 ? p.text.slice(0, 240) + '…' : p.text,
      score: p.score,
      deepLink: `/docs/${p.docId}#${p.anchor}`,
    }));

  return { query, answer, citations };
}

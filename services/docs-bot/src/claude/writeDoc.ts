import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { getClient } from './client.js';
import { DocDraftSchema } from './schemas.js';
import { buildWriterPrompt } from './prompts.js';
import type { ContextRef, Doc, Screenshot } from '@surf/types';
import type { DiffAnalysis, DocDraft } from './schemas.js';

export interface WriteDocInput {
  /** The existing Doc — id, title, bodyMarkdown, and version used for context */
  existingDoc: Pick<Doc, 'id' | 'title' | 'bodyMarkdown' | 'version'>;
  /** Structured diff analysis from analyzeDiff (Task 7) */
  diffAnalysis: DiffAnalysis;
  /** Context references from aggregateContext (Task 6) */
  context: ContextRef[];
  /** Screenshot metadata (alt + path) — for context only, NOT inlined as markdown image */
  screenshotMeta: Pick<Screenshot, 'alt' | 'path'> | null;
}

/**
 * Calls Claude Opus 4.8 with structured output to regenerate a documentation
 * page body in Upwind's tone, incorporating the new UI change described by
 * the DiffAnalysis and informed by Jira/Slack context references.
 *
 * Returns a DocDraft: { bodyMarkdown, changeSummary, title }.
 * The caller (Task 10/11) assembles the full Doc: bumps version to 4,
 * sets updatedAt, attaches screenshots, and sets lastChange = changeSummary.
 */
export async function writeDoc(input: WriteDocInput): Promise<DocDraft> {
  const client = getClient();

  const { system, userContent } = await buildWriterPrompt(input);

  const response = await client.messages.parse({
    model: 'claude-opus-4-8',
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'high',
      format: zodOutputFormat(DocDraftSchema),
    },
    system,
    messages: [
      {
        role: 'user',
        content: userContent,
      },
    ],
  });

  if (response.parsed_output == null) {
    throw new Error('Claude returned no parsed output for doc writing');
  }

  return response.parsed_output;
}

import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { getClient } from './client.js';
import { DiffAnalysisSchema } from './schemas.js';
import { buildAnalyzerPrompt } from './prompts.js';
import type { ContextRef, DocsManifest } from '@surf/types';
import type { FilePatch } from '../git/diff.js';
import type { DiffAnalysis } from './schemas.js';

export interface AnalyzeDiffInput {
  diff: FilePatch[];
  context: ContextRef[];
  existingDocs: DocsManifest;
}

/**
 * Calls Claude Opus 4.8 with structured output to analyze a git diff and
 * return a DiffAnalysis: which doc changed, what structurally changed,
 * the human intent, and the severity.
 */
export async function analyzeDiff(input: AnalyzeDiffInput): Promise<DiffAnalysis> {
  const client = getClient();

  const { system, userContent } = await buildAnalyzerPrompt(input);

  const response = await client.messages.parse({
    model: 'claude-opus-4-8',
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'high',
      format: zodOutputFormat(DiffAnalysisSchema),
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
    throw new Error('Claude returned no parsed output for diff analysis');
  }

  return response.parsed_output;
}

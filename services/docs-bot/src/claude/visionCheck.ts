import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { getClient } from './client.js';
import { VisionVerdictSchema } from './schemas.js';
import type { VisionVerdict } from './schemas.js';

/**
 * Uses Claude Sonnet 4.6 to check whether a PNG screenshot visually confirms
 * a claimed UI change.
 *
 * The image block MUST come before the text block so the model can ground its
 * answer in the visual evidence before reading the claim.
 */
export async function visionCheck(
  pngBuffer: Buffer,
  claimedChange: string,
): Promise<VisionVerdict> {
  const client = getClient();

  const response = await client.messages.parse({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    output_config: {
      format: zodOutputFormat(VisionVerdictSchema),
    },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: pngBuffer.toString('base64'),
            },
          },
          {
            type: 'text',
            text: `Look at this screenshot of a UI panel. Does the screenshot show the following change?\n\n"${claimedChange}"\n\nAnswer with showsChange: true if the change is clearly present in the screenshot, or false if it is absent. Include a concise one-line note explaining your reasoning.`,
          },
        ],
      },
    ],
  });

  if (response.parsed_output == null) {
    throw new Error('Claude returned no parsed output for vision check');
  }

  return response.parsed_output;
}

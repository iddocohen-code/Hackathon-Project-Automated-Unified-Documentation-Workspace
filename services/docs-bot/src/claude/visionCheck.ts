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
            text: `Look at this screenshot of a UI panel in its DEFAULT, freshly-loaded state. A change was made to this component, described below.\n\nIMPORTANT: part of the described change may be interactive or conditional UI that only appears AFTER a user action (a click, toggle, or state change). Those elements will NOT be visible in this static screenshot, and their absence is expected and fine.\n\nAnswer showsChange: true if the screenshot shows the main STATICALLY-VISIBLE part of the change — e.g. a newly added button, control, icon, label, or element is present in the default view. Answer false ONLY if there is no visible evidence of the change at all (the new static element is missing entirely). Do NOT require post-click / triggered / conditional states (banners, active-state pills, modals) to be visible.\n\nDescribed change:\n"${claimedChange}"\n\nInclude a concise one-line note explaining what visible evidence you based the answer on.`,
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

import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verifies a GitHub webhook HMAC-SHA256 signature.
 *
 * @param secret          - The webhook secret configured in GitHub.
 * @param rawBody         - The exact raw request body bytes.
 * @param signatureHeader - The value of the `x-hub-signature-256` header
 *                          (expected format: `sha256=<hex>`).
 * @returns true if the signature matches, false otherwise (never throws).
 */
export function verifyGithubSignature(
  secret: string,
  rawBody: Buffer,
  signatureHeader: string,
): boolean {
  try {
    if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
      return false;
    }

    const hex = signatureHeader.slice('sha256='.length);
    if (!hex) {
      return false;
    }

    const expected = Buffer.from(
      createHmac('sha256', secret).update(rawBody).digest('hex'),
      'utf8',
    );
    const actual = Buffer.from(hex, 'utf8');

    // Buffers must be same length for timingSafeEqual; mismatched length = false.
    if (expected.length !== actual.length) {
      return false;
    }

    return timingSafeEqual(expected, actual);
  } catch {
    // Malformed input — treat as invalid rather than propagating.
    return false;
  }
}

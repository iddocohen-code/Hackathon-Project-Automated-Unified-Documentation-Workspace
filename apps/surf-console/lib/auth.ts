/**
 * auth.ts — single-operator session signing for the /admin gate.
 *
 * Pure + runtime-agnostic: uses Web Crypto (globalThis.crypto.subtle), so the
 * same functions work in the Edge middleware and in Node route handlers. No
 * Node-only APIs, no I/O — env reading happens in the callers.
 *
 * Token format:  base64url(JSON{exp}) + "." + base64url(HMAC-SHA256(payloadB64, secret))
 */

export const COOKIE_NAME = 'admin_session';
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h fixed

const encoder = new TextEncoder();

function bytesToB64url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function stringToB64url(s: string): string {
  return bytesToB64url(encoder.encode(s));
}

function b64urlToString(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  return atob(b64);
}

/** Constant-time string compare (length-safe). */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

async function hmacB64url(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return bytesToB64url(new Uint8Array(sig));
}

/** Produce a signed session cookie value that expires `ttlMs` from `now`. */
export async function signSession(
  secret: string,
  ttlMs: number = SESSION_TTL_MS,
  now: number = Date.now(),
): Promise<string> {
  const payloadB64 = stringToB64url(JSON.stringify({ exp: now + ttlMs }));
  const sigB64 = await hmacB64url(secret, payloadB64);
  return `${payloadB64}.${sigB64}`;
}

/** Verify signature + expiry. Returns true only for an untampered, unexpired token. */
export async function verifySession(
  secret: string,
  token: string | undefined | null,
  now: number = Date.now(),
): Promise<boolean> {
  if (!secret || !token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts as [string, string];

  const expectedSig = await hmacB64url(secret, payloadB64);
  if (!constantTimeEqual(sigB64, expectedSig)) return false;

  let payload: { exp?: unknown };
  try {
    payload = JSON.parse(b64urlToString(payloadB64));
  } catch {
    return false;
  }
  if (typeof payload.exp !== 'number') return false;
  return payload.exp > now;
}

/** Constant-time password check against the configured ADMIN_PASSWORD. */
export function verifyPassword(input: string, expected: string): boolean {
  if (!expected) return false; // never authenticate against an empty/unset password
  return constantTimeEqual(input, expected);
}

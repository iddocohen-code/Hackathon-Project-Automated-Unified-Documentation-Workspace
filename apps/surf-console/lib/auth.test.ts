import { describe, it, expect } from 'vitest';
import { signSession, verifySession, verifyPassword } from './auth';

const SECRET = 'test-session-secret-please-change';

describe('signSession / verifySession', () => {
  it('a freshly signed token verifies as valid', async () => {
    const token = await signSession(SECRET, 60_000, 1_000);
    expect(await verifySession(SECRET, token, 1_000)).toBe(true);
  });

  it('rejects a token whose payload was tampered with', async () => {
    const token = await signSession(SECRET, 60_000, 1_000);
    const [payload, sig] = token.split('.');
    // flip a char in the payload, keep the original signature
    const tamperedPayload = (payload![0] === 'A' ? 'B' : 'A') + payload!.slice(1);
    expect(await verifySession(SECRET, `${tamperedPayload}.${sig}`, 1_000)).toBe(false);
  });

  it('rejects a token whose signature was tampered with', async () => {
    const token = await signSession(SECRET, 60_000, 1_000);
    const [payload, sig] = token.split('.');
    const tamperedSig = (sig![0] === 'A' ? 'B' : 'A') + sig!.slice(1);
    expect(await verifySession(SECRET, `${payload}.${tamperedSig}`, 1_000)).toBe(false);
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await signSession('a-different-secret', 60_000, 1_000);
    expect(await verifySession(SECRET, token, 1_000)).toBe(false);
  });

  it('rejects an expired token but accepts it before expiry', async () => {
    const token = await signSession(SECRET, 1_000, 0); // exp = 1000
    expect(await verifySession(SECRET, token, 500)).toBe(true); // before expiry
    expect(await verifySession(SECRET, token, 2_000)).toBe(false); // after expiry
  });

  it('rejects malformed / missing tokens', async () => {
    expect(await verifySession(SECRET, undefined)).toBe(false);
    expect(await verifySession(SECRET, '')).toBe(false);
    expect(await verifySession(SECRET, 'no-dot-here')).toBe(false);
    expect(await verifySession(SECRET, 'a.b.c')).toBe(false);
  });

  it('rejects everything when the secret is empty', async () => {
    const token = await signSession(SECRET, 60_000, 1_000);
    expect(await verifySession('', token, 1_000)).toBe(false);
  });
});

describe('verifyPassword', () => {
  it('accepts the exact password', () => {
    expect(verifyPassword('hunter2', 'hunter2')).toBe(true);
  });
  it('rejects a wrong password', () => {
    expect(verifyPassword('wrong', 'hunter2')).toBe(false);
  });
  it('rejects when the configured password is empty/unset', () => {
    expect(verifyPassword('', '')).toBe(false);
    expect(verifyPassword('anything', '')).toBe(false);
  });
});

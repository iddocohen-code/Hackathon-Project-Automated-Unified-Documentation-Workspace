/**
 * POST /admin/api/login — exchange the admin password for a signed session cookie.
 * Unauthenticated entry (allowlisted in middleware). Node runtime.
 */

import { NextResponse } from 'next/server';
import { signSession, verifyPassword, COOKIE_NAME, SESSION_TTL_MS } from '@/lib/auth';

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: unknown };
  const expected = process.env.ADMIN_PASSWORD ?? '';

  if (typeof password !== 'string' || !verifyPassword(password, expected)) {
    return NextResponse.json({ error: 'invalid password' }, { status: 401 });
  }

  const secret = process.env.ADMIN_SESSION_SECRET ?? '';
  if (!secret) {
    // Misconfiguration: refuse to mint a cookie we can't verify later.
    return NextResponse.json({ error: 'server auth not configured' }, { status: 500 });
  }

  const token = await signSession(secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/admin',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  return res;
}

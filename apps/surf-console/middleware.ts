/**
 * middleware.ts — the /admin gate (Edge runtime).
 *
 * Protects every /admin/:path* route. The only unauthenticated entries are the
 * login page and the login API. A valid signed `admin_session` cookie lets the
 * request through; otherwise API paths get 401 JSON and page paths redirect to
 * the login page. Cookie verification uses Web Crypto (Edge-safe) via lib/auth.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession, COOKIE_NAME } from '@/lib/auth';

const PUBLIC_PATHS = new Set<string>(['/admin/login', '/admin/api/login']);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const secret = process.env.ADMIN_SESSION_SECRET ?? '';
  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (await verifySession(secret, token)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin/api')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/admin/login';
  loginUrl.search = '';
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*'],
};

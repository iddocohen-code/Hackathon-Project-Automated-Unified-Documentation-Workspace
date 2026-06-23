/**
 * adminSession.ts — SERVER-ONLY helper that checks whether the current request
 * carries a valid admin session cookie.
 *
 * Import only in async Server Components or Route Handlers — never in
 * "use client" modules or shared utilities that run on the client.
 */

import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "./auth";

/**
 * Returns true when the incoming request has a valid, unexpired admin session
 * cookie. Returns false when the cookie is absent, malformed, or the
 * ADMIN_SESSION_SECRET env-var is unset — so by default (no config) nobody
 * sees admin UI.
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    return await verifySession(process.env.ADMIN_SESSION_SECRET ?? "", token);
  } catch {
    return false;
  }
}

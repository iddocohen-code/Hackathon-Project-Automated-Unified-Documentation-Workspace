/**
 * GET /docs/agent/api/llms — server-side proxy to the docs-bot /llms.txt endpoint.
 *
 * Forwards the request to the bot (BOT_URL env var, never NEXT_PUBLIC_* so the URL
 * stays server-side) and returns the plaintext index with content-type: text/plain.
 *
 * On network error or a non-OK bot response → 502 text "Docs engine offline".
 */

import { NextResponse } from "next/server";

const BOT_URL = process.env.BOT_URL ?? "http://localhost:4000";

export async function GET(): Promise<NextResponse> {
  let botResponse: Response;
  try {
    botResponse = await fetch(`${BOT_URL}/llms.txt`);
  } catch {
    // Network error — bot is unreachable
    return new NextResponse("Docs engine offline", {
      status: 502,
      headers: { "Content-Type": "text/plain" },
    });
  }

  if (!botResponse.ok) {
    return new NextResponse("Docs engine offline", {
      status: 502,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const text = await botResponse.text();
  return new NextResponse(text, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

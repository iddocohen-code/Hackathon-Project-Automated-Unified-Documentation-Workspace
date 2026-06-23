/**
 * GET /docs/agent/api/corpus — server-side proxy to the docs-bot /agent/corpus endpoint.
 *
 * Forwards the request to the bot (BOT_URL env var, never NEXT_PUBLIC_* so the URL
 * stays server-side) and returns the bot's JSON corpus array on success.
 *
 * On network error or a non-OK bot response → 502 { error: "Docs engine offline" }.
 */

import { NextResponse } from "next/server";

const BOT_URL = process.env.BOT_URL ?? "http://localhost:4000";

export async function GET(): Promise<NextResponse> {
  let botResponse: Response;
  try {
    botResponse = await fetch(`${BOT_URL}/agent/corpus`);
  } catch {
    // Network error — bot is unreachable
    return NextResponse.json({ error: "Docs engine offline" }, { status: 502 });
  }

  if (!botResponse.ok) {
    return NextResponse.json({ error: "Docs engine offline" }, { status: 502 });
  }

  const corpus = await botResponse.json();
  return NextResponse.json(corpus, { status: 200 });
}

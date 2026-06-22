/**
 * POST /docs/api/search — server-side proxy to the docs-bot RAG /search endpoint.
 *
 * Reads { query } from the request body, forwards it to the bot (BOT_URL env var,
 * never NEXT_PUBLIC_* so the URL stays server-side), and returns the bot's RagAnswer
 * JSON on success.
 *
 * On network error or a non-OK bot response → 502 (client renders "Search engine offline").
 */

import { NextRequest, NextResponse } from "next/server";
import type { RagAnswer } from "@surf/types";

const BOT_URL = process.env.BOT_URL ?? "http://localhost:4000";

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: { query?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const query = typeof body?.query === "string" ? body.query.trim() : "";
  if (!query) {
    return NextResponse.json({ error: "query must be a non-empty string" }, { status: 400 });
  }

  let botResponse: Response;
  try {
    botResponse = await fetch(`${BOT_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
  } catch {
    // Network error — bot is unreachable
    return NextResponse.json({ error: "Search engine offline" }, { status: 502 });
  }

  if (!botResponse.ok) {
    // Non-OK response from bot (e.g. 500, 503)
    return NextResponse.json({ error: "Search engine offline" }, { status: 502 });
  }

  const ragAnswer: RagAnswer = await botResponse.json();
  return NextResponse.json(ragAnswer, { status: 200 });
}

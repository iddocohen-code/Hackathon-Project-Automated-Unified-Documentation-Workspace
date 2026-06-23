/**
 * POST /admin/api/docs/[slug]/save — authenticated proxy to the bot's
 * single-writer endpoint.
 *
 * Behind the middleware gate (valid session required). Attaches the
 * BOT_ADMIN_TOKEN server-side so the secret never reaches the browser, then
 * relays the bot's status + body verbatim (200 / 409 / 4xx / 5xx). Node runtime.
 */

import { NextResponse } from 'next/server';

interface SaveBody {
  bodyMarkdown?: unknown;
  title?: unknown;
  changeNote?: unknown;
  baseVersion?: unknown;
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = (await req.json().catch(() => ({}))) as SaveBody;

  if (typeof body.bodyMarkdown !== 'string' || typeof body.baseVersion !== 'number') {
    return NextResponse.json(
      { error: 'bodyMarkdown (string) and baseVersion (number) are required' },
      { status: 400 },
    );
  }

  const botUrl = process.env.BOT_INTERNAL_URL ?? 'http://localhost:4000';
  const token = process.env.BOT_ADMIN_TOKEN ?? '';

  const payload = {
    docId: slug,
    bodyMarkdown: body.bodyMarkdown,
    baseVersion: body.baseVersion,
    ...(typeof body.title === 'string' ? { title: body.title } : {}),
    ...(typeof body.changeNote === 'string' ? { changeNote: body.changeNote } : {}),
  };

  let resp: Response;
  try {
    resp = await fetch(`${botUrl}/admin/save`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify(payload),
    });
  } catch {
    return NextResponse.json({ error: 'docs-bot unreachable' }, { status: 502 });
  }

  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(data, { status: resp.status });
}

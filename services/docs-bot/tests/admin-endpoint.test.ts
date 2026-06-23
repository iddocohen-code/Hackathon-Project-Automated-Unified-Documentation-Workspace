/**
 * Tests for POST /admin/save — the bot's authenticated manual-save endpoint.
 * Auth (x-admin-token) lives in server.ts; the write is delegated to an
 * injected `adminSave` handler, which we stub here to exercise the HTTP layer.
 */

import { describe, it, expect } from 'vitest';
import { buildApp } from '../src/server.js';
import type { Config } from '../src/config.js';
import type { AdminSavePayload, AdminSaveResult } from '../src/server.js';

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    schedulerMode: 'instant',
    surfConsoleUrl: 'http://localhost:3000',
    docsContentDir: '/tmp/docs',
    screenshotsPublicDir: '/tmp/shots',
    webhookSecret: '',
    adminToken: 'super-secret-token',
    port: 4000,
    ...overrides,
  } as Config;
}

const validBody: AdminSavePayload = {
  docId: 'shark-mitigation',
  bodyMarkdown: '## Edited\n\nNew prose.',
  baseVersion: 3,
};

describe('POST /admin/save', () => {
  it('503 when no admin token is configured (endpoint disabled)', async () => {
    const app = buildApp(makeConfig({ adminToken: '' }), undefined, {
      adminSave: async () => ({ status: 200, body: { ok: true } }),
    });
    const res = await app.inject({ method: 'POST', url: '/admin/save', payload: validBody });
    expect(res.statusCode).toBe(503);
  });

  it('401 when x-admin-token is missing or wrong', async () => {
    const app = buildApp(makeConfig(), undefined, {
      adminSave: async () => ({ status: 200, body: { ok: true } }),
    });
    const missing = await app.inject({ method: 'POST', url: '/admin/save', payload: validBody });
    expect(missing.statusCode).toBe(401);

    const wrong = await app.inject({
      method: 'POST',
      url: '/admin/save',
      headers: { 'x-admin-token': 'nope' },
      payload: validBody,
    });
    expect(wrong.statusCode).toBe(401);
  });

  it('400 when required fields are missing', async () => {
    const app = buildApp(makeConfig(), undefined, {
      adminSave: async () => ({ status: 200, body: { ok: true } }),
    });
    const res = await app.inject({
      method: 'POST',
      url: '/admin/save',
      headers: { 'x-admin-token': 'super-secret-token' },
      payload: { docId: 'x' }, // missing bodyMarkdown + baseVersion
    });
    expect(res.statusCode).toBe(400);
  });

  it('501 when token is valid but no adminSave handler is wired', async () => {
    const app = buildApp(makeConfig(), undefined, {});
    const res = await app.inject({
      method: 'POST',
      url: '/admin/save',
      headers: { 'x-admin-token': 'super-secret-token' },
      payload: validBody,
    });
    expect(res.statusCode).toBe(501);
  });

  it('200 and passes the parsed payload to adminSave on success', async () => {
    let received: AdminSavePayload | null = null;
    const app = buildApp(makeConfig(), undefined, {
      adminSave: async (p): Promise<AdminSaveResult> => {
        received = p;
        return { status: 200, body: { ok: true, version: 4 } };
      },
    });
    const res = await app.inject({
      method: 'POST',
      url: '/admin/save',
      headers: { 'x-admin-token': 'super-secret-token' },
      payload: { ...validBody, title: 'New Title', changeNote: 'fixed wording' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true, version: 4 });
    expect(received).toMatchObject({
      docId: 'shark-mitigation',
      baseVersion: 3,
      title: 'New Title',
      changeNote: 'fixed wording',
    });
  });

  it('passes through a 409 version conflict from adminSave', async () => {
    const app = buildApp(makeConfig(), undefined, {
      adminSave: async (): Promise<AdminSaveResult> => ({
        status: 409,
        body: { error: 'version conflict', currentVersion: 5 },
      }),
    });
    const res = await app.inject({
      method: 'POST',
      url: '/admin/save',
      headers: { 'x-admin-token': 'super-secret-token' },
      payload: validBody,
    });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({ error: 'version conflict', currentVersion: 5 });
  });

  it('500 (nothing written) when adminSave throws', async () => {
    const app = buildApp(makeConfig(), undefined, {
      adminSave: async (): Promise<AdminSaveResult> => {
        throw new Error('disk on fire');
      },
    });
    const res = await app.inject({
      method: 'POST',
      url: '/admin/save',
      headers: { 'x-admin-token': 'super-secret-token' },
      payload: validBody,
    });
    expect(res.statusCode).toBe(500);
  });
});

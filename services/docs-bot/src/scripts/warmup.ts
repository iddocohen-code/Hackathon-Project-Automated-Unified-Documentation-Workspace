/**
 * warmup.ts — demo safety net warm-up.
 * Pings Claude models, launches+closes chromium, rebuilds RAG index, checks /health.
 * Does NOT mutate content/docs.
 */
import 'dotenv/config';
import { chromium } from 'playwright';
import { loadConfig } from '../config.js';
import { initIndex, rebuildIndex } from '../rag/index-state.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const results: { label: string; ok: boolean; detail?: string }[] = [];

  // 1. Claude ping — claude-opus-4-8
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic();
    await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'ping' }],
    });
    results.push({ label: 'Claude claude-opus-4-8 ping', ok: true });
  } catch (err) {
    results.push({ label: 'Claude claude-opus-4-8 ping', ok: false, detail: String(err) });
  }

  // 2. Claude ping — claude-sonnet-4-6
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic();
    await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'ping' }],
    });
    results.push({ label: 'Claude claude-sonnet-4-6 ping', ok: true });
  } catch (err) {
    results.push({ label: 'Claude claude-sonnet-4-6 ping', ok: false, detail: String(err) });
  }

  // 3. Chromium launch + close
  try {
    const browser = await chromium.launch({ headless: true });
    await browser.close();
    results.push({ label: 'Chromium launch+close', ok: true });
  } catch (err) {
    results.push({ label: 'Chromium launch+close', ok: false, detail: String(err) });
  }

  // 4. rebuildIndex
  try {
    initIndex(config);
    await rebuildIndex();
    results.push({ label: 'rebuildIndex()', ok: true });
  } catch (err) {
    results.push({ label: 'rebuildIndex()', ok: false, detail: String(err) });
  }

  // 5. GET /health
  try {
    const res = await fetch(`${config.surfConsoleUrl}/health`);
    results.push({ label: `GET ${config.surfConsoleUrl}/health`, ok: res.ok, detail: `HTTP ${res.status}` });
  } catch (err) {
    results.push({ label: `GET ${config.surfConsoleUrl}/health`, ok: false, detail: String(err) });
  }

  // Print results
  console.log('\n=== docs-bot warmup ===');
  for (const r of results) {
    const mark = r.ok ? '✓' : '✗';
    const detail = r.detail ? `  (${r.detail})` : '';
    console.log(`  ${mark}  ${r.label}${detail}`);
  }
  console.log('');
}

main().catch((err) => {
  console.error('warmup failed:', err);
  process.exit(1);
});

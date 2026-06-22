import { describe, it, expect } from 'vitest';
import { PlaywrightCapture } from '../src/capture/capture.js';
import { visionCheck } from '../src/claude/visionCheck.js';

// Skip when no Anthropic key (keeps keyless CI green)
const hasKey = Boolean(process.env['ANTHROPIC_API_KEY']);

// The portal runs on the before-state: Raise flag + Notify command, no siren yet
const SURF_CONSOLE_URL = process.env['SURF_CONSOLE_URL'] ?? 'http://localhost:3000';

describe.skipIf(!hasKey)('visionCheck (live, requires ANTHROPIC_API_KEY)', () => {
  it(
    'captures the shark panel and returns true for a claim that IS true of the before-state',
    async () => {
      const capturer = new PlaywrightCapture(SURF_CONSOLE_URL);
      const { pngBuffer } = await capturer.capture({
        route: '/',
        selector: '[data-doc-target="shark-mitigation"]',
      });

      // Sanity: captured a real PNG (>4 KB, valid PNG header 89 50 4E 47)
      expect(pngBuffer.length).toBeGreaterThan(4000);
      expect(pngBuffer[0]).toBe(0x89);
      expect(pngBuffer[1]).toBe(0x50); // P
      expect(pngBuffer[2]).toBe(0x4e); // N
      expect(pngBuffer[3]).toBe(0x47); // G

      const verdict = await visionCheck(
        pngBuffer,
        'the panel shows a "Raise flag" button and a "Notify command" button',
      );

      expect(verdict.showsChange).toBe(true);
      expect(typeof verdict.note).toBe('string');
      expect(verdict.note.length).toBeGreaterThan(0);

      console.log('[visionCheck TRUE claim] showsChange:', verdict.showsChange, '| note:', verdict.note);
    },
    60_000,
  );

  it(
    'returns false for a claim that is NOT true of the before-state (siren not present)',
    async () => {
      const capturer = new PlaywrightCapture(SURF_CONSOLE_URL);
      const { pngBuffer } = await capturer.capture({
        route: '/',
        selector: '[data-doc-target="shark-mitigation"]',
      });

      const verdict = await visionCheck(
        pngBuffer,
        'an Emergency Shark Siren button is present in the panel',
      );

      expect(verdict.showsChange).toBe(false);
      expect(typeof verdict.note).toBe('string');
      expect(verdict.note.length).toBeGreaterThan(0);

      console.log('[visionCheck FALSE claim] showsChange:', verdict.showsChange, '| note:', verdict.note);
    },
    60_000,
  );
});

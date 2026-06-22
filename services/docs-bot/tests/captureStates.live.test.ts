import { describe, it, expect } from 'vitest';
import { PlaywrightCapture } from '../src/capture/capture.js';

const SURF_CONSOLE_URL = process.env['SURF_CONSOLE_URL'] ?? 'http://localhost:3000';

/**
 * Check whether the portal is reachable before running the live test.
 * Returns true if we get a 2xx/3xx response, false otherwise.
 */
async function isPortalReachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    return res.ok || res.status < 400;
  } catch {
    return false;
  }
}

describe('captureStates (live, requires portal at :3000)', () => {
  it(
    'returns 2 states for shark-mitigation panel with Emergency Shark Siren interaction',
    async () => {
      const reachable = await isPortalReachable(SURF_CONSOLE_URL);
      if (!reachable) {
        console.warn(`[captureStates] Portal not reachable at ${SURF_CONSOLE_URL} — skipping`);
        return;
      }

      const capturer = new PlaywrightCapture(SURF_CONSOLE_URL);
      const { states, videoWebm } = await capturer.captureStates({
        route: '/',
        selector: '[data-doc-target="shark-mitigation"]',
        interactions: [{ label: 'Emergency Shark Siren' }],
      });

      // Must return exactly 2 states: default + 1 activated
      expect(states.length).toBe(2);

      // A non-empty interactions list must produce a looping .webm clip (>10KB).
      expect(videoWebm).toBeDefined();
      expect(videoWebm!.length).toBeGreaterThan(10_000);
      console.log(`[captureStates] videoWebm: ${videoWebm!.length} bytes`);

      const [defaultState, activatedState] = states;

      // First state must be labelled "default"
      expect(defaultState!.state).toBe('default');

      // Second state must be the siren-active slug
      expect(activatedState!.state).toBe('emergency-shark-siren-active');

      // Both PNG buffers must be valid PNGs (magic bytes 89 50 4E 47) and > 5 KB
      for (const s of states) {
        expect(s.pngBuffer.length).toBeGreaterThan(5000);
        expect(s.pngBuffer[0]).toBe(0x89);
        expect(s.pngBuffer[1]).toBe(0x50); // P
        expect(s.pngBuffer[2]).toBe(0x4e); // N
        expect(s.pngBuffer[3]).toBe(0x47); // G
      }

      // The second PNG must differ from the first (clicking revealed new UI)
      const defaultLen = defaultState!.pngBuffer.length;
      const activatedLen = activatedState!.pngBuffer.length;
      const buffersAreDifferent =
        defaultLen !== activatedLen ||
        !defaultState!.pngBuffer.equals(activatedState!.pngBuffer);

      expect(
        buffersAreDifferent,
        `Expected the activated state PNG to differ from the default state PNG (default: ${defaultLen} bytes, activated: ${activatedLen} bytes)`,
      ).toBe(true);

      console.log(
        `[captureStates] default PNG: ${defaultLen} bytes | activated PNG: ${activatedLen} bytes | differ: ${buffersAreDifferent}`,
      );
    },
    60_000,
  );

  it(
    'degrade path: a recording failure yields videoWebm undefined but still returns both stills',
    async () => {
      const reachable = await isPortalReachable(SURF_CONSOLE_URL);
      if (!reachable) {
        console.warn(`[captureStates] Portal not reachable at ${SURF_CONSOLE_URL} — skipping`);
        return;
      }

      // Point the video temp base at a non-existent path so mkdtemp throws,
      // forcing the recording-setup catch → videoWebm undefined.
      const badBaseDir = '/this/path/does/not/exist/docs-bot-bad-video-base';
      const capturer = new PlaywrightCapture(SURF_CONSOLE_URL, badBaseDir);
      const { states, videoWebm } = await capturer.captureStates({
        route: '/',
        selector: '[data-doc-target="shark-mitigation"]',
        interactions: [{ label: 'Emergency Shark Siren' }],
      });

      // Recording failed → no clip, but the stills survive intact.
      expect(videoWebm).toBeUndefined();
      expect(states.length).toBe(2);
      for (const s of states) {
        expect(s.pngBuffer.length).toBeGreaterThan(5000);
        expect(s.pngBuffer[0]).toBe(0x89);
        expect(s.pngBuffer[1]).toBe(0x50);
        expect(s.pngBuffer[2]).toBe(0x4e);
        expect(s.pngBuffer[3]).toBe(0x47);
      }
      console.log('[captureStates] degrade path OK: videoWebm undefined, 2 stills returned');
    },
    60_000,
  );
});

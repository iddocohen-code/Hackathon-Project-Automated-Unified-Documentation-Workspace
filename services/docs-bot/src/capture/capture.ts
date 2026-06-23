import { chromium } from 'playwright';
import type { BrowserContext, Page } from 'playwright';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * Target definition for a screenshot capture.
 * `route` is appended to the base URL; `selector` scopes to a single element.
 */
export interface CaptureTarget {
  route: string;
  selector?: string;
}

/**
 * Result of a screenshot capture.
 */
export interface CaptureResult {
  pngBuffer: Buffer;
  alt: string;
}

/**
 * A single captured state: the default panel state or an activated/revealed state.
 * `state` is `"default"` or a short slug derived from the interaction label (e.g. `"siren-active"`).
 */
export interface CapturedState {
  state: string;
  pngBuffer: Buffer;
  alt: string;
}

/**
 * Interaction plan entry: a control label to click and an optional description of what it reveals.
 */
export interface InteractionPlan {
  label: string;
  reveals?: string;
}

/**
 * Target definition for a multi-state capture.
 */
export interface MultiStateCaptureTarget {
  route: string;
  selector?: string;
  interactions: InteractionPlan[];
}

/**
 * Result of a multi-state capture: the per-state PNGs plus an OPTIONAL looping
 * `.webm` clip of the interaction session. `videoWebm` is present only when the
 * target had a non-empty `interactions` list AND recording succeeded; a
 * recording failure yields `videoWebm: undefined` while the stills survive.
 */
export interface MultiStateCaptureResult {
  states: CapturedState[];
  videoWebm?: Buffer;
}

/**
 * Interface for screenshot capture backends.
 * Implementations: PlaywrightCapture (headless chromium); future: ComputerUseCapture.
 */
export interface ScreenshotCapture {
  capture(target: CaptureTarget): Promise<CaptureResult>;
  captureStates(target: MultiStateCaptureTarget): Promise<MultiStateCaptureResult>;
}

/**
 * Converts an interaction label into a short URL-safe slug for use as the state name.
 * Example: "Emergency Shark Siren" → "emergency-shark-siren-active"
 */
function labelToSlug(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-active'
  );
}

/**
 * Injects a visible fake cursor (a red dot) that follows mouse events, so a
 * headed/demo capture session shows the pointer gliding to and clicking
 * controls — Playwright renders no cursor by default. Demo-only; never used
 * on the headless path. Passed as a script string so it needs no DOM lib types.
 */
async function installDemoCursor(page: Page): Promise<void> {
  await page.addScriptTag({
    content: `
      (function(){
        if (document.getElementById('__demo_cursor__')) return;
        var c = document.createElement('div');
        c.id = '__demo_cursor__';
        c.style.cssText = 'position:fixed;top:0;left:-100px;width:22px;height:22px;border-radius:50%;background:rgba(239,68,68,0.45);border:2px solid rgba(239,68,68,0.95);box-shadow:0 0 10px rgba(239,68,68,0.6);pointer-events:none;z-index:2147483647;margin-left:-11px;margin-top:-11px;transition:width .08s,height .08s,background .08s';
        document.body.appendChild(c);
        document.addEventListener('mousemove', function(e){ c.style.left=e.clientX+'px'; c.style.top=e.clientY+'px'; }, true);
        document.addEventListener('mousedown', function(){ c.style.width='14px'; c.style.height='14px'; c.style.background='rgba(239,68,68,0.9)'; }, true);
        document.addEventListener('mouseup', function(){ c.style.width='22px'; c.style.height='22px'; c.style.background='rgba(239,68,68,0.45)'; }, true);
      })();
    `,
  });
}

/**
 * Headless-chromium implementation of ScreenshotCapture using Playwright.
 * Navigates to `baseUrl + route`, optionally scopes to `selector`,
 * and returns a PNG buffer.
 */
export class PlaywrightCapture implements ScreenshotCapture {
  private readonly baseUrl: string;
  /**
   * Base directory under which the per-session video temp dir is created.
   * Defaults to the OS tmpdir. Overridable so tests can point it at an
   * invalid/unwritable location to exercise the recording-degrade path.
   */
  private readonly videoTmpBaseDir: string;
  private readonly headful: boolean;
  private readonly slowMo: number;

  constructor(
    baseUrl: string,
    videoTmpBaseDir?: string,
    launchOptions?: { headful?: boolean; slowMo?: number },
  ) {
    // Strip trailing slash so route (which starts with /) composes cleanly
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.videoTmpBaseDir = videoTmpBaseDir ?? tmpdir();
    this.headful = launchOptions?.headful ?? false;
    this.slowMo = launchOptions?.slowMo ?? 0;
  }

  /**
   * Single-shot capture: delegates to captureStates with no interactions and
   * returns the single default state as a CaptureResult.
   */
  async capture(target: CaptureTarget): Promise<CaptureResult> {
    const { states } = await this.captureStates({ ...target, interactions: [] });
    const defaultState = states[0]!;
    return { pngBuffer: defaultState.pngBuffer, alt: defaultState.alt };
  }

  /**
   * Multi-state capture: screenshots the default panel state, then for each
   * interaction in the plan, clicks the control by accessible name and screenshots
   * the revealed state.
   *
   * Click strategy:
   *   1. Try `page.getByRole('button', { name: label })` (accessible-name match).
   *   2. Fall back to `page.getByText(label)` if the role query finds no element.
   *
   * After each click, waits 500 ms for the UI to settle before capturing the
   * re-scoped panel element.
   *
   * Returns an array of CapturedState: first element is always `state: "default"`,
   * followed by one entry per interaction.
   */
  async captureStates(target: MultiStateCaptureTarget): Promise<MultiStateCaptureResult> {
    const url = this.baseUrl + target.route;
    // Viewport size doubles as the recording size. Playwright's default page
    // viewport is 1280x720; pin it explicitly so recordVideo size matches.
    const viewport = { width: 1280, height: 720 };
    const shouldRecord = target.interactions.length > 0;

    const browser = await chromium.launch({ headless: !this.headful, slowMo: this.slowMo });

    // Recording bookkeeping. The whole recording concern is OPTIONAL: any
    // failure setting it up degrades to videoWebm: undefined without losing
    // the stills. We track the temp dir so we can always clean it up.
    let videoTmpDir: string | undefined;
    let context: BrowserContext;

    if (shouldRecord) {
      try {
        videoTmpDir = await mkdtemp(path.join(this.videoTmpBaseDir, 'docs-bot-video-'));
        context = await browser.newContext({
          viewport,
          recordVideo: { dir: videoTmpDir, size: viewport },
        });
      } catch (err) {
        // Recording setup failed — fall back to a plain (non-recording) context
        // so the stills still get captured. Clean up any partial temp dir.
        console.warn(`[capture] recordVideo setup failed — degrading to stills only: ${String(err)}`);
        if (videoTmpDir !== undefined) {
          await rm(videoTmpDir, { recursive: true, force: true }).catch(() => {});
          videoTmpDir = undefined;
        }
        context = await browser.newContext({ viewport });
      }
    } else {
      // No interactions → record nothing (the capture() / single-shot path).
      context = await browser.newContext({ viewport });
    }

    try {
      const page = await context.newPage();
      // Use 'domcontentloaded' instead of 'networkidle': next dev's HMR websocket
      // keeps the network perpetually busy, causing 'networkidle' to hang ~30s.
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      // Wait for the 'load' event so React has hydrated before we interact.
      // This is safe: 'load' fires once all synchronous resources are ready but
      // does NOT wait for WebSocket connections (unlike 'networkidle').
      await page.waitForLoadState('load');

      // Demo mode: inject a visible cursor and park it center-screen so the
      // audience can watch the pointer glide to and click controls.
      if (this.headful) {
        await installDemoCursor(page);
        await page.mouse.move(viewport.width / 2, viewport.height / 2);
        await page.waitForTimeout(500);
      }

      const results: CapturedState[] = [];

      // Helper: screenshot the panel (scoped to selector) or full page
      const screenshotPanel = async (): Promise<Buffer> => {
        if (target.selector !== undefined) {
          const locator = page.locator(target.selector);
          await locator.waitFor({ state: 'visible' });
          const bytes = await locator.screenshot({ type: 'png' });
          return Buffer.from(bytes);
        } else {
          // 'load' already awaited once after navigation; no need to repeat per screenshot.
          const bytes = await page.screenshot({ type: 'png', fullPage: false });
          return Buffer.from(bytes);
        }
      };

      // --- Default state ---
      const defaultBuffer = await screenshotPanel();
      const defaultAlt =
        target.selector !== undefined
          ? `Screenshot of element '${target.selector}' at ${url} (default state)`
          : `Full-page screenshot of ${url} (default state)`;
      results.push({ state: 'default', pngBuffer: defaultBuffer, alt: defaultAlt });

      // --- Activated states ---
      for (const interaction of target.interactions) {
        const { label } = interaction;

        // Try accessible-name button lookup first, fall back to text locator
        let control = page.getByRole('button', { name: label });
        const buttonCount = await control.count();
        if (buttonCount === 0) {
          control = page.getByText(label);
        }

        await control.waitFor({ state: 'visible' });

        if (this.headful) {
          // Human-like demo motion: scroll the control into view, then glide
          // the visible cursor to it in small steps and click — no instant jumps.
          await control.scrollIntoViewIfNeeded();
          await page.waitForTimeout(400);
          const box = await control.boundingBox();
          if (box) {
            const targetX = box.x + box.width / 2;
            const targetY = box.y + box.height / 2;
            const startX = targetX;
            const startY = Math.max(8, targetY - 220);
            const steps = 30;
            for (let s = 1; s <= steps; s += 1) {
              const t = s / steps;
              await page.mouse.move(startX + (targetX - startX) * t, startY + (targetY - startY) * t);
              await page.waitForTimeout(28);
            }
            await page.waitForTimeout(350);
            await page.mouse.down();
            await page.waitForTimeout(140);
            await page.mouse.up();
          } else {
            await control.click();
          }
          // Let the reveal animation play before the screenshot.
          await page.waitForTimeout(1100);
        } else {
          await control.click();
          // Brief wait for reveal animation / state update
          await page.waitForTimeout(500);
        }

        const activatedBuffer = await screenshotPanel();
        const slug = labelToSlug(label);
        const activatedAlt =
          target.selector !== undefined
            ? `Screenshot of element '${target.selector}' at ${url} (state: ${slug})`
            : `Full-page screenshot of ${url} (state: ${slug})`;

        results.push({ state: slug, pngBuffer: activatedBuffer, alt: activatedAlt });
      }

      // --- Finalize + read the recorded clip (best-effort, never blocking) ---
      // Playwright only flushes the .webm to disk on context.close(), so we
      // must close the context BEFORE reading the file. The browser itself is
      // closed in `finally`. Any failure here yields videoWebm: undefined while
      // `results` (the stills) is still returned.
      let videoWebm: Buffer | undefined;
      if (videoTmpDir !== undefined) {
        try {
          await context.close();
          const entries = await readdir(videoTmpDir);
          const webmFile = entries.find((f) => f.endsWith('.webm'));
          if (webmFile !== undefined) {
            videoWebm = await readFile(path.join(videoTmpDir, webmFile));
          }
        } catch (err) {
          console.warn(`[capture] reading recorded clip failed — degrading to stills only: ${String(err)}`);
          videoWebm = undefined;
        } finally {
          await rm(videoTmpDir, { recursive: true, force: true }).catch(() => {});
        }
      } else {
        // No recording — close the context normally.
        await context.close();
      }

      return { states: results, ...(videoWebm !== undefined ? { videoWebm } : {}) };
    } finally {
      await browser.close();
    }
  }
}

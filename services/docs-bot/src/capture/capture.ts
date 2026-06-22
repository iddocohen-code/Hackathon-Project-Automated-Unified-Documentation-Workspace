import { chromium } from 'playwright';

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
 * Interface for screenshot capture backends.
 * Implementations: PlaywrightCapture (headless chromium); future: ComputerUseCapture.
 */
export interface ScreenshotCapture {
  capture(target: CaptureTarget): Promise<CaptureResult>;
}

/**
 * Headless-chromium implementation of ScreenshotCapture using Playwright.
 * Navigates to `baseUrl + route`, optionally scopes to `selector`,
 * and returns a PNG buffer.
 */
export class PlaywrightCapture implements ScreenshotCapture {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    // Strip trailing slash so route (which starts with /) composes cleanly
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async capture(target: CaptureTarget): Promise<CaptureResult> {
    const url = this.baseUrl + target.route;
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      // Use 'domcontentloaded' instead of 'networkidle': next dev's HMR websocket
      // keeps the network perpetually busy, causing 'networkidle' to hang ~30s.
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      let rawBuffer: Buffer;
      let alt: string;

      if (target.selector !== undefined) {
        const locator = page.locator(target.selector);
        await locator.waitFor({ state: 'visible' });
        const bytes = await locator.screenshot({ type: 'png' });
        rawBuffer = Buffer.from(bytes);
        alt = `Screenshot of element '${target.selector}' at ${url}`;
      } else {
        // No element to wait for; ensure the page has at least fully loaded
        // before taking the screenshot (avoids capturing a blank/partial render).
        await page.waitForLoadState('load');
        const bytes = await page.screenshot({ type: 'png', fullPage: false });
        rawBuffer = Buffer.from(bytes);
        alt = `Full-page screenshot of ${url}`;
      }

      return { pngBuffer: rawBuffer, alt };
    } finally {
      await browser.close();
    }
  }
}

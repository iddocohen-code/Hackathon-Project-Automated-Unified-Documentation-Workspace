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
 * Interface for screenshot capture backends.
 * Implementations: PlaywrightCapture (headless chromium); future: ComputerUseCapture.
 */
export interface ScreenshotCapture {
  capture(target: CaptureTarget): Promise<CaptureResult>;
  captureStates(target: MultiStateCaptureTarget): Promise<CapturedState[]>;
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

  /**
   * Single-shot capture: delegates to captureStates with no interactions and
   * returns the single default state as a CaptureResult.
   */
  async capture(target: CaptureTarget): Promise<CaptureResult> {
    const states = await this.captureStates({ ...target, interactions: [] });
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
  async captureStates(target: MultiStateCaptureTarget): Promise<CapturedState[]> {
    const url = this.baseUrl + target.route;
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      // Use 'domcontentloaded' instead of 'networkidle': next dev's HMR websocket
      // keeps the network perpetually busy, causing 'networkidle' to hang ~30s.
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      // Wait for the 'load' event so React has hydrated before we interact.
      // This is safe: 'load' fires once all synchronous resources are ready but
      // does NOT wait for WebSocket connections (unlike 'networkidle').
      await page.waitForLoadState('load');

      const results: CapturedState[] = [];

      // Helper: screenshot the panel (scoped to selector) or full page
      const screenshotPanel = async (): Promise<Buffer> => {
        if (target.selector !== undefined) {
          const locator = page.locator(target.selector);
          await locator.waitFor({ state: 'visible' });
          const bytes = await locator.screenshot({ type: 'png' });
          return Buffer.from(bytes);
        } else {
          await page.waitForLoadState('load');
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
        await control.click();

        // Brief wait for reveal animation / state update
        await page.waitForTimeout(500);

        const activatedBuffer = await screenshotPanel();
        const slug = labelToSlug(label);
        const activatedAlt =
          target.selector !== undefined
            ? `Screenshot of element '${target.selector}' at ${url} (state: ${slug})`
            : `Full-page screenshot of ${url} (state: ${slug})`;

        results.push({ state: slug, pngBuffer: activatedBuffer, alt: activatedAlt });
      }

      return results;
    } finally {
      await browser.close();
    }
  }
}

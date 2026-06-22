import { describe, it, expect } from 'vitest';
import { isRelevant } from '../src/pipeline/filter.js';

describe('isRelevant', () => {
  it('returns true for a UI component change (demo PR file)', () => {
    expect(
      isRelevant(['apps/surf-console/components/console/SharkMitigationCard.tsx']),
    ).toBe(true);
  });

  it('returns false for publish output only (content/docs — no-loop guard)', () => {
    expect(
      isRelevant(['apps/surf-console/content/docs/shark-mitigation/index.md']),
    ).toBe(false);
  });

  it('returns false for backend/service change only', () => {
    expect(isRelevant(['services/docs-bot/src/server.ts'])).toBe(false);
  });

  it('returns true for a mixed change set (UI + publish output rides along)', () => {
    expect(
      isRelevant([
        'apps/surf-console/components/console/SharkMitigationCard.tsx',
        'apps/surf-console/content/docs/shark-mitigation/index.md',
      ]),
    ).toBe(true);
  });

  it('returns false for an empty change set', () => {
    expect(isRelevant([])).toBe(false);
  });

  it('returns false for publisher screenshot output only (public/docs-screenshots — no-loop guard)', () => {
    expect(
      isRelevant([
        'apps/surf-console/public/docs-screenshots/shark-mitigation/after.png',
      ]),
    ).toBe(false);
  });
});

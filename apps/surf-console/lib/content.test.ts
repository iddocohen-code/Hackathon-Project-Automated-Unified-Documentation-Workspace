import { describe, it, expect } from 'vitest';
import { getManifest, getChangelog, getDoc } from './content';

describe('content layer', () => {
  it('getManifest() returns 4 categories and shark-mitigation at version 3', async () => {
    const manifest = await getManifest();
    expect(manifest.categories).toHaveLength(4);
    const shark = manifest.docs.find((d) => d.id === 'shark-mitigation');
    expect(shark).toBeDefined();
    expect(shark!.version).toBe(3);
  });

  it("getDoc('shark-mitigation') contains 'Sound the alert' and NOT 'Emergency Shark Siren'", async () => {
    const doc = await getDoc('shark-mitigation');
    expect(doc).not.toBeNull();
    expect(doc!.bodyMarkdown).toContain('Sound the alert');
    expect(doc!.bodyMarkdown).not.toContain('Emergency Shark Siren');
  });

  it('getChangelog() returns length 2 with every entry severity === info, sorted newest-first', async () => {
    const changelog = await getChangelog();
    expect(changelog).toHaveLength(2);
    for (const entry of changelog) {
      expect(entry.severity).toBe('info');
    }
    const first = changelog[0];
    const second = changelog[1];
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(first!.createdAt.localeCompare(second!.createdAt)).toBeGreaterThanOrEqual(0);
  });

  it("getDoc('does-not-exist') resolves to null", async () => {
    const doc = await getDoc('does-not-exist');
    expect(doc).toBeNull();
  });
});

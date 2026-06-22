import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Doc, DocsManifest } from '@surf/types';

/**
 * Load the full corpus of docs from a content directory.
 *
 * Mirrors `apps/surf-console/lib/content.ts`: reads `manifest.json` (which
 * carries `bodyMarkdown: ""` for every Doc entry), then injects the real body
 * for each doc from `<docsContentDir>/<doc.id>/index.md`.
 *
 * @param docsContentDir Absolute path to the content/docs directory (the same
 *   directory that the publisher writes to).
 * @returns Full `Doc[]` with `bodyMarkdown` populated from each `index.md`.
 * @throws If `manifest.json` cannot be read, or if any doc's `index.md` is
 *   missing (the error message includes the doc id for easy diagnosis).
 */
export async function loadCorpus(docsContentDir: string): Promise<Doc[]> {
  const manifestPath = path.join(docsContentDir, 'manifest.json');
  const raw = await readFile(manifestPath, 'utf-8');
  const manifest = JSON.parse(raw) as DocsManifest;

  const docs = await Promise.all(
    manifest.docs.map(async (doc) => {
      const mdPath = path.join(docsContentDir, doc.id, 'index.md');
      let bodyMarkdown: string;
      try {
        bodyMarkdown = await readFile(mdPath, 'utf-8');
      } catch (cause) {
        throw new Error(
          `loadCorpus: missing index.md for doc "${doc.id}" at ${mdPath}`,
          { cause },
        );
      }
      return { ...doc, bodyMarkdown };
    }),
  );

  return docs;
}

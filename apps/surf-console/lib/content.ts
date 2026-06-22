import { readFile } from 'fs/promises';
import path from 'path';
import type { Doc, DocCategory, DocsManifest, Changelog } from '@surf/types';

// SERVER-ONLY: this module uses fs/promises and must never be imported in client components.

const CONTENT_ROOT = path.join(process.cwd(), 'content', 'docs');

export async function getManifest(): Promise<DocsManifest> {
  const raw = await readFile(path.join(CONTENT_ROOT, 'manifest.json'), 'utf-8');
  return JSON.parse(raw) as DocsManifest;
}

export async function getChangelog(): Promise<Changelog> {
  const raw = await readFile(path.join(CONTENT_ROOT, 'changelog.json'), 'utf-8');
  return JSON.parse(raw) as Changelog;
}

export async function getDoc(slug: string): Promise<Doc | null> {
  const manifest = await getManifest();
  const entry = manifest.docs.find((d) => d.id === slug);
  if (!entry) return null;

  const mdPath = path.join(CONTENT_ROOT, slug, 'index.md');
  const bodyMarkdown = await readFile(mdPath, 'utf-8');

  return { ...entry, bodyMarkdown };
}

export async function getCategories(): Promise<DocCategory[]> {
  const manifest = await getManifest();
  return manifest.categories;
}

export async function getDocsByCategory(categoryId: string): Promise<Doc[]> {
  const manifest = await getManifest();
  const slugs = manifest.docs
    .filter((d) => d.category.id === categoryId)
    .map((d) => d.id);

  const docs = await Promise.all(slugs.map((slug) => getDoc(slug)));
  return docs.filter((d): d is Doc => d !== null);
}

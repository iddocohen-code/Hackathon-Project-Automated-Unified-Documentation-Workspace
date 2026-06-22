import GithubSlugger from 'github-slugger';
import type { Doc } from '@surf/types';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/** A section derived from splitting a Doc's bodyMarkdown at ATX headings. */
export interface DocSection {
  docId: string;
  docTitle: string;
  /** The heading text (without the leading `## ` markers). */
  heading: string;
  /** GitHub-style slug anchor, computed per-doc (slugger reset per doc). */
  anchor: string;
  /** The body text that follows the heading, before the next heading. */
  text: string;
}

/** A DocSection augmented with a relevance score from a retrieval query. */
export interface RetrievedPassage extends DocSection {
  score: number;
}

/** Swappable retrieval interface. */
export interface Retriever {
  build(docs: Doc[]): Promise<void>;
  retrieve(query: string, k?: number): Promise<RetrievedPassage[]>;
}

// ---------------------------------------------------------------------------
// buildSections
// ---------------------------------------------------------------------------

/**
 * Split each Doc's bodyMarkdown at ATX headings (lines starting with one or
 * more `#` characters) into DocSection records.
 *
 * The GithubSlugger is **reset per doc** so anchor uniqueness is scoped to
 * the document — exactly as `rehype-slug` operates on a single page.
 */
export function buildSections(docs: Doc[]): DocSection[] {
  const sections: DocSection[] = [];

  for (const doc of docs) {
    const slugger = new GithubSlugger();

    // Split the markdown into chunks on ATX heading lines.
    // Each chunk: [ headingLine, ...bodyLines ]
    const lines = doc.bodyMarkdown.split('\n');

    // We parse line-by-line, collecting body lines until we hit the next heading.
    let currentHeading: string | null = null;
    let bodyLines: string[] = [];

    const flush = () => {
      if (currentHeading === null) return;
      sections.push({
        docId: doc.id,
        docTitle: doc.title,
        heading: currentHeading,
        anchor: slugger.slug(currentHeading),
        text: bodyLines.join('\n').trim(),
      });
    };

    for (const line of lines) {
      const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
      if (headingMatch) {
        // Emit the previous section before starting a new one.
        flush();
        currentHeading = headingMatch[1]!.trim();
        bodyLines = [];
      } else {
        bodyLines.push(line);
      }
    }

    // Emit the last section.
    flush();
  }

  return sections;
}

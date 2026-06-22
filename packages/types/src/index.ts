/** Severity levels for a documentation change. */
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/** A category grouping documentation pages, optionally nested under a parent. */
export interface DocCategory {
  id: string;
  name: string;
  icon: string;
  parentId?: string;
  /** Display count of docs in this category (may exceed the number of fully-defined Doc entries). */
  docCount?: number;
}

/** A captured screenshot associated with a documentation page or change. */
export interface Screenshot {
  path: string;
  alt: string;
  capturedAt: string;
  targetSelector?: string;
}

/** A human-readable summary of what changed and why. */
export interface ChangeSummary {
  headline: string;
  detail: string;
  intentSource: string;
}

/** A reference to an external context item (ticket, message, wiki page, or commit). */
export interface ContextRef {
  kind: 'jira' | 'slack' | 'confluence' | 'git';
  ref: string;
  url: string;
  excerpt: string;
}

/** A single documentation page with its content and metadata. */
export interface Doc {
  id: string;
  title: string;
  category: DocCategory;
  bodyMarkdown: string;
  screenshots: Screenshot[];
  sourceComponent: string;
  version: number;
  updatedAt: string;
  lastChange?: ChangeSummary;
}

/** A recorded change to a documentation page, linked to PR and context references. */
export interface ChangeEntry {
  id: string;
  docId: string;
  summary: ChangeSummary;
  severity: Severity;
  prUrl: string;
  contextRefs: ContextRef[];
  screenshotDiff?: { before?: string; after: string };
  createdAt: string;
}

/** A single result from a documentation search query. */
export interface SearchResult {
  docId: string;
  title: string;
  snippet: string;
  score: number;
  deepLink: string;
}

/** An answer produced by the RAG pipeline, with cited search results. */
export interface RagAnswer {
  query: string;
  answer: string;
  citations: SearchResult[];
}

/** A GitHub pull request event payload used to trigger documentation updates. */
export interface PullRequestEvent {
  prUrl: string;
  mergedSha: string;
  changedPaths: string[];
  title: string;
  body: string;
}

/** The full manifest of all categories and documentation pages. */
export interface DocsManifest {
  categories: DocCategory[];
  docs: Doc[];
}

/** An ordered list of change entries representing a documentation changelog. */
export type Changelog = ChangeEntry[];

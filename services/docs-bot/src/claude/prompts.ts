import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { ContextRef, DocsManifest, Doc, Screenshot } from '@surf/types';
import type { FilePatch } from '../git/diff.js';
import type { DiffAnalysis } from './schemas.js';

// __dirname equivalent for ESM; prompts.ts lives at services/docs-bot/src/claude/
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Prompt files live at services/docs-bot/prompts/
const promptsDir = path.resolve(__dirname, '../../prompts');

/**
 * Loads a prompt file from the prompts directory.
 * Files are loaded at runtime so they can be edited without recompiling.
 */
async function loadPromptFile(filename: string): Promise<string> {
  return readFile(path.join(promptsDir, filename), 'utf-8');
}

export interface AnalyzerPromptInput {
  diff: FilePatch[];
  context: ContextRef[];
  existingDocs: DocsManifest;
}

/**
 * Builds the messages array for the diff analyzer Claude call.
 * Returns [systemMessage, userMessage] ready for `client.messages.parse()`.
 */
export async function buildAnalyzerPrompt(input: AnalyzerPromptInput): Promise<{
  system: string;
  userContent: string;
}> {
  const [styleGuide, analyzerInstructions] = await Promise.all([
    loadPromptFile('upwind-style-guide.md'),
    loadPromptFile('diff-analyzer.md'),
  ]);

  // System prompt: style guide + analyzer instructions
  const system = [styleGuide, analyzerInstructions].join('\n\n---\n\n');

  // Format the diff patches
  const diffSection = input.diff.length === 0
    ? '(no changed files)'
    : input.diff.map((fp) => `### File: ${fp.path}\n\`\`\`diff\n${fp.patch}\n\`\`\``).join('\n\n');

  // Format the context references
  const contextSection = input.context.length === 0
    ? '(no context references)'
    : input.context.map((ref) =>
        `**[${ref.kind.toUpperCase()}] ${ref.ref}**\nURL: ${ref.url}\nExcerpt: ${ref.excerpt}`
      ).join('\n\n');

  // Format the docs manifest (id + sourceComponent only — everything Claude needs for matching)
  const manifestSection = input.existingDocs.docs
    .map((doc) => `- id: "${doc.id}" | title: "${doc.title}" | sourceComponent: "${doc.sourceComponent}"`)
    .join('\n');

  const userContent = `## Git Diff

${diffSection}

## Context References

${contextSection}

## Existing Docs Manifest

${manifestSection}

---

Analyze the diff above and return a DiffAnalysis object. Match the changed file to the correct doc using the sourceComponent paths in the manifest.`;

  return { system, userContent };
}

export interface WriterPromptInput {
  /** The existing Doc (id, title, bodyMarkdown, version) */
  existingDoc: Pick<Doc, 'id' | 'title' | 'bodyMarkdown' | 'version'>;
  /** Structured analysis from Task 7 */
  diffAnalysis: DiffAnalysis;
  /** Context references (Jira, Slack, Confluence) from Task 6 */
  context: ContextRef[];
  /** Screenshot metadata (alt + path) for context — NOT to be inlined as markdown image */
  screenshotMeta: Pick<Screenshot, 'alt' | 'path'> | null;
}

/**
 * Builds the messages for the doc writer Claude call.
 * Returns { system, userContent } ready for `client.messages.parse()`.
 */
export async function buildWriterPrompt(input: WriterPromptInput): Promise<{
  system: string;
  userContent: string;
}> {
  const [styleGuide, writerInstructions] = await Promise.all([
    loadPromptFile('upwind-style-guide.md'),
    loadPromptFile('doc-writer.md'),
  ]);

  const system = [styleGuide, writerInstructions].join('\n\n---\n\n');

  // Format context references
  const contextSection = input.context.length === 0
    ? '(no context references)'
    : input.context.map((ref) =>
        `**[${ref.kind.toUpperCase()}] ${ref.ref}**\nURL: ${ref.url}\nExcerpt: ${ref.excerpt}`
      ).join('\n\n');

  // Screenshot metadata section (prose context only — never inline as image)
  const screenshotSection = input.screenshotMeta == null
    ? '(no screenshot captured)'
    : `Alt text: "${input.screenshotMeta.alt}"\nFile path: ${input.screenshotMeta.path}\n(This screenshot is rendered separately by the Surf Console UI — do NOT inline it as a markdown image in the body.)`;

  const userContent = `## Existing Doc (v${input.existingDoc.version})

**Doc ID:** ${input.existingDoc.id}
**Title:** ${input.existingDoc.title}

### Current Body

${input.existingDoc.bodyMarkdown}

---

## Diff Analysis

**Structural Change:** ${input.diffAnalysis.structuralChange}
**Human Intent:** ${input.diffAnalysis.humanIntent}
**Severity:** ${input.diffAnalysis.severity}

---

## Context References

${contextSection}

---

## Screenshot Metadata (for context only — do NOT inline as markdown image)

${screenshotSection}

---

Regenerate the documentation body incorporating the new UI change. Keep all existing \`##\` step headings and add the new Emergency Shark Siren step. Return a DocDraft object.`;

  return { system, userContent };
}

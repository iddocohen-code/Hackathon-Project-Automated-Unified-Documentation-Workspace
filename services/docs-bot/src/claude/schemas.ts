import { z } from 'zod/v4';
import type { Severity, ChangeSummary } from '@surf/types';

// Severity enum aligned with the @surf/types Severity union
const SeveritySchema = z.enum(['critical', 'high', 'medium', 'low', 'info']) satisfies z.ZodType<Severity>;

/**
 * Structured output schema for the diff analyzer.
 * Claude returns a JSON object matching this shape via `messages.parse()`.
 */
export const DiffAnalysisSchema = z.object({
  /** ID of the existing doc this change maps to (matches manifest id) */
  docId: z.string().describe('The ID of the existing doc this change maps to, matching the manifest id field exactly'),
  /** URL route where the live component renders */
  targetRoute: z.string().describe('the route where the live component renders; `/` for dashboard cards, `/docs/<id>` for doc pages'),
  /** Precise technical description of what structurally changed in the component */
  structuralChange: z.string().describe('A precise technical description of what structurally changed in the UI component, mentioning specific component names, function calls, and UI element labels from the diff'),
  /** Human intent synthesized from context references */
  humanIntent: z.string().describe('The human reason behind this change synthesized from Jira tickets, Slack discussions, and runbooks — 1-3 sentences covering the safety or business rationale'),
  /** Severity of this change per Upwind CNAPP severity definitions */
  severity: SeveritySchema.describe('Severity level: critical for life-safety triggers, high for significant security impact, medium for moderate risk, low for minor changes, info for cosmetic-only'),
  /** Controls that reveal new UI when activated; empty if the change is fully static */
  interactions: z.array(z.object({
    label: z.string().describe('the visible/accessible name of the control to activate, e.g. "Emergency Shark Siren"'),
    reveals: z.string().describe('what new UI becomes visible after activating it'),
  })).describe('controls that reveal new UI when activated; empty if the change is fully static').default([]),
});

export type DiffAnalysis = z.infer<typeof DiffAnalysisSchema>;

/**
 * Structured output schema for the vision check.
 * Claude Sonnet 4.6 returns this JSON object when asked whether a screenshot
 * shows a claimed UI change.
 */
export const VisionVerdictSchema = z.object({
  /** Whether the screenshot shows the claimed change */
  showsChange: z.boolean().describe('true if the screenshot clearly shows the claimed change; false if the change is absent'),
  /** One-line explanation of the reasoning */
  note: z.string().describe('A concise one-line explanation of why showsChange is true or false'),
});

export type VisionVerdict = z.infer<typeof VisionVerdictSchema>;

/**
 * Structured output schema for the doc writer.
 * Claude Opus 4.8 returns a DocDraft containing the regenerated body,
 * a change summary for the changelog, and the updated title.
 */
const ChangeSummarySchema = z.object({
  /** Short headline describing the change (no trailing period) */
  headline: z.string().describe('A short headline describing the change — no trailing period, under 80 characters'),
  /** Full detail sentence(s) describing what changed and why */
  detail: z.string().describe('1-3 sentences explaining what changed and the operational reason for it'),
  /** References to the source(s) that informed the intent — must cite Jira and/or Slack if available */
  intentSource: z.string().describe('Comma-separated list of the context sources that informed the human intent, e.g. "SURF-142 (Jira), #surf-safety (Slack)"'),
}) satisfies z.ZodType<ChangeSummary>;

export const DocDraftSchema = z.object({
  /** The full regenerated doc body in Markdown — prose only, no inline images */
  bodyMarkdown: z.string().describe('The complete regenerated documentation body in Markdown. Must use ## heading steps matching the existing structure. Must NOT contain markdown images (no ![...](...) syntax). Prose only.'),
  /** Human-readable summary of what changed for the changelog */
  changeSummary: ChangeSummarySchema,
  /** Updated document title (may be the same as the existing title) */
  title: z.string().describe('The document title — typically unchanged from the existing title unless the scope genuinely expanded'),
});

export type DocDraft = z.infer<typeof DocDraftSchema>;

import { z } from 'zod/v4';
import type { Severity } from '@surf/types';

// Severity enum aligned with the @surf/types Severity union
const SeveritySchema = z.enum(['critical', 'high', 'medium', 'low', 'info']) satisfies z.ZodType<Severity>;

/**
 * Structured output schema for the diff analyzer.
 * Claude returns a JSON object matching this shape via `messages.parse()`.
 */
export const DiffAnalysisSchema = z.object({
  /** ID of the existing doc this change maps to (matches manifest id) */
  docId: z.string().describe('The ID of the existing doc this change maps to, matching the manifest id field exactly'),
  /** URL route for this doc page */
  targetRoute: z.string().describe('The URL route for this doc page, typically /docs/<docId>'),
  /** Precise technical description of what structurally changed in the component */
  structuralChange: z.string().describe('A precise technical description of what structurally changed in the UI component, mentioning specific component names, function calls, and UI element labels from the diff'),
  /** Human intent synthesized from context references */
  humanIntent: z.string().describe('The human reason behind this change synthesized from Jira tickets, Slack discussions, and runbooks — 1-3 sentences covering the safety or business rationale'),
  /** Severity of this change per Upwind CNAPP severity definitions */
  severity: SeveritySchema.describe('Severity level: critical for life-safety triggers, high for significant security impact, medium for moderate risk, low for minor changes, info for cosmetic-only'),
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

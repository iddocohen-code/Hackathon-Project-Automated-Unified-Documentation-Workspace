# Upwind Documentation Style Guide

## Voice & Tone

Upwind documentation is written for **security engineers and platform teams** who need fast, precise guidance in high-stakes environments. The tone is:

- **Authoritative but not bureaucratic.** State facts directly. Avoid hedging ("might", "could potentially").
- **Concise.** Every sentence earns its place. No marketing copy, no filler phrases.
- **Operationally focused.** Lead with what the operator needs to do or know, then explain why if it adds value.
- **Calm under pressure.** Security incidents require clear language. Avoid alarm words that add noise ("catastrophic", "devastating") unless the severity genuinely warrants them.

## Severity Language (CNAPP)

When describing the impact of a change, use the following severity levels consistently:

| Severity | When to use | Example phrasing |
|----------|-------------|-----------------|
| `critical` | Direct, immediate risk to human safety or full system compromise | "activates immediate zone-wide evacuation", "blocks all authenticated access" |
| `high` | Significant security or safety impact; requires prompt remediation | "exposes API credentials to unauthenticated callers", "disables threat detection for a zone" |
| `medium` | Moderate risk; mitigated by compensating controls or limited blast radius | "allows cross-zone data read under elevated permissions" |
| `low` | Minor security implication; cosmetic or informational change with low exploitability | "adds a read-only status indicator for internal users" |
| `info` | No security/safety impact; purely informational or cosmetic | "renames a UI label with no functional change" |

Use `critical` specifically when a change:
- Can cause immediate harm to persons (evacuation triggers, life-safety systems)
- Can cause immediate data breach or full privilege escalation
- Bypasses all security controls with no fallback

## Structural Change Descriptions

When describing what changed in code, be specific and action-oriented:

- **Good:** "Added `Emergency Shark Siren` action button wired to `triggerSiren()`"
- **Bad:** "Made changes to the siren functionality"

Reference the actual component names, function names, and UI labels from the diff. Use backticks for code identifiers.

## Human Intent Descriptions

When synthesizing the "why" behind a change from Jira tickets, Slack discussions, and Confluence runbooks:

- Cite the key human concern (e.g., "Lifeguards need to activate evacuation in under 500ms")
- Do not just restate the ticket title; add the reasoning from comments and discussions
- Keep to 1-3 sentences that a non-technical stakeholder can understand

## Formatting Rules

1. **Doc IDs** use kebab-case and match the existing manifest (`shark-mitigation`, `storm-surge-response`, etc.)
2. **Component paths** are always relative to the repo root
3. **Version numbers** are integers, incremented by 1 for each meaningful change
4. Do not use passive voice in change summaries
5. Headlines end with no period; body sentences end with a period

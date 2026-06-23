/**
 * /docs/agent — Agent-native docs explainer page (server component).
 *
 * Explains the machine-readable docs surface: the /agent/corpus JSON endpoint
 * and the /llms.txt plaintext index, both consumable by AI agents.
 */

export default function AgentDocsPage() {
  return (
    <div style={{ padding: "28px 28px 60px", maxWidth: 860 }}>
      <div style={{ marginBottom: 22 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 6,
          }}
        >
          <h1
            style={{
              fontSize: 30,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            Agent-Native Docs
          </h1>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              fontWeight: 500,
              padding: "4px 10px",
              borderRadius: 50,
              background: "var(--uw-primary-05)",
              color: "var(--uw-primary-01)",
            }}
          >
            Beta
          </span>
        </div>
        <div style={{ fontSize: 15, color: "var(--text-secondary)" }}>
          The full documentation corpus is available in machine-readable form
          for AI agents, LLM toolchains, and automated pipelines.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* What is this */}
        <section
          style={{
            background: "var(--surface-card, #1a1a2e)",
            borderRadius: 10,
            padding: "20px 24px",
            border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
          }}
        >
          <h2
            style={{
              fontSize: 17,
              fontWeight: 500,
              margin: "0 0 10px",
            }}
          >
            What is agent-native documentation?
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-secondary)",
              margin: 0,
              lineHeight: 1.65,
            }}
          >
            Beyond human-readable pages, this docs engine exposes the same
            corpus in structured formats that AI agents can consume directly —
            no scraping, no parsing HTML. Every doc, every section, every
            heading is available as clean JSON or plaintext so your AI
            toolchain always has the latest context.
          </p>
        </section>

        {/* JSON endpoint */}
        <section
          style={{
            background: "var(--surface-card, #1a1a2e)",
            borderRadius: 10,
            padding: "20px 24px",
            border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
          }}
        >
          <h2
            style={{
              fontSize: 17,
              fontWeight: 500,
              margin: "0 0 10px",
            }}
          >
            JSON corpus{" "}
            <code
              style={{
                fontSize: 13,
                background: "var(--surface-code, rgba(255,255,255,0.06))",
                padding: "2px 8px",
                borderRadius: 5,
              }}
            >
              GET /agent/corpus
            </code>
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-secondary)",
              margin: "0 0 12px",
              lineHeight: 1.65,
            }}
          >
            Returns a flat JSON array — one object per doc — with all sections
            split at headings. Each entry carries:
          </p>
          <pre
            style={{
              fontSize: 13,
              background: "var(--surface-code, rgba(255,255,255,0.06))",
              padding: "12px 16px",
              borderRadius: 8,
              overflowX: "auto",
              margin: 0,
              color: "var(--text-primary)",
              lineHeight: 1.6,
            }}
          >
            {`[
  {
    "id": "shark-mitigation",
    "title": "Shark Mitigation Protocol",
    "category": "incident-protocols",
    "version": 3,
    "updatedAt": "2025-03-12T10:00:00Z",
    "sections": [
      {
        "heading": "Overview",
        "anchor": "overview",
        "text": "..."
      }
    ]
  }
]`}
          </pre>
        </section>

        {/* llms.txt endpoint */}
        <section
          style={{
            background: "var(--surface-card, #1a1a2e)",
            borderRadius: 10,
            padding: "20px 24px",
            border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
          }}
        >
          <h2
            style={{
              fontSize: 17,
              fontWeight: 500,
              margin: "0 0 10px",
            }}
          >
            Plaintext index{" "}
            <code
              style={{
                fontSize: 13,
                background: "var(--surface-code, rgba(255,255,255,0.06))",
                padding: "2px 8px",
                borderRadius: 5,
              }}
            >
              GET /llms.txt
            </code>
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-secondary)",
              margin: 0,
              lineHeight: 1.65,
            }}
          >
            A human-skimmable plaintext index in the emerging{" "}
            <code
              style={{
                fontSize: 13,
                background: "var(--surface-code, rgba(255,255,255,0.06))",
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              llms.txt
            </code>{" "}
            convention. Lists every doc with its title, path, and section
            anchors — ideal for injecting into system prompts or context
            windows as a lightweight index.
          </p>
        </section>

        {/* Coming soon */}
        <section
          style={{
            background: "var(--surface-card, #1a1a2e)",
            borderRadius: 10,
            padding: "20px 24px",
            border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
            opacity: 0.65,
          }}
        >
          <h2
            style={{
              fontSize: 17,
              fontWeight: 500,
              margin: "0 0 10px",
            }}
          >
            Coming soon: MCP server
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-secondary)",
              margin: 0,
              lineHeight: 1.65,
            }}
          >
            A Model Context Protocol (MCP) server over the docs corpus will
            let AI agents query documentation as a structured tool — asking
            targeted questions and getting cited, section-level answers
            without loading the entire corpus into context.
          </p>
        </section>
      </div>
    </div>
  );
}

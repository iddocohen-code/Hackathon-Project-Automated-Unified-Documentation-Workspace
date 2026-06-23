/**
 * Markdown.tsx — shared markdown renderer used by DocView (server) and
 * MarkdownEditor's live preview pane (client).  No "use client" directive so it
 * is safe to import from both server and client components.
 */

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

interface MarkdownProps {
  children: string;
}

export default function Markdown({ children }: MarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSlug]}
      components={{
        p: ({ children }) => (
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.65,
              color: "var(--text-primary)",
              margin: "0 0 22px",
            }}
          >
            {children}
          </p>
        ),
        h1: ({ children }) => (
          <h1
            style={{
              fontSize: 22,
              fontWeight: 500,
              margin: "0 0 16px",
              letterSpacing: "-0.01em",
            }}
          >
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2
            style={{
              fontSize: 18,
              fontWeight: 500,
              margin: "0 0 14px",
            }}
          >
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3
            style={{
              fontSize: 16,
              fontWeight: 500,
              margin: "0 0 12px",
            }}
          >
            {children}
          </h3>
        ),
        ol: ({ children }) => (
          <ol
            style={{
              margin: "0 0 22px",
              paddingLeft: 28,
              listStyle: "decimal",
            }}
          >
            {children}
          </ol>
        ),
        ul: ({ children }) => (
          <ul
            style={{
              margin: "0 0 22px",
              paddingLeft: 24,
              listStyle: "disc",
            }}
          >
            {children}
          </ul>
        ),
        li: ({ children }) => (
          <li
            style={{
              fontSize: 15,
              lineHeight: 1.65,
              color: "var(--text-primary)",
              marginBottom: 6,
            }}
          >
            {children}
          </li>
        ),
        strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
        em: ({ children }) => <em>{children}</em>,
        hr: () => (
          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--border-subtle)",
              margin: "24px 0",
            }}
          />
        ),
        code: ({ children }) => (
          <code
            style={{
              fontFamily: "var(--font-mono-family)",
              fontSize: 13,
              background: "var(--bg-secondary)",
              padding: "2px 5px",
              borderRadius: 4,
            }}
          >
            {children}
          </code>
        ),
        blockquote: ({ children }) => (
          <blockquote
            style={{
              borderLeft: "3px solid var(--border-primary)",
              margin: "0 0 20px",
              paddingLeft: 16,
              color: "var(--text-secondary)",
            }}
          >
            {children}
          </blockquote>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

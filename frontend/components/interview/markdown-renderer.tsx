"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Copy, Check } from "@phosphor-icons/react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-invert prose-sm max-w-none break-words", className)}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Headings
        h1: ({ children }) => (
          <h1 className="text-lg font-bold mt-4 mb-2 text-foreground">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-semibold mt-3 mb-1.5 text-foreground">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold mt-2 mb-1 text-foreground">{children}</h3>
        ),

        // Paragraphs
        p: ({ children }) => (
          <p className="text-sm leading-relaxed mb-2 last:mb-0 text-foreground/90">{children}</p>
        ),

        // Bold & Italic
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-foreground/80">{children}</em>
        ),

        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside space-y-1 mb-2 text-sm text-foreground/90">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-1 mb-2 text-sm text-foreground/90">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-sm leading-relaxed">{children}</li>
        ),

        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
          >
            {children}
          </a>
        ),

        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-purple-500/50 pl-3 my-2 text-foreground/70 italic">
            {children}
          </blockquote>
        ),

        // Horizontal Rules
        hr: () => <hr className="border-border/50 my-3" />,

        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto my-2 rounded-md border border-border/50">
            <table className="min-w-full text-xs">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-muted/50">{children}</thead>
        ),
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => (
          <tr className="border-b border-border/30 last:border-0">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="px-3 py-1.5 text-left font-medium text-foreground">{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-1.5 text-foreground/80">{children}</td>
        ),

        // Code blocks — with syntax highlighting and copy button
        code: ({ className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || "");
          const isBlock = match || (typeof children === "string" && children.includes("\n"));

          if (isBlock) {
            const language = match?.[1] || "text";
            const codeString = String(children).replace(/\n$/, "");

            return (
              <CodeBlock language={language} code={codeString} />
            );
          }

          // Inline code
          return (
            <code
              className="bg-muted/70 border border-border/50 rounded px-1.5 py-0.5 text-xs font-mono text-purple-300"
              {...props}
            >
              {children}
            </code>
          );
        },

        // Pre blocks (wrapping code)
        pre: ({ children }) => <>{children}</>,
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-2 rounded-lg overflow-hidden border border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between bg-muted/80 px-3 py-1.5 border-b border-border/30">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <>
              <Check weight="bold" className="size-3 text-green-400" />
              <span className="text-green-400">Copied</span>
            </>
          ) : (
            <>
              <Copy weight="bold" className="size-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: "0.75rem 1rem",
          background: "transparent",
          fontSize: "0.75rem",
          lineHeight: "1.5",
        }}
        codeTagProps={{
          style: {
            fontFamily: "var(--font-mono), monospace",
          },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

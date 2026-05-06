"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import DOMPurify from "dompurify";
import { Components } from "react-markdown";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export default function MarkdownPreview({
  content,
  className = "",
}: MarkdownPreviewProps) {
  if (!content) {
    return <p className="text-gray-400 italic">Нет содержимого</p>;
  }

  // Санитизация HTML перед рендерингом
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "br",
      "hr",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "a",
      "img",
      "ul",
      "ol",
      "li",
      "blockquote",
      "code",
      "pre",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "div",
      "span",
    ],
    ALLOWED_ATTR: [
      "href",
      "src",
      "alt",
      "title",
      "class",
      "id",
      "target",
      "rel",
    ],
  });

  const components: Components = {
    h1: ({ node, ...props }) => (
      <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className="text-xl font-bold mt-3 mb-2" {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className="text-lg font-bold mt-2 mb-1" {...props} />
    ),
    p: ({ node, ...props }) => (
      <p className="mb-2 leading-relaxed" {...props} />
    ),
    ul: ({ node, ...props }) => (
      <ul className="list-disc ml-4 mb-2" {...props} />
    ),
    ol: ({ node, ...props }) => (
      <ol className="list-decimal ml-4 mb-2" {...props} />
    ),
    li: ({ node, ...props }) => <li className="mb-1" {...props} />,
    a: ({ node, ...props }) => (
      <a
        className="text-purple-600 hover:underline"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    ),
    code: ({ node, className, children, ...props }) => {
      const isInline = !className;
      if (isInline) {
        return (
          <code
            className="bg-gray-100 rounded px-1 py-0.5 text-sm font-mono"
            {...props}
          >
            {children}
          </code>
        );
      }
      return (
        <pre className="bg-gray-800 text-gray-200 rounded-lg p-3 overflow-x-auto text-sm font-mono">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      );
    },
    blockquote: ({ node, ...props }) => (
      <blockquote
        className="border-l-4 border-purple-400 pl-4 italic my-2 text-gray-600"
        {...props}
      />
    ),
    table: ({ node, ...props }) => (
      <div className="overflow-x-auto my-2">
        <table className="min-w-full border border-gray-300" {...props} />
      </div>
    ),
    th: ({ node, ...props }) => (
      <th className="border border-gray-300 px-3 py-1 bg-gray-100" {...props} />
    ),
    td: ({ node, ...props }) => (
      <td className="border border-gray-300 px-3 py-1" {...props} />
    ),
  };

  return (
    <div
      className={`markdown-preview prose prose-purple prose-sm max-w-none ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
}

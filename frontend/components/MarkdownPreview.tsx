"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
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

  const components: Components = {
    h1: ({ node, ...props }) => (
      <h1 className="text-2xl font-bold mt-4 mb-2 break-words" {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className="text-xl font-bold mt-3 mb-2 break-words" {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className="text-lg font-bold mt-2 mb-1 break-words" {...props} />
    ),
    p: ({ node, ...props }) => (
      <p
        className="mb-2 leading-relaxed break-words whitespace-pre-wrap"
        {...props}
      />
    ),
    ul: ({ node, ...props }) => (
      <ul className="list-disc ml-4 mb-2 break-words" {...props} />
    ),
    ol: ({ node, ...props }) => (
      <ol className="list-decimal ml-4 mb-2 break-words" {...props} />
    ),
    li: ({ node, ...props }) => <li className="mb-1 break-words" {...props} />,
    a: ({ node, ...props }) => (
      <a
        className="text-purple-600 hover:underline break-words"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    ),
    img: ({ node, ...props }) => {
      // Поддержка base64 изображений
      const src = props.src || "";
      return (
        <img
          {...props}
          src={src}
          className="max-w-full h-auto rounded-lg shadow-md my-2"
          style={{ maxWidth: "100%", height: "auto" }}
          alt={props.alt || "Изображение"}
        />
      );
    },
    code: ({ node, className, children, ...props }) => {
      const isInline = !className;
      if (isInline) {
        return (
          <code
            className="bg-gray-100 rounded px-1 py-0.5 text-sm font-mono break-words whitespace-pre-wrap"
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
        className="border-l-4 border-purple-400 pl-4 italic my-2 text-gray-600 break-words"
        {...props}
      />
    ),
    table: ({ node, ...props }) => (
      <div className="overflow-x-auto my-2">
        <table className="min-w-full border border-gray-300" {...props} />
      </div>
    ),
    th: ({ node, ...props }) => (
      <th
        className="border border-gray-300 px-3 py-1 bg-gray-100 break-words"
        {...props}
      />
    ),
    td: ({ node, ...props }) => (
      <td className="border border-gray-300 px-3 py-1 break-words" {...props} />
    ),
  };

  return (
    <div
      className={`markdown-preview prose prose-purple prose-sm max-w-none w-full overflow-x-hidden ${className}`}
      style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

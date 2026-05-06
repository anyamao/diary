"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export default function MarkdownPreview({
  content,
  className = "text-pink-950",
}: MarkdownPreviewProps) {
  if (!content) {
    return <p className="text-gray-400 italic">No content</p>;
  }

  return (
    <div
      className={`markdown-preview text-pink-950 prose bg-pink-50 prose-purple prose-sm max-w-none ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ className, children, ...props }: any) {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className=" text-pink-950 bg-pink-50 rounded px-1 py-0.5 text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-gray-800 text-pink-950 text-gray-200 rounded-lg p-3 overflow-x-auto text-sm font-mono">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

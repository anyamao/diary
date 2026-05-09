"use client";

import { useState, useEffect, useRef } from "react";
import MarkdownPreview from "./MarkdownPreview";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 10,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (activeTab === "write" && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value, activeTab]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div className="">
      <div className="flex ">
        <button
          type="button"
          onClick={() => setActiveTab("write")}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === "write"
              ? "bg-pink-200 rounded-l-lg"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Написать
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={`px-4 py-2 text-xs font-medium transition ${
            activeTab === "preview"
              ? "bg-pink-200 rounded-r-lg "
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Предпросмотр
        </button>
      </div>

      {activeTab === "write" ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextareaChange}
          placeholder={placeholder}
          rows={1}
          className="w-full px-4 py-3 bg-pink-50 outline-none font-mono text-sm resize-none overflow-hidden"
        />
      ) : (
        <div className="p-4 min-h-[300px] overflow-y-auto">
          <MarkdownPreview content={value || "*Пусто*"} />
        </div>
      )}
      <div className="bg-pink-50 px-4 py-2 text-xs text-gray-500">
        <details>
          <summary className="cursor-pointer">
            Поддерживается Markdown (нажми, чтобы узнать)
          </summary>
          <div className="mt-2 space-y-1">
            <p>
              <code>**bold**</code> - <strong>жирный</strong>
            </p>
            <p>
              <code>*italic*</code> - <em>курсив</em>
            </p>
            <p>
              <code>`code`</code> - <code>код</code>
            </p>
            <p>
              <code>```code block```</code> - блок кода
            </p>
            <p>
              <code>- item</code> - маркированный список
            </p>
            <p>
              <code>1. item</code> - нумерованный список
            </p>
            <p>
              <code># Заголовок 1</code> - <code>## Заголовок 2</code>
            </p>
            <p>
              <code>[текст](url)</code> - ссылка
            </p>
            <p>
              <code>![alt](image-url)</code> - изображение
            </p>
            <p>
              <code>| таблица | с | строками |</code> - таблицы
            </p>
            <p>
              <code>&gt; цитата</code> - цитата
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}

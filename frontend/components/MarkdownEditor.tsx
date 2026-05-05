"use client";

import { useState } from "react";
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

  return (
    <div className="">
      <div className="flex ">
        <button
          type="button"
          onClick={() => setActiveTab("write")}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === "write"
              ? "bg-white text-purple-600 border-b-2 border-purple-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          ✏️ Написать
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === "preview"
              ? "bg-white text-purple-600 border-b-2 border-purple-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          👁️ Предпросмотр
        </button>
      </div>

      {activeTab === "write" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
        />
      ) : (
        <div className="p-4 min-h-[300px] bg-white overflow-y-auto">
          <MarkdownPreview content={value || "*Пусто*"} />
        </div>
      )}

      <div className="border-t border-gray-300 bg-gray-50 px-4 py-2 text-xs text-gray-500">
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

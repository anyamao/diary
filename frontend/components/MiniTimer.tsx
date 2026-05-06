"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { Play, Square, X, Edit2, Check } from "lucide-react";
import Link from "next/link";

interface CurrentSession {
  is_active: boolean;
  id?: string;
  tag?: string;
  description?: string;
  start_time?: string;
  elapsed_seconds?: number;
}

export default function MiniTimer() {
  const [session, setSession] = useState<CurrentSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tags, setTags] = useState<any[]>([]);
  const [selectedTag, setSelectedTag] = useState("");
  const [description, setDescription] = useState("");
  const [editingDescription, setEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrentSession();
      fetchTags();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      if (session?.is_active && session.start_time) {
        const start = new Date(session.start_time);
        const now = new Date();
        setElapsed(Math.floor((now.getTime() - start.getTime()) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [session, isAuthenticated]);

  // Автоматическое изменение высоты textarea
  useEffect(() => {
    if (editingDescription && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editingDescription, tempDescription]);

  const fetchCurrentSession = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get("/study-timer/current");
      setSession(response.data);
      if (response.data.is_active) {
        setElapsed(response.data.elapsed_seconds || 0);
        setTempDescription(response.data.description || "");
      }
    } catch (error) {
      console.error("Failed to fetch current session:", error);
    }
  };

  const fetchTags = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get("/study-timer/tags");
      setTags(response.data);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  };

  const startTimer = async () => {
    if (!selectedTag) {
      setShowTagModal(true);
      return;
    }

    try {
      await api.post("/study-timer/start", {
        tag: selectedTag,
        description: description || null,
      });
      await fetchCurrentSession();
      window.dispatchEvent(new Event("timer-updated"));
      setShowTagModal(false);
      setSelectedTag("");
      setDescription("");
    } catch (error) {
      console.error("Failed to start timer:", error);
    }
  };

  const stopTimer = async () => {
    if (confirm("Завершить текущую сессию?")) {
      try {
        await api.post("/study-timer/stop");
        await fetchCurrentSession();
        window.dispatchEvent(new Event("timer-updated"));
      } catch (error) {
        console.error("Failed to stop timer:", error);
      }
    }
  };

  const updateDescription = async () => {
    try {
      await api.patch("/study-timer/current/description", {
        description: tempDescription,
      });
      await fetchCurrentSession();
      setEditingDescription(false);
      window.dispatchEvent(new Event("timer-updated"));
    } catch (error) {
      console.error("Failed to update description:", error);
    }
  };

  const createTag = async (name: string) => {
    try {
      await api.post("/study-timer/tags", { name, color: "blue" });
      fetchTags();
    } catch (error) {
      alert("Ошибка создания тега");
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition z-50"
      >
        <Play className="w-5 h-5" />
      </button>
    );
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-[320px] max-w-[calc(100vw-2rem)]">
        <div className="flex justify-between items-center p-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${session?.is_active ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
            />
            <span className="text-sm font-medium text-gray-700">
              {session?.is_active ? "Таймер идет" : "Таймер остановлен"}
            </span>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3">
          {session?.is_active ? (
            <>
              <div className="text-center mb-2">
                <div className="text-2xl font-mono font-bold text-gray-800">
                  {formatTime(elapsed)}
                </div>
                <div className="text-sm font-medium text-gray-700 mt-1">
                  {session.tag}
                </div>
              </div>

              {/* Многострочное редактируемое описание */}
              <div className="mb-3">
                {editingDescription ? (
                  <div className="space-y-2">
                    <textarea
                      ref={textareaRef}
                      value={tempDescription}
                      onChange={(e) => setTempDescription(e.target.value)}
                      className="w-full text-sm p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      placeholder="Описание сессии..."
                      rows={1}
                      style={{ minHeight: "60px", maxHeight: "150px" }}
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={updateDescription}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                      >
                        <Check className="w-3 h-3 inline mr-1" /> Сохранить
                      </button>
                      <button
                        onClick={() => {
                          setEditingDescription(false);
                          setTempDescription(session.description || "");
                        }}
                        className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 text-sm"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="text-xs text-gray-500 bg-gray-50 p-2 rounded cursor-pointer hover:bg-gray-100 transition group"
                    onClick={() => {
                      setEditingDescription(true);
                      setTempDescription(session.description || "");
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="whitespace-pre-wrap break-words flex-1 max-w-[240px]">
                        {session.description || "Добавить описание..."}
                      </div>
                      <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition flex-shrink-0 ml-2" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-2">
                <Link
                  href="/business/study-timer"
                  className="flex-1 text-center text-sm text-blue-600 hover:text-blue-700"
                  onClick={() => {
                    setTimeout(() => {
                      window.dispatchEvent(new Event("timer-updated"));
                    }, 100);
                  }}
                >
                  Подробнее
                </Link>
                <button
                  onClick={stopTimer}
                  className="flex-1 bg-red-500 text-white py-1.5 rounded-lg hover:bg-red-600 transition text-sm"
                >
                  Остановить
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center text-gray-500 text-sm mb-3">
                Нет активной сессии
              </div>
              <button
                onClick={() => setShowTagModal(true)}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" /> Начать учебу
              </button>
            </>
          )}
        </div>
      </div>

      {/* Модальное окно выбора тега */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Начать сессию</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Выберите предмет/тег
                </label>
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите тег</option>
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.name}>
                      {tag.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={async () => {
                    const name = prompt("Введите название нового тега:");
                    if (name) {
                      await createTag(name);
                    }
                  }}
                  className="text-xs text-blue-600 mt-1 hover:text-blue-700"
                >
                  + Создать новый тег
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Описание (необязательно)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="Что будешь изучать?"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={startTimer}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Начать
                </button>
                <button
                  onClick={() => setShowTagModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { Play, Square, X, Edit2, Check } from "lucide-react";
import { colors } from "@/lib/colors";
import { useColorTags } from "@/hooks/useColorTags";
import { showToast } from "@/components/Toast";
import { showConfirm } from "@/components/ConfirmDialog";

interface Tag {
  id: string;
  name: string;
  color: string;
}

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
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState("");
  const [description, setDescription] = useState("");
  const [editingDescription, setEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isAuthenticated, isLoading } = useAuthStore();

  const { tags: colorTags, loadTags: loadColorTags } = useColorTags();

  useEffect(() => {
    if (isAuthenticated) {
      loadColorTags();
      fetchCurrentSession();
      fetchTags();
    }
  }, [isAuthenticated]);

  // Подписываемся на события
  useEffect(() => {
    const handleTimerUpdate = () => {
      console.log("🔄 MiniTimer: получил событие timer-updated");
      // Принудительно обновляем данные
      fetchCurrentSession();
      fetchTags();
      loadColorTags();
    };

    window.addEventListener("timer-updated", handleTimerUpdate);

    // Также обновляем данные каждые 5 секунд для надежности
    const interval = setInterval(() => {
      if (isAuthenticated) {
        fetchCurrentSession();
      }
    }, 5000);

    return () => {
      window.removeEventListener("timer-updated", handleTimerUpdate);
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const tick = setInterval(() => {
      if (session?.is_active && session.start_time) {
        const start = new Date(session.start_time);
        const now = new Date();
        setElapsed(Math.floor((now.getTime() - start.getTime()) / 1000));
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [session, isAuthenticated]);

  useEffect(() => {
    if (editingDescription && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editingDescription, tempDescription]);

  const fetchCurrentSession = async () => {
    if (!isAuthenticated) return;
    try {
      console.log("📡 MiniTimer: запрос текущей сессии...");
      const response = await api.get("/study-timer/current");
      console.log(
        "📡 MiniTimer: ответ сервера:",
        JSON.stringify(response.data, null, 2),
      );

      const wasActive = session?.is_active;
      const isNowActive = response.data.is_active;

      setSession(response.data);

      if (response.data.is_active) {
        setElapsed(response.data.elapsed_seconds || 0);
        setTempDescription(response.data.description || "");
      }

      if (wasActive !== isNowActive) {
        console.log(
          `🔄 MiniTimer: статус изменился с ${wasActive} на ${isNowActive}`,
        );
        if (isNowActive) {
          showToast(`Сессия активна: ${response.data.tag}`, "info");
        }
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
      console.log("📡 MiniTimer: отправка запроса на старт...");
      await api.post("/study-timer/start", {
        tag: selectedTag,
        description: description || null,
      });
      await fetchCurrentSession();
      window.dispatchEvent(new Event("timer-updated"));
      setShowTagModal(false);
      setSelectedTag("");
      setDescription("");
      showToast(`Начата сессия: ${selectedTag}`, "success");
    } catch (error) {
      console.error("Failed to start timer:", error);
      showToast("Ошибка при запуске таймера", "error");
    }
  };

  const stopTimer = async () => {
    const confirmed = await showConfirm(
      "Завершить сессию?",
      "Вы уверены, что хотите завершить текущую сессию?",
      "warning",
    );
    if (confirmed) {
      try {
        console.log("📡 MiniTimer: отправка запроса на остановку...");
        await api.post("/study-timer/stop");
        await fetchCurrentSession();
        window.dispatchEvent(new Event("timer-updated"));
        showToast("Сессия завершена", "success");
      } catch (error) {
        console.error("Failed to stop timer:", error);
        showToast("Ошибка при завершении сессии", "error");
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
      showToast("Описание обновлено", "success");
    } catch (error) {
      console.error("Failed to update description:", error);
      showToast("Ошибка при обновлении описания", "error");
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
        className="fixed bottom-4 right-4 bg-pink-600 text-white p-3 rounded-full shadow-lg hover:bg-pink-700 transition z-50"
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

              <div className="mb-3">
                {editingDescription ? (
                  <div className="space-y-2">
                    <textarea
                      ref={textareaRef}
                      value={tempDescription}
                      onChange={(e) => setTempDescription(e.target.value)}
                      className="w-full text-sm p-2 border rounded focus:outline-none focus:ring-1 focus:ring-pink-500 resize-none"
                      placeholder="Описание сессии..."
                      rows={1}
                      style={{ minHeight: "60px", maxHeight: "150px" }}
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={updateDescription}
                        className="px-3 py-1 bg-pink-500 text-white rounded hover:bg-pink-600 text-sm"
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
                      <div className="whitespace-pre-wrap break-all flex-1 max-w-[240px]">
                        {session.description || "Добавить описание..."}
                      </div>
                      <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition flex-shrink-0 ml-2" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={stopTimer}
                  className="flex-1 bg-pink-600 text-white py-1.5 rounded-lg hover:bg-pink-700 transition text-sm"
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
                className="w-full bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700 transition flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" /> Начать учебу
              </button>
            </>
          )}
        </div>
      </div>

      {showTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Начать сессию
              </h2>
              <button
                onClick={() => setShowTagModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Выберите предмет/тег
                </label>

                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
                  {colors.map((color) => {
                    const tagName = colorTags[color.name];
                    const displayName = tagName || color.label;

                    return (
                      <button
                        key={color.name}
                        onClick={() => setSelectedTag(displayName)}
                        className={`
                          flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200
                          ${
                            selectedTag === displayName
                              ? `${color.bg} border-${color.name}-500 ring-2 ring-${color.name}-300`
                              : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                          }
                        `}
                      >
                        <div
                          className={`w-5 h-5 rounded-full ${color.base} shadow-sm`}
                        />
                        <span
                          className={`text-sm font-medium ${selectedTag === displayName ? "text-gray-900" : "text-gray-700"}`}
                        >
                          {displayName}
                        </span>
                        {selectedTag === displayName && (
                          <Check className="w-4 h-4 text-green-500 ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание (необязательно)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full max-w-[600px] p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none transition break-words whitespace-pre-wrap"
                  rows={3}
                  placeholder="Что будешь изучать? Например: глава 3, задачи на циклы..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={startTimer}
                  disabled={!selectedTag}
                  className={`
                    flex-1 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2
                    ${
                      selectedTag
                        ? "bg-pink-600 text-white shadow-md hover:bg-pink-700"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }
                  `}
                >
                  <Play className="w-4 h-4" />
                  Начать сессию
                </button>
                <button
                  onClick={() => setShowTagModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
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

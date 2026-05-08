"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import {
  Play,
  Square,
  Plus,
  Trash2,
  XIcon,
  Edit2,
  Check,
  X,
  Tag,
  Pen,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { showToast } from "@/components/Toast";
import { showConfirm } from "@/components/ConfirmDialog";
import { colors, getColorHex } from "@/lib/colors";
import { useColorTags } from "@/hooks/useColorTags";
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

interface Stats {
  total_hours: number;
  total_minutes: number;
  by_tag: { [key: string]: number };
  sessions: any[];
}

export default function StudyTimerPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [currentSession, setCurrentSession] = useState<CurrentSession | null>(
    null,
  );
  const [elapsed, setElapsed] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [period, setPeriod] = useState<"week" | "month" | "all" | "custom">(
    "week",
  );
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showTagModal, setShowTagModal] = useState(false);
  const [selectedTag, setSelectedTag] = useState("");
  const [description, setDescription] = useState("");
  const [editingDescription, setEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  const {
    tags: colorTags,
    saveTag: saveColorTag,
    loadTags: loadColorTags,
  } = useColorTags();
  const [editingColorTag, setEditingColorTag] = useState<string | null>(null);
  const [newColorTagName, setNewColorTagName] = useState("");
  // Добавьте эту строку после других хуков:
  // Получаем цвет тега
  const getTagColor = (tagName: string) => {
    const tag = tags.find((t) => t.name === tagName);
    if (tag && tag.color) {
      return getColorHex(tag.color);
    }
    return colors[0].hex;
  };

  const deleteSession = async (sessionId: string) => {
    const confirmed = await showConfirm(
      "Удалить сессию?",
      "Эта сессия будет удалена из истории.",
      "danger",
    );
    if (confirmed) {
      try {
        await api.delete(`/study-timer/sessions/${sessionId}`);
        await loadAll();
        showToast("Сессия удалена", "success");
        window.dispatchEvent(new Event("timer-updated"));
      } catch (error) {
        console.error("Failed to delete session:", error);
        showToast("Ошибка при удалении сессии", "error");
      }
    }
  };
  const getTagStyle = (tagName: string) => {
    const tag = tags.find((t) => t.name === tagName);
    if (tag && tag.color) {
      return colors.find((c) => c.name === tag.color) || colors[0];
    }
    return colors[0];
  };

  useEffect(() => {
    if (editingDescription && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editingDescription, tempDescription]);

  const loadAll = async () => {
    if (!isAuthenticated) return;
    await Promise.all([fetchTags(), fetchCurrentSession(), fetchStats()]);
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      loadColorTags();
      loadAll();
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    const handleTimerUpdate = () => {
      fetchCurrentSession();
      fetchStats();
    };

    window.addEventListener("timer-updated", handleTimerUpdate);
    return () => window.removeEventListener("timer-updated", handleTimerUpdate);
  }, []);
  useEffect(() => {
    if (period === "custom") {
      fetchStats();
    }
  }, [customStart, customEnd]);

  loadColorTags();
  useEffect(() => {
    if (period !== "custom") {
      fetchStats();
    }
  }, [period]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentSession?.is_active && currentSession.start_time) {
        const start = new Date(currentSession.start_time);
        const now = new Date();
        setElapsed(Math.floor((now.getTime() - start.getTime()) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [currentSession]);

  const fetchTags = async () => {
    try {
      const response = await api.get("/study-timer/tags");
      setTags(response.data);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  };

  const fetchCurrentSession = async () => {
    try {
      const response = await api.get("/study-timer/current");
      setCurrentSession(response.data);
      if (response.data.is_active) {
        setElapsed(response.data.elapsed_seconds || 0);
        setTempDescription(response.data.description || "");
      }
    } catch (error) {
      console.error("Failed to fetch current session:", error);
    }
  };

  const fetchStats = async () => {
    try {
      let url = `/study-timer/stats?period=${period}`;
      if (period === "custom" && customStart) {
        url += `&start_date=${customStart}&end_date=${customEnd || new Date().toISOString()}`;
      }
      const response = await api.get(url);
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
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
      await loadAll();
      setShowTagModal(false);
      setSelectedTag("");
      showToast(`Начата сессия: ${selectedTag}`, "success");
      setDescription("");
      // Добавляем dispatch события
      window.dispatchEvent(new Event("timer-updated"));
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
        await api.post("/study-timer/stop");
        await loadAll();
        showToast("Сессия успешно завершена", "success");
        // Добавляем dispatch события
        window.dispatchEvent(new Event("timer-updated"));
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
      showToast("Описание обновлено", "success");
      // Добавляем dispatch события
      window.dispatchEvent(new Event("timer-updated"));
    } catch (error) {
      console.error("Failed to update description:", error);
      showToast("Ошибка при обновлении описания", "error");
    }
  };

  const createTag = async (name: string, color: string = "yellow") => {
    try {
      await api.post("/study-timer/tags", { name, color });
      await fetchTags();
      window.dispatchEvent(new Event("timer-updated"));
      showToast(`Тег "${name}" создан`, "success");
    } catch (error) {
      alert("Ошибка создания тега");
    }
  };
  const deleteTag = async (id: string, name: string) => {
    const confirmed = await showConfirm(
      "Удалить тег?",
      `Тег "${name}" будет удален. Все сессии с этим тегом останутся.`,
      "danger",
    );
    if (confirmed) {
      try {
        await api.delete(`/study-timer/tags/${id}`);
        await fetchTags();
        showToast(`Тег "${name}" удален`, "success");
        window.dispatchEvent(new Event("timer-updated"));
      } catch (error) {
        console.error("Failed to delete tag:", error);
        showToast("Ошибка при удалении тега", "error");
      }
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const statsData = stats?.by_tag
    ? Object.entries(stats.by_tag).map(([name, value]) => ({
        name,
        hours: value,
        color: getTagColor(name),
      }))
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Study Timer
            </h1>
            <p className="text-gray-600">
              Отслеживай время учебы и повышай продуктивность
            </p>
          </div>
        </div>

        {/* Основной таймер */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 text-center">
          <div className="text-6xl font-mono font-bold text-gray-800 mb-4">
            {currentSession?.is_active ? formatTime(elapsed) : "00:00:00"}
          </div>

          {currentSession?.is_active && (
            <>
              <div className="text-sm text-gray-500 mb-2">
                Изучается: {currentSession.tag}
              </div>
              <div className="max-w-md mx-auto mb-4">
                {editingDescription ? (
                  <div className="space-y-2">
                    <textarea
                      ref={textareaRef}
                      value={tempDescription}
                      onChange={(e) => setTempDescription(e.target.value)}
                      className="w-full text-sm p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Описание сессии..."
                      rows={1}
                      style={{
                        minHeight: "60px",
                        maxHeight: "200px",
                        width: "100%",
                      }}
                      autoFocus
                    />
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={updateDescription}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                      >
                        <Check className="w-4 h-4 inline mr-1" /> Сохранить
                      </button>
                      <button
                        onClick={() => {
                          setEditingDescription(false);
                          setTempDescription(currentSession.description || "");
                        }}
                        className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 text-sm"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="text-sm text-gray-500 bg-gray-50 p-3 rounded cursor-pointer hover:bg-gray-100 transition group text-left"
                    onClick={() => {
                      setEditingDescription(true);
                      setTempDescription(currentSession.description || "");
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="whitespace-pre-wrap break-words flex-1">
                        {currentSession.description || "Добавить описание..."}
                      </div>
                      <Edit2 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition flex-shrink-0 ml-2" />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex gap-4 justify-center">
            {!currentSession?.is_active ? (
              <button
                onClick={() => setShowTagModal(true)}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-lg"
              >
                <Play className="w-5 h-5" /> Начать учебу
              </button>
            ) : (
              <button
                onClick={stopTimer}
                className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition flex items-center gap-2 text-lg"
              >
                <Square className="w-5 h-5" /> Завершить
              </button>
            )}
          </div>
        </div>
        {/* Управление цветными тегами (общие с Planner) */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-pink-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                Мои цветные теги
              </h2>
            </div>
            <p className="text-xs text-gray-500">
              Синхронизируется с планировщиком
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {colors.map((color) => {
              const displayName = colorTags[color.name] || color.label;
              return (
                <div key={color.name} className="flex flex-col gap-1">
                  <div
                    className={`flex items-center gap-2 p-2 rounded-lg ${color.bg}`}
                  >
                    <div className={`w-4 h-4 rounded-full ${color.base}`} />
                    <span className="text-sm flex-1">{displayName}</span>
                    <button
                      onClick={() => {
                        setEditingColorTag(color.name);
                        setNewColorTagName(colorTags[color.name] || "");
                      }}
                      className="text-gray-500 hover:text-pink-600"
                    >
                      <Pen className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Модальное окно редактирования тега */}
        {editingColorTag && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  Редактировать тег для{" "}
                  {colors.find((c) => c.name === editingColorTag)?.label}
                </h3>
                <button
                  onClick={() => setEditingColorTag(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  value={newColorTagName}
                  onChange={(e) => setNewColorTagName(e.target.value)}
                  placeholder="Название тега"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      if (newColorTagName.trim()) {
                        await saveColorTag(editingColorTag, newColorTagName);
                        setEditingColorTag(null);
                        setNewColorTagName("");
                      }
                    }}
                    className="flex-1 bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700"
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={() => setEditingColorTag(null)}
                    className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Статистика */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Статистика
          </h2>

          <div className="flex gap-3 mb-6">
            {(["week", "month", "all", "custom"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg transition ${
                  period === p
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {p === "week"
                  ? "Неделя"
                  : p === "month"
                    ? "Месяц"
                    : p === "all"
                      ? "Все время"
                      : "Свой период"}
              </button>
            ))}
          </div>

          {period === "custom" && (
            <div className="flex gap-3 mb-6">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="p-2 border rounded"
              />
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="p-2 border rounded"
              />
              <button
                onClick={fetchStats}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Применить
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-sm">Всего времени</p>
              <p className="text-3xl font-bold text-blue-600">
                {stats?.total_hours || 0} ч
              </p>
              <p className="text-sm text-gray-500">
                {stats?.total_minutes || 0} минут
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-sm">Сессий завершено</p>
              <p className="text-3xl font-bold text-blue-600">
                {stats?.sessions?.length || 0}
              </p>
            </div>
          </div>

          {statsData.length > 0 && (
            <>
              <div className="mt-6">
                <h3 className="font-medium text-gray-700 mb-3">
                  Распределение по предметам
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis
                      label={{
                        value: "Часы",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip />
                    <Bar dataKey="hours" fill="#3b82f6" name="Часы" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6">
                <h3 className="font-medium text-gray-700 mb-3">
                  Соотношение предметов
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="hours"
                    >
                      {statsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
        {/* История сессий */}
        {stats?.sessions && stats.sessions.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              История сессий
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stats.sessions.map((session: any) => {
                const colorStyle =
                  colors.find(
                    (c) => c.name === getTagStyle(session.tag).name,
                  ) || colors[0];
                return (
                  <div
                    key={session.id}
                    className={`border-l-4 rounded-lg p-3 mb-2 ${colorStyle.border} ${colorStyle.bg} group`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${colorStyle.base}`}
                          />
                          <span className="font-medium text-gray-800">
                            {session.tag}
                          </span>
                        </div>
                        {session.description && (
                          <p className="text-sm text-gray-500 whitespace-pre-wrap break-words mt-1">
                            {session.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(session.start_time).toLocaleString()} -{" "}
                          {session.end_time
                            ? new Date(session.end_time).toLocaleTimeString()
                            : "сейчас"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-blue-600 font-medium">
                          {session.duration_hours} ч
                        </span>
                        <button
                          onClick={() => deleteSession(session.id)}
                          className="opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-700"
                          title="Удалить сессию"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
              {/* Выбор тега */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Выберите предмет/тег
                </label>

                {/* Список всех цветов с тегами */}
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

                <p className="text-xs text-gray-400 mt-2 text-center">
                  Нажмите на тег, чтобы выбрать его для сессии
                </p>
              </div>

              {/* Описание */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание (необязательно)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition"
                  rows={3}
                  placeholder="Что будешь изучать? Например: глава 3, задачи на циклы..."
                />
              </div>

              {/* Кнопки действий */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={startTimer}
                  disabled={!selectedTag}
                  className={`
              flex-1 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2
              ${
                selectedTag
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800"
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

              {/* Подсказка */}
              <p className="text-xs text-gray-400 text-center pt-2 border-t border-gray-100">
                💡 Теги можно изменить в настройках цветных тегов выше
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

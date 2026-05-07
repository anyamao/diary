"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { Play, Square, Plus, Trash2, Edit2, Check, X, Tag } from "lucide-react";
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
import { colors, getColorHex } from "@/lib/colors";

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

  // Получаем цвет тега
  const getTagColor = (tagName: string) => {
    const tag = tags.find((t) => t.name === tagName);
    if (tag && tag.color) {
      return getColorHex(tag.color);
    }
    return colors[0].hex;
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
      setDescription("");
    } catch (error) {
      console.error("Failed to start timer:", error);
    }
  };

  const stopTimer = async () => {
    if (confirm("Завершить текущую сессию?")) {
      try {
        await api.post("/study-timer/stop");
        await loadAll();
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
    } catch (error) {
      console.error("Failed to update description:", error);
    }
  };

  const createTag = async (name: string, color: string = "yellow") => {
    try {
      await api.post("/study-timer/tags", { name, color });
      fetchTags();
    } catch (error) {
      alert("Ошибка создания тега");
    }
  };

  const deleteTag = async (id: string) => {
    if (
      confirm(
        "Удалить тег? Все сессии с этим тегом останутся, но он будет удален из списка.",
      )
    ) {
      try {
        await api.delete(`/study-timer/tags/${id}`);
        fetchTags();
      } catch (error) {
        alert("Ошибка удаления");
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

        {/* Управление тегами с цветами из planner */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">Мои теги</h2>
            </div>
            <button
              onClick={async () => {
                const name = prompt("Введите название тега:");
                if (name) {
                  await createTag(name, "yellow");
                }
              }}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Добавить тег
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const colorStyle =
                colors.find((c) => c.name === tag.color) || colors[0];
              return (
                <div
                  key={tag.id}
                  className={`flex items-center gap-1 rounded-full px-3 py-1 ${colorStyle.bg}`}
                >
                  <div className={`w-2 h-2 rounded-full ${colorStyle.base}`} />
                  <span className="text-sm">{tag.name}</span>
                  <button
                    onClick={() => deleteTag(tag.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
            {tags.length === 0 && (
              <p className="text-gray-400 text-sm">
                Нет тегов. Создайте первый!
              </p>
            )}
          </div>
        </div>

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
                    className={`border-l-4 rounded-lg p-3 mb-2 ${colorStyle.border} ${colorStyle.bg}`}
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
                      <span className="text-blue-600 font-medium ml-4">
                        {session.duration_hours} ч
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно выбора тега с цветами из planner */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                  {tags.map((tag) => {
                    const colorStyle =
                      colors.find((c) => c.name === tag.color) || colors[0];
                    return (
                      <option key={tag.id} value={tag.name}>
                        {tag.name}
                      </option>
                    );
                  })}
                </select>
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">
                    Или создайте новый с цветом:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {colors.slice(0, 6).map((color) => (
                      <button
                        key={color.name}
                        onClick={async () => {
                          const name = prompt("Введите название тега:");
                          if (name) {
                            await createTag(name, color.name);
                          }
                        }}
                        className={`w-8 h-8 rounded-full transition ${color.base} hover:scale-110`}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
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
                  style={{ width: "100%" }}
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
    </div>
  );
}

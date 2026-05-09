"use client";
import Loading from "@/components/Loading";
import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import {
  Play,
  Square,
  Trash2,
  Edit2,
  Check,
  X,
  Tag,
  Pen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { showToast } from "@/components/Toast";
import { showConfirm } from "@/components/ConfirmDialog";
import { useColorTags } from "@/hooks/useColorTags";
const colors = [
  {
    name: "yellow",
    label: "Желтый",
    bg: "bg-yellow-100",
    border: "border-yellow-400",
    text: "text-yellow-800",
    tagBg: "bg-yellow-200",
    base: "bg-yellow-500",
  },
  {
    name: "blue",
    label: "Синий",
    bg: "bg-blue-100",
    border: "border-blue-400",
    text: "text-blue-800",
    tagBg: "bg-blue-200",
    base: "bg-blue-500",
  },
  {
    name: "green",
    label: "Зеленый",
    bg: "bg-green-100",
    border: "border-green-400",
    text: "text-green-800",
    tagBg: "bg-green-200",
    base: "bg-green-500",
  },
  {
    name: "purple",
    label: "Фиолетовый",
    bg: "bg-purple-100",
    border: "border-purple-400",
    text: "text-purple-800",
    tagBg: "bg-purple-200",
    base: "bg-purple-500",
  },
  {
    name: "pink",
    label: "Розовый",
    bg: "bg-pink-100",
    border: "border-pink-400",
    text: "text-pink-800",
    tagBg: "bg-pink-200",
    base: "bg-pink-500",
  },
  {
    name: "dark-pink",
    label: "Темно-розовый",
    bg: "bg-pink-200",
    border: "border-pink-400",
    text: "text-pink-800",
    tagBg: "bg-pink-300",
    base: "bg-pink-600",
  },

  {
    name: "teal",
    label: "Бирюзовый",
    bg: "bg-teal-100",
    border: "border-teal-400",
    text: "text-teal-800",
    tagBg: "bg-teal-200",
    base: "bg-teal-500",
  },
  {
    name: "indigo",
    label: "Индиго",
    bg: "bg-indigo-200",
    border: "border-indigo-400",
    text: "text-indigo-800",
    tagBg: "bg-indigo-200",
    base: "bg-indigo-600",
  },
  {
    name: "fuchsia",
    label: "Фукция",
    bg: "bg-fuchsia-200",
    border: "border-fuchsia-400",
    text: "text-fuchsia-800",
    tagBg: "bg-fuchsia-200",
    base: "bg-fuchsia-600",
  },

  {
    name: "orange",
    label: "Оранжевый",
    bg: "bg-orange-100",
    border: "border-orange-400",
    text: "text-orange-800",
    tagBg: "bg-orange-200",
    base: "bg-orange-500",
  },
];

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
  const [editingSession, setEditingSession] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const [showDaySessions, setShowDaySessions] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [editingDaySession, setEditingDaySession] = useState<any>(null);
  const [showEditDaySessionModal, setShowEditDaySessionModal] = useState(false);
  const [editSessionTag, setEditSessionTag] = useState("");
  const [editSessionDescription, setEditSessionDescription] = useState("");
  const {
    tags: colorTags,
    saveTag: saveColorTag,
    loadTags: loadColorTags,
  } = useColorTags();
  const [editingColorTag, setEditingColorTag] = useState<string | null>(null);
  const [newColorTagName, setNewColorTagName] = useState("");
  const [activityData, setActivityData] = useState<{ [key: string]: number }>(
    {},
  );
  const [selectedDaySessions, setSelectedDaySessions] = useState<any[]>([]);
  const [showDayModal, setShowDayModal] = useState(false);
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [monthlyStats, setMonthlyStats] = useState<any>(null);
  const [allTimeStats, setAllTimeStats] = useState<any>(null);
  const [showAllTimeStats, setShowAllTimeStats] = useState(false);
  const fetchActivityByMonth = async (date: Date) => {
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const response = await api.get(`/study-timer/activity/${year}/${month}`);
      setActivityData(response.data);
    } catch (error) {}
  };

  const fetchSessionsByDay = async (date: string) => {
    try {
      const response = await api.get(`/study-timer/sessions/day/${date}`);
      setSelectedDaySessions(response.data);
      setSelectedDate(date);
      setShowDaySessions(true);
    } catch (error) {
      showToast("Ошибка загрузки сессий", "error");
    }
  };

  const openEditDaySessionModal = (session: any) => {
    setEditingDaySession(session);
    setEditSessionTag(session.tag);
    setEditSessionDescription(session.description || "");
    setShowEditDaySessionModal(true);
  };

  const updateDaySession = async () => {
    if (!editingDaySession) return;

    try {
      await api.put(`/study-timer/sessions/${editingDaySession.id}`, {
        tag: editSessionTag,
        description: editSessionDescription,
      });
      await loadAll();
      await fetchSessionsByDay(selectedDate);
      setShowEditDaySessionModal(false);
      setEditingDaySession(null);
      showToast("Сессия обновлена", "success");
    } catch (error) {
      showToast("Ошибка обновления", "error");
    }
  };
  const fetchMonthlyStats = async (date: Date) => {
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const response = await api.get(
        `/study-timer/stats/monthly/${year}/${month}`,
      );
      setMonthlyStats(response.data);
    } catch (error) {}
  };

  const fetchAllTimeStats = async () => {
    try {
      const response = await api.get(`/study-timer/stats/all`);
      setAllTimeStats(response.data);
    } catch (error) {}
  };
  useEffect(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    setSelectedDate(todayStr);
    fetchSessionsByDay(todayStr);
    setCurrentViewDate(today);
  }, []);
  useEffect(() => {
    if (isAuthenticated) {
      fetchMonthlyStats(currentViewDate);
      fetchAllTimeStats();
    }
  }, [isAuthenticated, currentViewDate]);
  const deleteDaySession = async (sessionId: string) => {
    const confirmed = await showConfirm(
      "Удалить сессию?",
      "Эта сессия будет удалена из истории.",
      "danger",
    );
    if (confirmed) {
      try {
        await api.delete(`/study-timer/sessions/${sessionId}`);
        await loadAll();
        await fetchSessionsByDay(selectedDate);
        showToast("Сессия удалена", "success");
      } catch (error) {
        showToast("Ошибка удаления", "error");
      }
    }
  };
  useEffect(() => {
    if (isAuthenticated) {
      fetchActivityByMonth(currentViewDate);
    }
  }, [isAuthenticated, currentViewDate]);

  const prevMonth = () => {
    const newDate = new Date(currentViewDate);
    newDate.setMonth(currentViewDate.getMonth() - 1);
    setCurrentViewDate(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(currentViewDate);
    newDate.setMonth(currentViewDate.getMonth() + 1);
    setCurrentViewDate(newDate);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const getDisplayHours = (hours: number) => {
    if (hours === 0) return "";
    if (hours < 1) return `${Math.round(hours * 60)}м`;
    return `${hours.toFixed(1)}ч`;
  };

  const formatTimeFromSeconds = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}ч ${minutes}м`;
    return `${minutes}м`;
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
      fetchTags();
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
    } catch (error) {}
  };

  const fetchCurrentSession = async () => {
    try {
      const response = await api.get("/study-timer/current");
      setCurrentSession(response.data);
      if (response.data.is_active) {
        setElapsed(response.data.elapsed_seconds || 0);
        setTempDescription(response.data.description || "");
      }
    } catch (error) {}
  };

  const fetchStats = async () => {
    try {
      let url = `/study-timer/stats?period=${period}`;
      if (period === "custom" && customStart) {
        url += `&start_date=${customStart}&end_date=${customEnd || new Date().toISOString()}`;
      }
      const response = await api.get(url);
      setStats(response.data);
    } catch (error) {}
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
      showToast(`Начата сессия: ${selectedTag}`, "success");
      window.dispatchEvent(new Event("timer-updated"));
    } catch (error) {
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
        window.dispatchEvent(new Event("timer-updated"));
      } catch (error) {
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
      window.dispatchEvent(new Event("timer-updated"));
    } catch (error) {
      showToast("Ошибка при обновлении описания", "error");
    }
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
        showToast("Ошибка при удалении сессии", "error");
      }
    }
  };

  const updateSession = async () => {
    if (!editingSession) return;

    try {
      await api.put(`/study-timer/sessions/${editingSession.id}`, {
        tag: selectedTag,
        description: description,
      });
      await loadAll();
      setShowEditModal(false);
      setEditingSession(null);
      setSelectedTag("");
      setDescription("");
      showToast("Сессия обновлена", "success");
      window.dispatchEvent(new Event("timer-updated"));
    } catch (error) {
      showToast("Ошибка при обновлении сессии", "error");
    }
  };

  const openEditModal = (session: any) => {
    setEditingSession(session);
    setSelectedTag(session.tag);
    setDescription(session.description || "");
    setShowEditModal(true);
  };

  const saveTagForColor = async (colorName: string, tagName: string) => {
    try {
      await saveColorTag(colorName, tagName);
      loadColorTags();
      await fetchTags();
      window.dispatchEvent(new Event("timer-updated"));
      showToast(`Тег для цвета сохранен`, "success");
    } catch (error) {
      showToast("Ошибка при сохранении тега", "error");
    }
  };

  const getColorForTag = (tagName: string) => {
    if (!tagName) return colors[0];

    if (tagName === "Розовый")
      return colors.find((c) => c.name === "pink") || colors[0];
    if (tagName === "Желтый")
      return colors.find((c) => c.name === "yellow") || colors[0];
    if (tagName === "Синий")
      return colors.find((c) => c.name === "blue") || colors[0];
    if (tagName === "Зеленый")
      return colors.find((c) => c.name === "green") || colors[0];
    if (tagName === "Фиолетовый")
      return colors.find((c) => c.name === "purple") || colors[0];
    if (tagName === "Оранжевый")
      return colors.find((c) => c.name === "orange") || colors[0];

    if (colorTags) {
      const colorEntry = Object.entries(colorTags).find(
        ([_, tag]) => tag === tagName,
      );
      if (colorEntry) {
        const foundColor = colors.find((c) => c.name === colorEntry[0]);
        if (foundColor) return foundColor;
      }
    }

    return colors[0];
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const statsData = stats?.by_tag
    ? Object.entries(stats.by_tag).map(([name, value]) => {
        const getColorHex = (tagName: string) => {
          if (tagName === "Розовый") return "#ec4899";
          if (tagName === "Желтый") return "#eab308";
          if (tagName === "Синий") return "#3b82f6";
          if (tagName === "Зеленый") return "#22c55e";
          if (tagName === "Фиолетовый") return "#a855f7";
          if (tagName === "Оранжевый") return "#f97316";
          return "#eab308";
        };

        return {
          name,
          hours: value,
          color: getColorHex(name),
        };
      })
    : [];

  if (isLoading) {
    return <Loading></Loading>;
  }

  return (
    <div className="min-h-screen bg-pink-50 p-4 md:p-8">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-pink-950 mb-2">
              Study Timer
            </h1>
            <p className="text-gray-600">
              Отслеживай время учебы и повышай продуктивность
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 mb-8 text-center">
          <div className="md:text-6xl text-4xl font-mono font-bold text-gray-800 mb-4">
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
                        className="px-3 py-1 bg-pink-500 text-white rounded hover:bg-pink-600 text-sm"
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
                      <div className="flex-1 whitespace-pre-wrap break-words">
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
                className="bg-pink-500 text-white text-xs md:text-sm px-8 py-3 rounded-lg hover:bg-pink-600 transition flex items-center gap-2 "
              >
                <Play className="md:w-5 md:h-5 w-3 h-3" /> Начать учебу
              </button>
            ) : (
              <button
                onClick={stopTimer}
                className="bg-pink-200 text-pink-950 px-8 py-3 rounded-lg hover:bg-pink-300 transition flex items-center gap-2 text-xs md:text-sm"
              >
                <Square className="md:w-5 md:h-5 w-3 h-3" /> Завершить
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-pink-600" />
              <h2 className="text-xl font-semibold text-pink-900">
                Мои цветные теги
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {colors.map((color) => {
              const displayName = colorTags[color.name] || color.label;
              return (
                <div key={color.name} className="flex flex-col gap-1">
                  <div
                    className={`flex items-center gap-2 p-2 rounded-lg ${color.bg}`}
                  >
                    <div
                      className={`min-w-4 min-h-4 rounded-full ${color.base}`}
                    />
                    <span className="text-sm max-w-[120px] overflow-x-auto overflow-x-auto flex-1 truncate">
                      {displayName}
                    </span>
                    <button
                      onClick={() => {
                        setEditingColorTag(color.name);
                        setNewColorTagName(colorTags[color.name] || "");
                      }}
                      className="text-pink-500 hover:text-pink-600"
                    >
                      <Pen className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className=" w-full  flex flex-col items-center p-6 mb-8">
          <div className="flex justify-between w-full items-center mb-4 ">
            <h2 className="text-xl font-semibold text-pink-900">
              Календарь активности
            </h2>
            <div className="flex gap-2">
              <button
                onClick={prevMonth}
                className="p-2 bg-pink-200 rounded-lg hover:bg-pink-300 transition"
              >
                <ChevronLeft className="w-5 h-5 text-pink-600" />
              </button>
              <span className="text-lg font-medium text-gray-700 px-4 py-1">
                {currentViewDate.toLocaleString("ru-RU", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <button
                onClick={nextMonth}
                className="p-2 bg-pink-200 rounded-lg hover:bg-pink-300 transition"
              >
                <ChevronRight className="w-5 h-5 text-pink-600" />
              </button>
            </div>
          </div>
          <div className="flex flex-row w-full justify-between ">
            <div className="flex flex-col  ">
              <div className="flex flex-col w-full bg-white p-8 bg-blue-200 rounded-lg shadow-sm  max-w-[500px]">
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-medium text-gray-600 py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({
                    length:
                      getFirstDayOfMonth(currentViewDate) === 0
                        ? 6
                        : getFirstDayOfMonth(currentViewDate) - 1,
                  }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="aspect-square rounded-lg bg-gray-100"
                    />
                  ))}
                  {Array.from({ length: getDaysInMonth(currentViewDate) }).map(
                    (_, i) => {
                      const day = i + 1;
                      const dateStr = `${currentViewDate.getFullYear()}-${String(currentViewDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const hours = activityData[dateStr] || 0;
                      const isToday =
                        new Date().toDateString() ===
                        new Date(
                          currentViewDate.getFullYear(),
                          currentViewDate.getMonth(),
                          day,
                        ).toDateString();

                      const isSelectedDay = selectedDate === dateStr;

                      let bgClass = "bg-gray-100 hover:bg-gray-200";
                      if (hours > 0) {
                        if (hours >= 4)
                          bgClass = "bg-green-200 hover:bg-green-300";
                        else if (hours >= 2)
                          bgClass = "bg-green-100 hover:bg-green-200";
                        else bgClass = "bg-green-50 hover:bg-green-100";
                      }

                      const selectedClass = isSelectedDay
                        ? "border-2  bg-pink-100 hover:bg-pink-200 ring-pink-200 text-pink-800 border-pink-200 "
                        : "";

                      return (
                        <button
                          key={day}
                          onClick={() => fetchSessionsByDay(dateStr)}
                          className={`aspect-square rounded-lg flex flex-col items-center justify-center p-1 transition hover:scale-105 ${bgClass} ${selectedClass} ${isToday ? "ring-2 ring-pink-400" : ""}`}
                        >
                          <span
                            className={`text-sm font-medium ${hours > 0 ? "text-green-800" : "text-gray-700"}`}
                          >
                            {day}
                          </span>
                          {hours > 0 && (
                            <span className="text-[10px] text-green-600 mt-0.5">
                              {getDisplayHours(hours)}
                            </span>
                          )}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
              {monthlyStats && (
                <div className="bg-white w-full max-w-[500px] mt-[20px] flex-1 rounded-xl shadow-md p-6 mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-pink-900">
                      Статистика за{" "}
                      {currentViewDate.toLocaleString("ru-RU", {
                        month: "long",
                        year: "numeric",
                      })}
                    </h2>
                    <button
                      onClick={() => setShowAllTimeStats(!showAllTimeStats)}
                      className="text-xs text-pink-600 hover:text-pink-700"
                    >
                      {showAllTimeStats
                        ? "Скрыть статистику за всё время"
                        : "Показать статистику за всё время"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-pink-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">Всего часов</p>
                      <p className="text-xl font-bold text-pink-600">
                        {monthlyStats.total_hours} ч
                      </p>
                    </div>
                    <div className="bg-pink-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">Сессий</p>
                      <p className="text-xl font-bold text-pink-600">
                        {monthlyStats.total_sessions}
                      </p>
                    </div>
                    <div className="bg-pink-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">Дней с учёбой</p>
                      <p className="text-xl font-bold text-pink-600">
                        {monthlyStats.days_with_study}
                      </p>
                    </div>
                    <div className="bg-pink-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">Среднее в день</p>
                      <p className="text-xl font-bold text-pink-600">
                        {monthlyStats.days_with_study > 0
                          ? (
                              monthlyStats.total_hours /
                              monthlyStats.days_with_study
                            ).toFixed(1)
                          : 0}{" "}
                        ч
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Лучший день</p>
                      <p className="text-md font-semibold text-gray-800">
                        {monthlyStats.best_day
                          ? new Date(monthlyStats.best_day).toLocaleDateString(
                              "ru-RU",
                            )
                          : "—"}
                      </p>
                      <p className="text-sm text-pink-600">
                        {monthlyStats.best_day_hours} ч
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">
                        Самая длинная сессия
                      </p>
                      <p className="text-md font-semibold text-gray-800">
                        {monthlyStats.max_duration} ч
                      </p>
                    </div>
                  </div>

                  {monthlyStats.tags && monthlyStats.tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        По предметам:
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {monthlyStats.tags.map((tag: any) => {
                          let colorInfo = colors[0];
                          const matchedColor = colors.find((c) => {
                            const tagForColor = colorTags[c.name];
                            return (
                              tagForColor === tag.tag || c.label === tag.tag
                            );
                          });
                          if (matchedColor) colorInfo = matchedColor;

                          return (
                            <div
                              key={tag.tag}
                              className={`px-3 py-1 rounded-full text-sm ${colorInfo.bg} ${colorInfo.text}`}
                            >
                              {tag.tag}: {tag.hours} ч
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {showDaySessions && (
              <div className="bg-white w-full ml-[30px] flex-1 max-h-[900px] overflow-y-auto rounded-xl shadow-md p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-pink-900">
                    Сессии за{" "}
                    {new Date(selectedDate).toLocaleDateString("ru-RU")}
                  </h2>
                  <button
                    onClick={() => setShowDaySessions(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex mb-2 ">
                  <div className="w-16 text-xs text-gray-500">Час</div>
                  <div className="flex-1 grid grid-cols-6 gap-0.1">
                    {[0, 10, 20, 30, 40, 50].map((min) => (
                      <div
                        key={min}
                        className="text-center text-xs text-gray-400"
                      >
                        {min === 0 ? "00" : min}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 max-h-[600px] overflow-y-auto">
                  {Array.from({ length: 24 }, (_, hour) => {
                    const hourNum = hour;
                    const sessionsAtHour = selectedDaySessions.filter((s) => {
                      if (!s.start_time) return false;
                      const startHour = new Date(s.start_time).getHours();
                      const endHour = s.end_time
                        ? new Date(s.end_time).getHours()
                        : startHour + 1;
                      return hourNum >= startHour && hourNum < endHour;
                    });

                    return (
                      <div
                        key={hour}
                        className="flex items-center  md-max-w-[400px] lg-max-w-[1200px] lg-max-h-[1200px] md-max-h-[500px] gap-2"
                      >
                        <div className="w-14 text-xs font-mono text-gray-500 font-medium">
                          {hour.toString().padStart(2, "0")}:00
                        </div>
                        <div className="flex-1 relative h-4 w-4">
                          <div className="absolute inset-0 grid grid-cols-6 gap-0.5">
                            {Array.from({ length: 6 }, (_, i) => {
                              const minuteStart = i * 10;
                              let activeSession = null;

                              for (const session of selectedDaySessions) {
                                const start = new Date(session.start_time);
                                const end = session.end_time
                                  ? new Date(session.end_time)
                                  : new Date(start.getTime() + 3600000);

                                const sessionStartMinutes =
                                  start.getHours() * 60 + start.getMinutes();
                                let sessionEndMinutes =
                                  end.getHours() * 60 + end.getMinutes();
                                if (sessionEndMinutes < sessionStartMinutes)
                                  sessionEndMinutes += 24 * 60;

                                const cellStartMinutes =
                                  hourNum * 60 + minuteStart;
                                const cellEndMinutes = cellStartMinutes + 10;

                                if (
                                  cellStartMinutes < sessionEndMinutes &&
                                  cellEndMinutes > sessionStartMinutes
                                ) {
                                  activeSession = session;
                                  break;
                                }
                              }

                              let colorInfo = colors[0];
                              if (activeSession) {
                                const matchedColor = colors.find((c) => {
                                  const tagForColor = colorTags[c.name];
                                  return (
                                    tagForColor === activeSession.tag ||
                                    c.label === activeSession.tag
                                  );
                                });
                                if (matchedColor) colorInfo = matchedColor;
                              }

                              return (
                                <div
                                  key={i}
                                  className="group relative h-full rounded transition cursor-pointer"
                                  onClick={() =>
                                    activeSession &&
                                    openEditDaySessionModal(activeSession)
                                  }
                                >
                                  <div
                                    className={`h-full w-full rounded ${activeSession ? colorInfo.bg : "bg-gray-50"} ${activeSession ? "border " + colorInfo.border : ""}`}
                                  />
                                  {activeSession && (
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                                      {activeSession.tag}
                                      {activeSession.description && (
                                        <span className="ml-1 text-gray-300">
                                          ({activeSession.description})
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t">
                  <h3 className="text-md font-semibold text-pink-800 mb-3">
                    Список сессий
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {selectedDaySessions.map((session) => {
                      let colorInfo = colors[0];
                      const matchedColor = colors.find((c) => {
                        const tagForColor = colorTags[c.name];
                        return (
                          tagForColor === session.tag || c.label === session.tag
                        );
                      });
                      if (matchedColor) colorInfo = matchedColor;

                      const getHexColor = (colorName: string) => {
                        const hexMap: Record<string, string> = {
                          yellow: "#eab308",
                          blue: "#3b82f6",
                          green: "#22c55e",
                          purple: "#a855f7",
                          pink: "#ec4899",
                          "dark-pink": "#db2777",
                          teal: "#14b8a6",
                          indigo: "#6366f1",
                          fuchsia: "#d946ef",
                          orange: "#f97316",
                        };
                        return hexMap[colorName] || "#eab308";
                      };

                      return (
                        <div
                          key={session.id}
                          className="rounded-lg p-3 transition-all duration-200 hover:shadow-md cursor-pointer"
                          style={{
                            backgroundColor: `${getHexColor(colorInfo.name)}15`,
                            borderLeft: `4px solid ${getHexColor(colorInfo.name)}`,
                          }}
                          onClick={() => openEditDaySessionModal(session)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor: getHexColor(
                                      colorInfo.name,
                                    ),
                                  }}
                                />
                                <span className="font-medium text-gray-800">
                                  {session.tag}
                                </span>
                              </div>
                              {session.description && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {session.description}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(
                                  session.start_time,
                                ).toLocaleTimeString()}{" "}
                                -{" "}
                                {session.end_time
                                  ? new Date(
                                      session.end_time,
                                    ).toLocaleTimeString()
                                  : "сейчас"}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-pink-600 font-medium text-sm">
                                {session.duration_hours} ч
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteDaySession(session.id);
                                }}
                                className="transition text-red-500 hover:text-red-700"
                                title="Удалить сессию"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {selectedDaySessions.length === 0 && (
                      <p className="text-gray-400 text-center py-4">
                        Нет сессий в этот день
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {showAllTimeStats && allTimeStats && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-pink-900 mb-4">
              Статистика за всё время
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-pink-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Всего часов</p>
                <p className="text-2xl font-bold text-pink-600">
                  {allTimeStats.total_hours} ч
                </p>
              </div>
              <div className="bg-pink-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Сессий</p>
                <p className="text-2xl font-bold text-pink-600">
                  {allTimeStats.total_sessions}
                </p>
              </div>
              <div className="bg-pink-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Дней с учёбой</p>
                <p className="text-2xl font-bold text-pink-600">
                  {allTimeStats.days_with_study}
                </p>
              </div>
              <div className="bg-pink-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Среднее в день</p>
                <p className="text-2xl font-bold text-pink-600">
                  {allTimeStats.days_with_study > 0
                    ? (
                        allTimeStats.total_hours / allTimeStats.days_with_study
                      ).toFixed(1)
                    : 0}{" "}
                  ч
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Лучший день</p>
                <p className="text-md font-semibold text-gray-800">
                  {allTimeStats.best_day
                    ? new Date(allTimeStats.best_day).toLocaleDateString(
                        "ru-RU",
                      )
                    : "—"}
                </p>
                <p className="text-sm text-pink-600">
                  {allTimeStats.best_day_hours} ч
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Самая длинная сессия</p>
                <p className="text-md font-semibold text-gray-800">
                  {allTimeStats.max_duration} ч
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Первая сессия</p>
                <p className="text-md font-semibold text-gray-800">
                  {allTimeStats.first_study_day
                    ? new Date(allTimeStats.first_study_day).toLocaleDateString(
                        "ru-RU",
                      )
                    : "—"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">
                  Средняя длительность сессии
                </p>
                <p className="text-md font-semibold text-gray-800">
                  {allTimeStats.avg_session_hours} ч
                </p>
              </div>
            </div>

            {allTimeStats.tags && allTimeStats.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  По предметам:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allTimeStats.tags.map((tag: any) => {
                    let colorInfo = colors[0];
                    const matchedColor = colors.find((c) => {
                      const tagForColor = colorTags[c.name];
                      return tagForColor === tag.tag || c.label === tag.tag;
                    });
                    if (matchedColor) colorInfo = matchedColor;

                    return (
                      <div
                        key={tag.tag}
                        className={`px-3 py-1 rounded-full text-sm ${colorInfo.bg} ${colorInfo.text}`}
                      >
                        {tag.tag}: {tag.hours} ч
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {showEditDaySessionModal && editingDaySession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  Редактировать сессию
                </h2>
                <button
                  onClick={() => setShowEditDaySessionModal(false)}
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
                      const isSelected = editSessionTag === displayName;
                      return (
                        <button
                          key={color.name}
                          onClick={() => setEditSessionTag(displayName)}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 ${
                            isSelected
                              ? `${color.bg} ${color.border}`
                              : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                          }`}
                        >
                          <div
                            className={`min-w-5 min-h-5 rounded-full ${color.base} shadow-sm`}
                          />
                          <span
                            className={`text-sm max-w-[200px] overflow-x-auto font-medium ${isSelected ? "text-gray-900" : "text-gray-700"}`}
                          >
                            {displayName}
                          </span>
                          {isSelected && (
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
                    value={editSessionDescription}
                    onChange={(e) => setEditSessionDescription(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                    rows={3}
                    placeholder="Что изучали? Например: глава 3, задачи на циклы..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={updateDaySession}
                    disabled={!editSessionTag}
                    className={`flex-1 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      editSessionTag
                        ? "bg-pink-600 text-white shadow-md hover:bg-pink-700"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <Check className="w-4 h-4" /> Сохранить изменения
                  </button>
                  <button
                    onClick={() => setShowEditDaySessionModal(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {showDayModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  Сессии за день
                </h3>
                <button
                  onClick={() => setShowDayModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              {selectedDaySessions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Нет сессий в этот день
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedDaySessions.map((session: any) => {
                    let colorInfo = colors[0];
                    const matchedColor = colors.find((c) => {
                      const tagForColor = colorTags[c.name];
                      return (
                        tagForColor === session.tag || c.label === session.tag
                      );
                    });
                    if (matchedColor) colorInfo = matchedColor;

                    const getHexColor = (colorName: string) => {
                      const hexMap: Record<string, string> = {
                        yellow: "#eab308",
                        blue: "#3b82f6",
                        green: "#22c55e",
                        purple: "#a855f7",
                        pink: "#ec4899",
                        "dark-pink": "#db2777",
                        teal: "#14b8a6",
                        indigo: "#6366f1",
                        fuchsia: "#d946ef",
                        orange: "#f97316",
                      };
                      return hexMap[colorName] || "#eab308";
                    };

                    return (
                      <div
                        key={session.id}
                        className="rounded-lg p-3 transition-all duration-200"
                        style={{
                          backgroundColor: `${getHexColor(colorInfo.name)}15`,
                          borderLeft: `4px solid ${getHexColor(colorInfo.name)}`,
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor: getHexColor(colorInfo.name),
                                }}
                              />
                              <span className="font-medium text-gray-800">
                                {session.tag}
                              </span>
                            </div>
                            {session.description && (
                              <p className="text-sm text-gray-500 mt-1">
                                {session.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(
                                session.start_time,
                              ).toLocaleTimeString()}{" "}
                              -{" "}
                              {session.end_time
                                ? new Date(
                                    session.end_time,
                                  ).toLocaleTimeString()
                                : "сейчас"}
                            </p>
                          </div>
                          <span className="text-pink-600 font-medium text-sm">
                            {session.duration_hours} ч
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
        {editingColorTag && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  Редактировать тег
                </h3>
                <button
                  onClick={() => setEditingColorTag(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
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
                        loadColorTags();
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

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-pink-800 mb-4">
            Статистика
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 mb-6">
            {(["week", "month", "all", "custom"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg transition ${period === p ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
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
              <p className="text-3xl font-bold text-pink-600">
                {stats?.total_hours || 0} ч
              </p>
              <p className="text-sm text-gray-500">
                {stats?.total_minutes || 0} минут
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-sm">Сессий завершено</p>
              <p className="text-3xl font-bold text-pink-600">
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
                    <Bar dataKey="hours" name="Часы">
                      {statsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6">
                <h3 className="font-medium text-pink-700 mb-3">
                  Соотношение предметов
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      dataKey="hours"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
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

        {stats?.sessions && stats.sessions.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-[30px]">
            <h2 className="text-xl font-semibold text-pink-900 mb-4">
              История сессий
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stats.sessions.map((session: any) => {
                let colorInfo = colors[0]; // yellow по умолчанию

                const matchedColor = colors.find((c) => {
                  const tagForColor = colorTags[c.name];
                  return tagForColor === session.tag || c.label === session.tag;
                });

                if (matchedColor) {
                  colorInfo = matchedColor;
                }

                const getHexColor = (colorName: string) => {
                  const hexMap: Record<string, string> = {
                    yellow: "#eab308",
                    blue: "#3b82f6",
                    green: "#22c55e",
                    purple: "#a855f7",
                    pink: "#ec4899",
                    "dark-pink": "#db2777",
                    teal: "#14b8a6",
                    indigo: "#6366f1",
                    fuchsia: "#d946ef",
                    orange: "#f97316",
                  };
                  return hexMap[colorName] || "#eab308";
                };

                return (
                  <div
                    key={session.id}
                    className="rounded-lg p-3 mb-2 transition-all duration-200 hover:shadow-md cursor-pointer"
                    style={{
                      backgroundColor: `${getHexColor(colorInfo.name)}15`,
                      borderLeft: `4px solid ${getHexColor(colorInfo.name)}`,
                    }}
                    onClick={() => openEditModal(session)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: getHexColor(colorInfo.name),
                            }}
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
                        <span className="text-pink-600 font-medium">
                          {session.duration_hours} ч
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.id);
                          }}
                          className="transition text-red-500 hover:text-red-700"
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
      {showEditModal && editingSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Редактировать сессию
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
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
                    const isSelected = selectedTag === displayName;
                    return (
                      <button
                        key={color.name}
                        onClick={() => setSelectedTag(displayName)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 ${
                          isSelected
                            ? `${color.bg} ${color.border}`
                            : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                        }`}
                      >
                        <div
                          className={`min-w-5 min-h-5 rounded-full ${color.base} shadow-sm`}
                        />
                        <span
                          className={`text-sm max-w-[200px] overflow-x-auto font-medium ${isSelected ? "text-gray-900" : "text-gray-700"}`}
                        >
                          {displayName}
                        </span>
                        {isSelected && (
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание (необязательно)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full max-w-[600px] p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition break-words whitespace-pre-wrap"
                  rows={3}
                  placeholder="Что изучали? Например: глава 3, задачи на циклы..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={updateSession}
                  disabled={!selectedTag}
                  className={`flex-1 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    selectedTag
                      ? "bg-pink-600 text-white shadow-md hover:bg-pink-700"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Check className="w-4 h-4" /> Сохранить изменения
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 ${
                          selectedTag === displayName
                            ? `${color.bg} ${color.border}`
                            : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                        }`}
                      >
                        <div
                          className={`min-w-5 min-h-5 rounded-full ${color.base} shadow-sm`}
                        />
                        <span
                          className={`text-sm max-w-[200px] overflow-x-auto font-medium ${selectedTag === displayName ? "text-gray-900" : "text-gray-700"}`}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание (необязательно)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full max-w-[600px] p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition break-words whitespace-pre-wrap"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={startTimer}
                  disabled={!selectedTag}
                  className={`flex-1 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    selectedTag
                      ? "bg-pink-600 text-white shadow-md hover:bg-pink-700"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Play className="w-4 h-4" /> Начать сессию
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
    </div>
  );
}

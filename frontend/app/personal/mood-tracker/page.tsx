"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
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

interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  mood: string;
  tags: string;
  is_favorite: boolean;
  created_at: string;
}

const moodImages: { [key: string]: string } = {
  noemotions: "/noemotions.png",
  happy: "/happy.png",
  sad: "/sad.png",
  verysad: "/verysad.png",
  angry: "/angry.png",
  stressed: "/stressed.png",
  verystressed: "/verystressed.png",
  calm: "/calm.png",
};

const moodNames: { [key: string]: string } = {
  noemotions: "Без эмоций",
  happy: "Счастлив",
  sad: "Грустный",
  verysad: "Очень грустный",
  angry: "Злой",
  stressed: "Напряженный",
  verystressed: "Очень напряженный",
  calm: "Спокойный",
};

const weekDays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

export default function MoodTrackerPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "week" | "month">("all");
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      fetchEntries();
    }
  }, [isAuthenticated, isLoading]);

  const fetchEntries = async () => {
    try {
      const response = await api.get("/diary/entries");
      setEntries(response.data);
    } catch (error) {
      console.error("Failed to fetch entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = () => {
    if (entries.length === 0) return new Date();
    const firstEntry = entries.reduce((oldest, entry) =>
      new Date(entry.created_at) < new Date(oldest.created_at) ? entry : oldest,
    );
    return new Date(firstEntry.created_at);
  };

  const generateCalendar = () => {
    const startDate = getStartDate();
    const endDate = new Date();
    const calendar: {
      date: Date;
      entry: DiaryEntry | null;
      mood: string | null;
    }[] = [];

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const entry = entries.find((e) => e.created_at.split("T")[0] === dateStr);
      calendar.push({
        date: new Date(currentDate),
        entry: entry || null,
        mood: entry?.mood || null,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return calendar;
  };

  const getMoodStats = () => {
    const stats: { [key: string]: number } = {};
    entries.forEach((entry) => {
      const mood = entry.mood || "noemotions";
      stats[mood] = (stats[mood] || 0) + 1;
    });
    return Object.entries(stats).map(([name, value]) => ({
      name: moodNames[name] || name,
      value,
      color: getMoodColor(name),
    }));
  };

  const getWeekdayStats = () => {
    const stats: { [key: string]: { [key: string]: number } } = {};
    entries.forEach((entry) => {
      const date = new Date(entry.created_at);
      const weekday = weekDays[date.getDay()];
      const mood = entry.mood || "noemotions";

      if (!stats[weekday]) stats[weekday] = {};
      stats[weekday][mood] = (stats[weekday][mood] || 0) + 1;
    });

    return weekDays.map((day) => ({
      name: day,
      ...Object.fromEntries(
        Object.entries(moodNames).map(([moodKey, moodName]) => [
          moodName,
          stats[day]?.[moodKey] || 0,
        ]),
      ),
    }));
  };

  const getCharStats = () => {
    const stats: { [key: string]: { totalChars: number; count: number } } = {};
    entries.forEach((entry) => {
      const date = new Date(entry.created_at);
      const weekday = weekDays[date.getDay()];
      const charCount =
        (entry.title?.length || 0) + (entry.content?.length || 0);

      if (!stats[weekday]) stats[weekday] = { totalChars: 0, count: 0 };
      stats[weekday].totalChars += charCount;
      stats[weekday].count += 1;
    });

    return weekDays.map((day) => ({
      name: day,
      среднее: stats[day]
        ? Math.round(stats[day].totalChars / stats[day].count)
        : 0,
    }));
  };

  const getMoodColor = (mood: string) => {
    const colors: { [key: string]: string } = {
      happy: "#fbbf24",
      sad: "#60a5fa",
      verysad: "#3b82f6",
      angry: "#ef4444",
      stressed: "#f97316",
      verystressed: "#dc2626",
      calm: "#34d399",
      noemotions: "#9ca3af",
    };
    return colors[mood] || "#9ca3af";
  };

  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    router.push(`/personal/diary?date=${dateStr}`);
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  const calendar = generateCalendar();
  const moodStats = getMoodStats();
  const weekdayStats = getWeekdayStats();
  const charStats = getCharStats();
  const totalEntries = entries.length;
  const totalChars = entries.reduce(
    (sum, e) => sum + (e.title?.length || 0) + (e.content?.length || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-pink-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Трекер настроения
        </h1>
        <p className="text-gray-600 mb-8">
          Отслеживай свои эмоции и анализируй статистику
        </p>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setFilterType("all")}
            className={`px-4 py-2 rounded-lg transition ${filterType === "all" ? "bg-pink-500 text-white" : "bg-white text-gray-700 hover:bg-pink-100"}`}
          >
            За все время
          </button>
          <button
            onClick={() => setFilterType("week")}
            className={`px-4 py-2 rounded-lg transition ${filterType === "week" ? "bg-pink-500 text-white" : "bg-white text-gray-700 hover:bg-pink-100"}`}
          >
            За неделю
          </button>
          <button
            onClick={() => setFilterType("month")}
            className={`px-4 py-2 rounded-lg transition ${filterType === "month" ? "bg-pink-500 text-white" : "bg-white text-gray-700 hover:bg-pink-100"}`}
          >
            За месяц
          </button>
        </div>

        {/* Календарь настроений */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Календарь настроений
          </h2>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center font-medium text-gray-600 py-2"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendar.map((day, idx) => (
              <button
                key={idx}
                onClick={() => handleDateClick(day.date)}
                className="aspect-square rounded-lg flex flex-col items-center justify-center p-2 transition hover:scale-105 bg-pink-50 hover:bg-pink-100"
              >
                <span className="text-sm font-medium text-gray-700">
                  {day.date.getDate()}
                </span>
                {day.mood && day.mood !== "noemotions" && (
                  <img
                    src={moodImages[day.mood]}
                    alt={day.mood}
                    className="w-6 h-6 mt-1"
                  />
                )}
              </button>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-500 text-center">
            * Кликните на день, чтобы увидеть запись за эту дату
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Распределение настроений
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={moodStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {moodStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Общая статистика
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
                <span className="text-gray-600">Всего записей:</span>
                <span className="text-2xl font-bold text-pink-600">
                  {totalEntries}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
                <span className="text-gray-600">Всего символов:</span>
                <span className="text-2xl font-bold text-pink-600">
                  {totalChars.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
                <span className="text-gray-600">Средняя длина записи:</span>
                <span className="text-2xl font-bold text-pink-600">
                  {totalEntries ? Math.round(totalChars / totalEntries) : 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Настроения по дням недели
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={weekdayStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {Object.entries(moodNames).map(([moodKey, moodName]) => (
                <Bar
                  key={moodKey}
                  dataKey={moodName}
                  stackId="a"
                  fill={getMoodColor(moodKey)}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Активность по дням недели
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={charStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="среднее"
                fill="#ec4899"
                name="Среднее количество символов"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

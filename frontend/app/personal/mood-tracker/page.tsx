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
import { ChevronLeft, ChevronRight } from "lucide-react";

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
const monthNames = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

// Функция для форматирования даты в YYYY-MM-DD (UTC)
const formatUTCDate = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Получение дня недели из UTC даты
const getRussianWeekday = (date: Date) => {
  const day = date.getUTCDay();
  return weekDays[day];
};

export default function MoodTrackerPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
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

  const prevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const firstDay = new Date(Date.UTC(year, month, 1));
    return firstDay.getUTCDay();
  };

  const generateMonthCalendar = () => {
    const year = currentDate.getUTCFullYear();
    const month = currentDate.getUTCMonth();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    // Создаем Map для быстрого поиска записей по дате
    const entriesByDate = new Map();
    entries.forEach((entry) => {
      const entryDate = new Date(entry.created_at);
      const dateKey = formatUTCDate(entryDate);
      entriesByDate.set(dateKey, entry);
    });

    const calendar = [];
    // Добавляем пустые дни в начале месяца
    for (let i = 0; i < firstDay; i++) {
      calendar.push({ date: null, entry: null, mood: null, isEmpty: true });
    }

    // Добавляем дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(Date.UTC(year, month, day));
      const dateKey = formatUTCDate(date);
      const entry = entriesByDate.get(dateKey) || null;
      calendar.push({
        date: date,
        entry: entry,
        mood: entry?.mood || null,
        isEmpty: false,
      });
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
      const weekday = getRussianWeekday(date);
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
      const weekday = getRussianWeekday(date);
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
    if (!date) return;
    const dateStr = formatUTCDate(date);
    router.push(`/personal/diary?date=${dateStr}`);
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  const calendar = generateMonthCalendar();
  const moodStats = getMoodStats();
  const weekdayStats = getWeekdayStats();
  const charStats = getCharStats();
  const totalEntries = entries.length;
  const totalChars = entries.reduce(
    (sum, e) => sum + (e.title?.length || 0) + (e.content?.length || 0),
    0,
  );

  const currentYear = currentDate.getUTCFullYear();
  const currentMonthName = monthNames[currentDate.getUTCMonth()];

  return (
    <div className="min-h-screen bg-pink-100 p-8">
      <div className="max-w-[1100px] flex flex-col mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Трекер настроения
        </h1>
        <p className="text-gray-600 mb-8">
          Отслеживай свои эмоции и анализируй статистику
        </p>

        <div className="flex lg:flex-row items-center flex-col ">
          {/* Управление месяцем */}
          <div className="flex flex-col   max-w-[500px]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {currentMonthName} {currentYear}
              </h2>

              <div className="flex gap-3">
                <button
                  onClick={prevMonth}
                  className="p-2 bg-white rounded-lg shadow hover:bg-gray-50 transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goToToday}
                  className="px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50 transition text-sm font-medium"
                >
                  Сегодня
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 bg-white rounded-lg shadow hover:bg-gray-50 transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Календарь настроений */}
            <div className="flex flex-col items-center w-full">
              <div className="bg-white rounded-lg w-[500px] shadow-md p-6 mb-8">
                <div className="grid grid-cols-7  gap-2 mb-2">
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="text-center w-[58px] h-[58px] font-medium text-gray-600 py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {calendar.map((day, idx) => {
                    if (day.isEmpty) {
                      return (
                        <div
                          key={idx}
                          className="aspect-square w-[60px] h-[60px] rounded-lg "
                        />
                      );
                    }

                    const dayNumber = day.date.getUTCDate();
                    const weekday = getRussianWeekday(day.date);
                    const hasEntry = day.entry !== null;
                    const mood = day.mood;
                    const isToday =
                      formatUTCDate(day.date) === formatUTCDate(new Date());

                    return (
                      <button
                        key={idx}
                        onClick={() => handleDateClick(day.date)}
                        className={`aspect-square rounded-lg w-[58px] h-[58px] flex flex-col items-center justify-center p-0 transition hover:scale-105 ${
                          hasEntry
                            ? "bg-pink-100 hover:bg-pink-200"
                            : " hover:bg-pink-100"
                        } ${isToday ? "ring-2 ring-pink-300" : ""}`}
                      >
                        {!mood && (
                          <span
                            className={`text-sm font-medium ${hasEntry ? "text-pink-700" : "text-gray-700"}`}
                          >
                            {dayNumber}
                          </span>
                        )}
                        {mood && (
                          <img
                            src={moodImages[mood]}
                            alt={mood}
                            className="w-9 h-9 mt-1"
                          />
                        )}
                        {hasEntry && !mood && (
                          <div className="w-8 h-8 mt-1 flex items-center justify-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 text-sm text-gray-500 text-center">
                  * Кликните на день, чтобы увидеть запись за эту дату
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-8 mb-8  lg:ml-[30px] lg:w-full">
            <div className="bg-white rounded-lg w-full shadow-md p-6">
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
        </div>
        <div className="flex flex-col">
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

"use client";
import Loading from "@/components/Loading";
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

type DateFilter = "all" | "week" | "month";

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

// Фильтрация записей по дате
const filterEntriesByDate = (entries: DiaryEntry[], filter: DateFilter) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filter) {
    case "week":
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      return entries.filter((entry) => {
        const entryDate = new Date(entry.created_at);
        return entryDate >= weekAgo;
      });
    case "month":
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      return entries.filter((entry) => {
        const entryDate = new Date(entry.created_at);
        return entryDate >= monthAgo;
      });
    default:
      return entries;
  }
};

export default function MoodTrackerPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
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

  useEffect(() => {
    setFilteredEntries(filterEntriesByDate(entries, dateFilter));
  }, [entries, dateFilter]);

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

    const entriesByDate = new Map();
    entries.forEach((entry) => {
      const entryDate = new Date(entry.created_at);
      const dateKey = formatUTCDate(entryDate);
      entriesByDate.set(dateKey, entry);
    });

    const calendar = [];
    for (let i = 0; i < firstDay; i++) {
      calendar.push({ date: null, entry: null, mood: null, isEmpty: true });
    }

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
    filteredEntries.forEach((entry) => {
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
    filteredEntries.forEach((entry) => {
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
    filteredEntries.forEach((entry) => {
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

  // Новая функция для статистики настроений по типам
  const getMoodDistributionStats = () => {
    const stats: { [key: string]: number } = {};
    filteredEntries.forEach((entry) => {
      const mood = entry.mood || "noemotions";
      stats[mood] = (stats[mood] || 0) + 1;
    });

    return Object.entries(moodNames).map(([moodKey, moodName]) => ({
      name: moodName,
      count: stats[moodKey] || 0,
      color: getMoodColor(moodKey),
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

  const getMostCommonMood = () => {
    const stats: { [key: string]: number } = {};
    filteredEntries.forEach((entry) => {
      const mood = entry.mood || "noemotions";
      stats[mood] = (stats[mood] || 0) + 1;
    });

    let maxMood = null;
    let maxCount = 0;
    for (const [mood, count] of Object.entries(stats)) {
      if (count > maxCount) {
        maxCount = count;
        maxMood = mood;
      }
    }

    return maxMood ? { name: moodNames[maxMood], count: maxCount } : null;
  };

  const getFirstEntryDate = () => {
    if (filteredEntries.length === 0) return null;
    const dates = filteredEntries.map((e) => new Date(e.created_at));
    const firstDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    return `${firstDate.getDate()} ${monthNames[firstDate.getMonth()]}`;
  };

  const handleDateClick = (date: Date) => {
    if (!date) return;
    const dateStr = formatUTCDate(date);
    router.push(`/personal/diary?date=${dateStr}`);
  };
  const getMoodImage = (mood: string) => {
    return moodImages[mood] || "/noemotions.png";
  };
  if (isLoading || loading) {
    return <Loading></Loading>;
  }

  const calendar = generateMonthCalendar();
  const moodStats = getMoodStats();
  const weekdayStats = getWeekdayStats();
  const charStats = getCharStats();
  const moodDistributionStats = getMoodDistributionStats();
  const mostCommonMood = getMostCommonMood();
  const firstEntryDate = getFirstEntryDate();
  const totalEntries = filteredEntries.length;
  const totalChars = filteredEntries.reduce(
    (sum, e) => sum + (e.title?.length || 0) + (e.content?.length || 0),
    0,
  );

  const currentYear = currentDate.getUTCFullYear();
  const currentMonthName = monthNames[currentDate.getUTCMonth()];

  return (
    <div className="min-h-screen bg-pink-100 py-8 px-4 sm:px-8">
      <div className="max-w-[1100px] flex flex-col mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Трекер настроения
        </h1>
        <p className="text-gray-600 mb-8">
          Отслеживай свои эмоции и анализируй статистику
        </p>

        {/* Фильтр по дате */}
        <div className="flex gap-3 mb-3">
          <button
            onClick={() => setDateFilter("all")}
            className={`px-4 py-2 rounded-lg transition ${
              dateFilter === "all"
                ? "bg-pink-500 text-white"
                : "bg-white text-gray-700 hover:bg-pink-100"
            }`}
          >
            За всё время
          </button>
          <button
            onClick={() => setDateFilter("month")}
            className={`px-4 py-2 rounded-lg transition ${
              dateFilter === "month"
                ? "bg-pink-500 text-white"
                : "bg-white text-gray-700 hover:bg-pink-100"
            }`}
          >
            За месяц
          </button>
          <button
            onClick={() => setDateFilter("week")}
            className={`px-4 py-2 rounded-lg transition ${
              dateFilter === "week"
                ? "bg-pink-500 text-white"
                : "bg-white text-gray-700 hover:bg-pink-100"
            }`}
          >
            За неделю
          </button>
        </div>
        <p className="text-sm text-pink-500 ml-2 mb-5">
          * Фильтр применяется ко всем графикам и записям
        </p>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <p className="text-gray-500 text-sm">Записей в дневнике</p>
            <p className="text-2xl font-bold text-pink-600">{totalEntries}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <p className="text-gray-500 text-sm">Всего символов</p>
            <p className="text-2xl font-bold text-pink-600">
              {totalChars.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <p className="text-gray-500 text-sm">Средняя длина записи</p>
            <p className="text-2xl font-bold text-pink-600">
              {totalEntries ? Math.round(totalChars / totalEntries) : 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <p className="text-gray-500 text-sm">Самое частое настроение</p>
            <p className="text-2xl font-bold text-pink-600">
              {mostCommonMood ? `${mostCommonMood.name} ` : "—"}
            </p>
          </div>
        </div>

        <div className="flex lg:flex-row items-center flex-col ">
          <div className="flex flex-col max-w-[500px]">
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

            <div className="flex flex-col items-center w-full">
              <div className="bg-white rounded-lg sm:w-[500px] w-[350px] shadow-md p-4 mb-8">
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="text-center sm:w-[58px] sm:h-[58px] w-[40px] h-[40px] font-medium text-gray-600 py-2"
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
                          className="aspect-square sm:w-[60px] sm:h-[60px] w-[40px] h-[40px] rounded-lg "
                        />
                      );
                    }

                    const dayNumber = day.date.getUTCDate();
                    const hasEntry = day.entry !== null;
                    const mood = day.mood;
                    const isToday =
                      formatUTCDate(day.date) === formatUTCDate(new Date());

                    return (
                      <button
                        key={idx}
                        onClick={() => handleDateClick(day.date)}
                        className={`aspect-square rounded-lg sm:w-[58px] sm:h-[58px] w-[40px] h-[40px] flex flex-col items-center justify-center p-0 transition hover:scale-105 ${
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
          <div className="grid grid-cols-1 gap-8 mb-8 lg:ml-[30px] lg:w-full"></div>
        </div>

        <div className="bg-white rounded-lg w-full text-xs shadow-md my-[30px] p-6">
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

        <div className="bg-white rounded-lg shadow-md text-xs p-1 sm:p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 p-6 sm:p-0 mb-4">
            Статистика настроений по типам
          </h2>
          <ResponsiveContainer
            className="ml-[-40px] w-full w-[110%]"
            height={400}
          >
            <BarChart data={moodDistributionStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={({ x, y, payload }) => {
                  const moodKey = Object.keys(moodNames).find(
                    (key) => moodNames[key] === payload.value,
                  );
                  const imageSrc = moodKey
                    ? getMoodImage(moodKey)
                    : "/noemotions.png";
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <image
                        href={imageSrc}
                        x={-15}
                        y={0}
                        width={30}
                        height={30}
                        className="object-contain"
                      />
                    </g>
                  );
                }}
                height={50}
                interval={0}
              />
              <YAxis
                domain={[0, "dataMax"]}
                tickCount={
                  Math.max(...moodDistributionStats.map((s) => s.count), 1) + 1
                }
                allowDecimals={false}
                tickFormatter={(value) => Math.floor(value).toString()}
              />
              <Tooltip
                formatter={(value) => [Math.floor(value), "записей"]}
                labelFormatter={(label) => {
                  const moodKey = Object.keys(moodNames).find(
                    (key) => moodNames[key] === label,
                  );
                  return moodKey ? moodNames[moodKey] : label;
                }}
              />
              <Bar dataKey="count" fill="#ec4899" name="Количество записей">
                {moodDistributionStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col">
          <div className="bg-white rounded-lg text-xs shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Настроение по дням недели
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
        <div className="bg-white rounded-lg text-xs shadow-md p-6">
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

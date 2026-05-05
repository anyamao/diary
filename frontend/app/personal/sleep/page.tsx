"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface SleepRecord {
  id: string;
  date: string;
  segments: Array<{ start: string; end: string }>;
  notes: string;
}

interface SleepNote {
  id: string;
  title: string;
  content: string;
  dream_type: string | null;
  wake_mood: string | null;
  tags: string[];
  created_at: string;
  sleep_record_id: string;
}

const weekDays = [
  "Воскресенье",
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
];
const shortWeekDays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

export default function SleepPage() {
  const [records, setRecords] = useState<SleepRecord[]>([]);
  const [allNotes, setAllNotes] = useState<SleepNote[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<SleepRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<
    "week" | "month" | "year" | "custom"
  >("week");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showCustomFilter, setShowCustomFilter] = useState(false);
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    filterRecords();
  }, [records, filterType, customStartDate, customEndDate]);

  const fetchAllData = async () => {
    try {
      const [recordsRes, notesRes] = await Promise.all([
        api.get("/sleep/records"),
        api.get("/sleep-notes/all"),
      ]);
      setRecords(recordsRes.data);
      setAllNotes(notesRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = [...records];
    const now = new Date();

    if (filterType === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      filtered = filtered.filter((r) => new Date(r.date) >= weekAgo);
    } else if (filterType === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      filtered = filtered.filter((r) => new Date(r.date) >= monthAgo);
    } else if (filterType === "year") {
      const yearAgo = new Date();
      yearAgo.setFullYear(now.getFullYear() - 1);
      filtered = filtered.filter((r) => new Date(r.date) >= yearAgo);
    } else if (filterType === "custom" && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      filtered = filtered.filter((r) => {
        const date = new Date(r.date);
        return date >= start && date <= end;
      });
    }

    setFilteredRecords(filtered);
  };

  const calculateTotalSleep = (
    segments: Array<{ start: string; end: string }>,
  ) => {
    let total = 0;
    segments.forEach((seg) => {
      const [startHour, startMin] = seg.start.split(":").map(Number);
      let [endHour, endMin] = seg.end.split(":").map(Number);
      let startTotal = startHour + startMin / 60;
      let endTotal = endHour + endMin / 60;
      if (endTotal < startTotal) endTotal += 24;
      total += endTotal - startTotal;
    });
    return total;
  };

  const getNormalizedHour = (hour: number) => {
    if (hour >= 24) return hour - 24;
    return hour;
  };

  const getSleepStats = () => {
    let totalDuration = 0;
    let totalBedtime = 0;
    let totalWakeTime = 0;
    let count = 0;

    filteredRecords.forEach((record) => {
      if (record.segments && record.segments.length > 0) {
        const duration = calculateTotalSleep(record.segments);
        totalDuration += duration;

        const firstSegment = record.segments[0];
        if (firstSegment) {
          let startHour = parseInt(firstSegment.start.split(":")[0]);
          let endHour = parseInt(firstSegment.end.split(":")[0]);
          if (endHour <= startHour) endHour += 24;
          totalBedtime += startHour;
          totalWakeTime += endHour;
        }
        count++;
      }
    });

    return {
      avgDuration: count ? (totalDuration / count).toFixed(1) : "0",
      avgBedtime: count
        ? getNormalizedHour(totalBedtime / count).toFixed(1)
        : "0",
      avgWakeTime: count
        ? getNormalizedHour(totalWakeTime / count).toFixed(1)
        : "0",
    };
  };

  const getTrendData = () => {
    return filteredRecords
      .map((record) => {
        const firstSegment = record.segments?.[0];
        let startHour = firstSegment
          ? parseInt(firstSegment.start.split(":")[0])
          : 0;
        let endHour = firstSegment
          ? parseInt(firstSegment.end.split(":")[0])
          : 0;
        if (endHour <= startHour) endHour += 24;

        const date = new Date(record.date);
        return {
          date: date.getTime(),
          label: `${date.getDate()}.${date.getMonth() + 1}`,
          bedtime: startHour,
          waketime: getNormalizedHour(endHour),
          weekday: shortWeekDays[date.getDay()],
        };
      })
      .sort((a, b) => a.date - b.date);
  };

  const getSleepSchedule = () => {
    const stats: {
      [key: string]: { bedtime: number; waketime: number; count: number };
    } = {};

    filteredRecords.forEach((record) => {
      const date = new Date(record.date);
      const weekday = weekDays[date.getDay()];
      const firstSegment = record.segments?.[0];

      if (firstSegment) {
        if (!stats[weekday])
          stats[weekday] = { bedtime: 0, waketime: 0, count: 0 };
        let startHour = parseInt(firstSegment.start.split(":")[0]);
        let endHour = parseInt(firstSegment.end.split(":")[0]);
        if (endHour <= startHour) endHour += 24;
        stats[weekday].bedtime += startHour;
        stats[weekday].waketime += endHour;
        stats[weekday].count++;
      }
    });

    return weekDays.map((day) => ({
      name: day,
      bedtime: stats[day]
        ? getNormalizedHour(stats[day].bedtime / stats[day].count).toFixed(1)
        : 0,
      waketime: stats[day]
        ? getNormalizedHour(stats[day].waketime / stats[day].count).toFixed(1)
        : 0,
    }));
  };

  // Функция для отрисовки полосок сна с добавлением иконки типа сна
  const getDreamTypeForRecord = (recordId: string) => {
    const notes = allNotes.filter((n) => n.sleep_record_id === recordId);
    const types = [...new Set(notes.map((n) => n.dream_type).filter((t) => t))];
    return types;
  };

  const getDreamTypeEmoji = (type: string | null) => {
    const types: Record<string, string> = {
      nightmare: "😨",
      love: "❤️",
      sad: "😢",
      happy: "😊",
    };
    return types[type || ""] || "😴";
  };

  // Статистика по типам снов
  const getDreamTypeStats = () => {
    const stats: Record<string, number> = {};
    allNotes.forEach((note) => {
      const type = note.dream_type || "normal";
      stats[type] = (stats[type] || 0) + 1;
    });

    const typeNames: Record<string, string> = {
      nightmare: "Кошмары",
      normal: "Обычные",
      love: "Любовные",
      sad: "Грустные",
      happy: "Счастливые",
    };

    const colors: Record<string, string> = {
      nightmare: "#ef4444",
      normal: "#9ca3af",
      love: "#ec4899",
      sad: "#3b82f6",
      happy: "#fbbf24",
    };

    return Object.entries(stats).map(([type, count]) => ({
      name: typeNames[type] || type,
      value: count,
      color: colors[type] || "#8884d8",
    }));
  };

  // Статистика по тегам
  const getTagStats = () => {
    const tagCount: Record<string, number> = {};
    allNotes.forEach((note) => {
      note.tags?.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  };

  // Статистика по настроению после пробуждения
  const getWakeMoodStats = () => {
    const stats: Record<string, number> = {};
    allNotes.forEach((note) => {
      const mood = note.wake_mood || "neutral";
      stats[mood] = (stats[mood] || 0) + 1;
    });

    const moodNames: Record<string, string> = {
      sad: "Грустное",
      happy: "Веселое",
      scared: "В ужасе",
      neutral: "Обычное",
    };

    const colors: Record<string, string> = {
      sad: "#3b82f6",
      happy: "#fbbf24",
      scared: "#ef4444",
      neutral: "#9ca3af",
    };

    return Object.entries(stats).map(([mood, count]) => ({
      name: moodNames[mood] || mood,
      value: count,
      color: colors[mood] || "#8884d8",
    }));
  };

  const renderSleepBar = (segments: Array<{ start: string; end: string }>) => {
    const bars = [];
    for (const seg of segments) {
      const [startHour, startMin] = seg.start.split(":").map(Number);
      let [endHour, endMin] = seg.end.split(":").map(Number);
      let startTotal = startHour + startMin / 60;
      let endTotal = endHour + endMin / 60;

      if (endTotal < startTotal) {
        const leftPercent1 = (startTotal / 24) * 100;
        const widthPercent1 = ((24 - startTotal) / 24) * 100;
        bars.push(
          <div
            key={`${startTotal}-24`}
            className="absolute h-full bg-blue-500 rounded-l-full"
            style={{
              left: `${leftPercent1}%`,
              width: `${widthPercent1}%`,
            }}
          />,
        );

        const leftPercent2 = 0;
        const widthPercent2 = (endTotal / 24) * 100;
        bars.push(
          <div
            key={`0-${endTotal}`}
            className="absolute h-full bg-blue-500 rounded-r-full"
            style={{
              left: `${leftPercent2}%`,
              width: `${widthPercent2}%`,
            }}
          />,
        );
      } else {
        const leftPercent = (startTotal / 24) * 100;
        const widthPercent = ((endTotal - startTotal) / 24) * 100;
        bars.push(
          <div
            key={`${startTotal}-${endTotal}`}
            className="absolute h-full bg-blue-500 rounded-full"
            style={{
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
            }}
          />,
        );
      }
    }
    return bars;
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  const stats = getSleepStats();
  const trendData = getTrendData();
  const sleepSchedule = getSleepSchedule();
  const dreamTypeStats = getDreamTypeStats();
  const tagStats = getTagStats();
  const wakeMoodStats = getWakeMoodStats();
  const totalNotes = allNotes.length;

  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Трекер сна
            </h1>
            <p className="text-gray-600">Отслеживай свой сон и улучшай режим</p>
          </div>
          <Link
            href="/personal/sleep/add"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            + Добавить запись
          </Link>
        </div>

        {/* Фильтры */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => {
              setFilterType("week");
              setShowCustomFilter(false);
            }}
            className={`px-4 py-2 rounded-lg transition ${filterType === "week" ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-blue-100"}`}
          >
            За неделю
          </button>
          <button
            onClick={() => {
              setFilterType("month");
              setShowCustomFilter(false);
            }}
            className={`px-4 py-2 rounded-lg transition ${filterType === "month" ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-blue-100"}`}
          >
            За месяц
          </button>
          <button
            onClick={() => {
              setFilterType("year");
              setShowCustomFilter(false);
            }}
            className={`px-4 py-2 rounded-lg transition ${filterType === "year" ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-blue-100"}`}
          >
            За год
          </button>
          <button
            onClick={() => {
              setFilterType("custom");
              setShowCustomFilter(true);
            }}
            className={`px-4 py-2 rounded-lg transition ${filterType === "custom" ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-blue-100"}`}
          >
            Свой период
          </button>
        </div>

        {showCustomFilter && (
          <div className="bg-white rounded-lg p-4 mb-6 flex gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">С</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">По</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="p-2 border rounded"
              />
            </div>
          </div>
        )}

        {/* Статистика */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <p className="text-gray-500 text-sm">Записей о сне</p>
            <p className="text-2xl font-bold text-blue-600">
              {filteredRecords.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <p className="text-gray-500 text-sm">Заметок о снах</p>
            <p className="text-2xl font-bold text-blue-600">{totalNotes}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <p className="text-gray-500 text-sm">Средняя продолжительность</p>
            <p className="text-2xl font-bold text-blue-600">
              {stats.avgDuration} ч
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <p className="text-gray-500 text-sm">Средний отход/пробуждение</p>
            <p className="text-sm font-bold text-blue-600">
              {stats.avgBedtime}:00 / {stats.avgWakeTime}:00
            </p>
          </div>
        </div>

        {/* График динамики отхода ко сну и пробуждения */}
        {trendData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Динамика режима сна
            </h2>
            <div className="text-sm text-gray-500 mb-2">
              <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1"></span>{" "}
              Синий - время отхода ко сну (ч)
              <span className="inline-block w-3 h-3 bg-red-500 rounded-full ml-3 mr-1"></span>{" "}
              Красный - время пробуждения (ч)
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis domain={[0, 24]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="bedtime"
                  stroke="#3b82f6"
                  name="Время отхода ко сну (ч)"
                />
                <Line
                  type="monotone"
                  dataKey="waketime"
                  stroke="#ef4444"
                  name="Время пробуждения (ч)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Типы снов - круговая диаграмма */}
        {dreamTypeStats.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Типы снов
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={dreamTypeStats}
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
                      {dreamTypeStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="font-medium mb-2">Детализация:</h3>
                <div className="space-y-2">
                  {dreamTypeStats.map((stat) => (
                    <div
                      key={stat.name}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: stat.color }}
                        />
                        <span>{stat.name}</span>
                      </div>
                      <span className="font-semibold">{stat.value} раз</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Самые частые теги */}
        {tagStats.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Самые частые элементы снов
            </h2>
            <div className="flex flex-wrap gap-3">
              {tagStats.map(({ tag, count }) => (
                <div
                  key={tag}
                  className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg"
                >
                  #{tag} <span className="font-bold ml-1">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Настроение после пробуждения */}
        {wakeMoodStats.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Настроение после пробуждения
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={wakeMoodStats}
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
                  {wakeMoodStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* График расписания сна по дням недели */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Режим сна по дням недели
          </h2>
          <div className="text-sm text-gray-500 mb-2">
            <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1"></span>{" "}
            Синий - отход ко сну (ч)
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full ml-3 mr-1"></span>{" "}
            Красный - пробуждение (ч)
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sleepSchedule}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={45} textAnchor="start" height={80} />
              <YAxis domain={[0, 24]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="bedtime" fill="#3b82f6" name="Отход ко сну (ч)" />
              <Bar dataKey="waketime" fill="#ef4444" name="Пробуждение (ч)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Список записей */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Записи о сне
          </h2>
          <div className="space-y-4">
            {filteredRecords.map((record) => {
              const date = new Date(record.date);
              const weekday = weekDays[date.getDay()];
              const totalHours = calculateTotalSleep(record.segments);
              const dreamTypes = getDreamTypeForRecord(record.id);

              return (
                <Link
                  key={record.id}
                  href={`/personal/sleep/${record.date.split("T")[0]}`}
                  className="block border border-gray-200 rounded-lg p-4 hover:bg-blue-50 transition"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="font-medium text-gray-800">
                        {date.getDate()}{" "}
                        {date.toLocaleString("ru", { month: "long" })}{" "}
                        {date.getFullYear()}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        ({weekday})
                      </span>
                      {dreamTypes.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {dreamTypes.map((type) => (
                            <span key={type} className="text-sm" title={type}>
                              {getDreamTypeEmoji(type)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-blue-600 font-medium">
                      {totalHours.toFixed(1)} часов
                    </span>
                  </div>

                  {/* Визуализация сна - правильные полоски для пересекающих полночь */}
                  <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden mt-2">
                    {renderSleepBar(record.segments)}
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>00:00</span>
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>24:00</span>
                  </div>

                  {record.notes && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-1">
                      {record.notes}
                    </p>
                  )}
                </Link>
              );
            })}
            {filteredRecords.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                Нет записей о сне за выбранный период
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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
import { showToast } from "@/components/Toast";
import { showConfirm } from "@/components/ConfirmDialog";
import { Trash2 } from "lucide-react";

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

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const fullWeekDays = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];

// Типы снов с PNG иконками
const dreamTypes = {
  noemotions: {
    name: "Без эмоций",
    image: "/noemotionsdream.png",
    color: "#9ca3af",
  },
  sad: { name: "Грустный", image: "/sad.png", color: "#3b82f6" },
  romantic: { name: "Любовный", image: "/romantic.png", color: "#ec4899" },
  nightmare: { name: "Кошмар", image: "/nightmare.png", color: "#ef4444" },
  love: { name: "Любовный сон", image: "/romantic.png", color: "#ec4899" },
  good: { name: "Хороший", image: "/gooddream.png", color: "#10b981" },
};

export default function SleepPage() {
  const [records, setRecords] = useState<SleepRecord[]>([]);
  const [allNotes, setAllNotes] = useState<SleepNote[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<SleepRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<
    "week" | "month" | "all" | "custom"
  >("all");
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
      showToast("Ошибка загрузки данных", "error");
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

  const getWeekdayTableData = () => {
    const weekdayStats: {
      [key: string]: {
        totalDuration: number;
        totalBedtime: number;
        totalWakeTime: number;
        dreamTypeCount: { [key: string]: number };
        count: number;
      };
    } = {};

    filteredRecords.forEach((record) => {
      const date = new Date(record.date);
      const weekday = weekDays[date.getDay() === 0 ? 6 : date.getDay() - 1];
      const duration = calculateTotalSleep(record.segments);
      const firstSegment = record.segments[0];

      if (!weekdayStats[weekday]) {
        weekdayStats[weekday] = {
          totalDuration: 0,
          totalBedtime: 0,
          totalWakeTime: 0,
          dreamTypeCount: {},
          count: 0,
        };
      }

      weekdayStats[weekday].totalDuration += duration;
      weekdayStats[weekday].count++;

      if (firstSegment) {
        let startHour = parseInt(firstSegment.start.split(":")[0]);
        let endHour = parseInt(firstSegment.end.split(":")[0]);
        if (endHour <= startHour) endHour += 24;
        weekdayStats[weekday].totalBedtime += startHour;
        weekdayStats[weekday].totalWakeTime += endHour;
      }

      const dayNotes = allNotes.filter((n) => n.sleep_record_id === record.id);
      dayNotes.forEach((note) => {
        if (note.dream_type) {
          weekdayStats[weekday].dreamTypeCount[note.dream_type] =
            (weekdayStats[weekday].dreamTypeCount[note.dream_type] || 0) + 1;
        }
      });
    });

    return weekDays.map((day) => {
      const stats = weekdayStats[day];
      if (!stats) {
        return {
          day,
          avgDuration: 0,
          avgBedtime: 0,
          avgWakeTime: 0,
          mostCommonDream: "Нет данных",
        };
      }

      const mostCommonDream = Object.entries(stats.dreamTypeCount).sort(
        (a, b) => b[1] - a[1],
      )[0];
      return {
        day,
        avgDuration: (stats.totalDuration / stats.count).toFixed(1),
        avgBedtime: getNormalizedHour(stats.totalBedtime / stats.count).toFixed(
          1,
        ),
        avgWakeTime: getNormalizedHour(
          stats.totalWakeTime / stats.count,
        ).toFixed(1),
        mostCommonDream: mostCommonDream
          ? dreamTypes[mostCommonDream[0] as keyof typeof dreamTypes]?.name ||
            mostCommonDream[0]
          : "Нет данных",
      };
    });
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
        const duration = calculateTotalSleep(record.segments);
        return {
          date: date.getTime(),
          label: `${date.getDate()}.${date.getMonth() + 1}`,
          bedtime: startHour,
          waketime: getNormalizedHour(endHour),
          duration: duration.toFixed(1),
        };
      })
      .sort((a, b) => a.date - b.date);
  };

  const getDreamTypeStats = () => {
    const stats: Record<string, number> = {};
    allNotes.forEach((note) => {
      const type = note.dream_type || "noemotions";
      stats[type] = (stats[type] || 0) + 1;
    });

    return Object.entries(stats).map(([type, count]) => ({
      name: dreamTypes[type as keyof typeof dreamTypes]?.name || type,
      value: count,
      color: dreamTypes[type as keyof typeof dreamTypes]?.color || "#8884d8",
      image: dreamTypes[type as keyof typeof dreamTypes]?.image,
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
        bars.push(
          <div
            key={`${startTotal}-24`}
            className="absolute h-full bg-purple-500 rounded-l-lg"
            style={{
              left: `${(startTotal / 24) * 100}%`,
              width: `${((24 - startTotal) / 24) * 100}%`,
            }}
          />,
        );
        bars.push(
          <div
            key={`0-${endTotal}`}
            className="absolute h-full bg-purple-500 rounded-r-lg"
            style={{
              left: "0%",
              width: `${(endTotal / 24) * 100}%`,
            }}
          />,
        );
      } else {
        bars.push(
          <div
            key={`${startTotal}-${endTotal}`}
            className="absolute h-full bg-purple-500 rounded-lg"
            style={{
              left: `${(startTotal / 24) * 100}%`,
              width: `${((endTotal - startTotal) / 24) * 100}%`,
            }}
          />,
        );
      }
    }
    return bars;
  };

  const handleDeleteRecord = async (recordId: string, date: string) => {
    const confirmed = await showConfirm(
      "Удалить запись о сне?",
      `Вы уверены, что хотите удалить запись о сне за ${date}?`,
      "danger",
    );

    if (confirmed) {
      try {
        await api.delete(`/sleep/records/${date}`);
        showToast("Запись о сне успешно удалена!", "success");
        await fetchAllData();
      } catch (error) {
        console.error("Failed to delete record:", error);
        showToast("Ошибка при удалении записи", "error");
      }
    }
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
  const weekdayTableData = getWeekdayTableData();
  const dreamTypeStats = getDreamTypeStats();

  return (
    <div className="h-full w-full min-h-[1200px] flex flex-col items-center bg-pink-50 p-8">
      <div className="max-w-[1100px]">
        <div className="flex justify-between items-center   mb-8">
          <div>
            <h1 className="text-3xl font-bold text-pink-950 mb-2">
              Трекер сна
            </h1>
            <p className="text-gray-600">Отслеживай свой сон и улучшай режим</p>
          </div>
          <Link
            href="/personal/sleep/add"
            className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition"
          >
            + Добавить запись
          </Link>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          {(["all", "week", "month", "custom"] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                setFilterType(type);
                setShowCustomFilter(type === "custom");
              }}
              className={`px-4 py-2 rounded-lg transition ${
                filterType === type
                  ? "bg-purple-500 text-white hover:bg-purple-600"
                  : "bg-white text-gray-700 hover:bg-purple-200"
              }`}
            >
              {type === "week"
                ? "За неделю"
                : type === "month"
                  ? "За месяц"
                  : type === "all"
                    ? "За все время"
                    : "Свой период"}
            </button>
          ))}
          <p className="text-sm text-pink-500 ml-2">
            * Фильтр применяется ко всем графикам и записям
          </p>
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
            <p className="text-2xl font-bold text-pink-600">
              {filteredRecords.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <p className="text-gray-500 text-sm">Средняя продолжительность</p>
            <p className="text-2xl font-bold text-pink-600">
              {stats.avgDuration} ч
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <p className="text-gray-500 text-sm">Средний отход ко сну</p>
            <p className="text-2xl font-bold text-pink-600">
              {stats.avgBedtime}:00
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <p className="text-gray-500 text-sm">Среднее пробуждение</p>
            <p className="text-2xl font-bold text-pink-600">
              {stats.avgWakeTime}:00
            </p>
          </div>
        </div>
        <div className="   mb-[40px] ">
          <h2 className="text-xl font-semibold text-pink-950 mb-4">
            Записи о сне
          </h2>
          <div className="space-y-4">
            {filteredRecords.map((record) => {
              const date = new Date(record.date);
              const totalHours = calculateTotalSleep(record.segments);
              const dayNotes = allNotes.filter(
                (n) => n.sleep_record_id === record.id,
              );
              const dreamTypesList = [
                ...new Set(dayNotes.map((n) => n.dream_type).filter((t) => t)),
              ];

              return (
                <div
                  key={record.id}
                  onClick={() =>
                    router.push(`/personal/sleep/${record.date.split("T")[0]}`)
                  }
                  className="block bg-white border border-pink-300 rounded-lg p-4 shadow-sm hover:shadow-md cursor-pointer transition"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-row items-center mb-[5px]">
                          {dreamTypesList.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {dreamTypesList.map((type) => (
                                <img
                                  key={type}
                                  src={
                                    dreamTypes[type as keyof typeof dreamTypes]
                                      ?.image
                                  }
                                  alt={type}
                                  className="w-10 h-10"
                                  title={
                                    dreamTypes[type as keyof typeof dreamTypes]
                                      ?.name
                                  }
                                />
                              ))}
                            </div>
                          )}

                          <span className="font-medium ml-[10px] text-pink-800">
                            {date.getDate()}{" "}
                            {date.toLocaleString("ru", { month: "long" })}{" "}
                            {date.getFullYear()}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            (
                            {
                              fullWeekDays[
                                date.getDay() === 0 ? 6 : date.getDay() - 1
                              ]
                            }
                            )
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-pink-900 font-medium ml-4">
                      {totalHours.toFixed(1)} ч
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRecord(
                          record.id,
                          record.date.split("T")[0],
                        );
                      }}
                      className="text-red-500 ml-[10px] transition p-1 hover:bg-pink-50 rounded"
                      title="Удалить запись"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="relative h-7 my-[10px] bg-gray-100 rounded-lg overflow-hidden mt-2">
                    {renderSleepBar(record.segments)}
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>00:00</span>
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>24:00</span>
                  </div>
                </div>
              );
            })}
            {filteredRecords.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                Нет записей о сне за выбранный период
              </p>
            )}
          </div>
        </div>
        {/* Таблица по дням недели */}
        <div className="bg-white hidden md:block rounded-lg shadow-md mt-[20px] p-6 mb-8">
          <h2 className="text-xl font-semibold text-pink-950 mb-4">
            Статистика по дням недели
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full ">
              <thead>
                <tr className=" text-md text-pink-950">
                  <th className="  px-4 py-2 text-left text-md border-r-[1px] border-pink-200">
                    День недели
                  </th>
                  <th className=" px-4 py-2 text-center   border-r-[1px] border-pink-200">
                    Средняя продолжительность (ч)
                  </th>
                  <th className="mx-[10px] px-4 py-2 text-center  border-r-[1px] border-pink-200">
                    Среднее время отхода
                  </th>
                  <th className=" px-4 py-2 text-center     border-r-[1px] border-pink-200">
                    Среднее время пробуждения
                  </th>
                  <th className="  px-4 py-2 text-center    ">
                    Самый частый тип сна
                  </th>
                </tr>
              </thead>
              <tbody>
                {weekdayTableData.map((row) => (
                  <tr
                    key={row.day}
                    className="hover:bg-pink-50 text-gray-700 hover:text-pink-700"
                  >
                    <td className="border-y-[1px] border-r-[1px] border-pink-300 px-4 py-2 font-medium">
                      {row.day}
                    </td>
                    <td className="  border-y-[1px] border-r-[1px] border-pink-300 px-4 py-2 text-center">
                      {row.avgDuration} ч
                    </td>
                    <td className="  border-y-[1px] border-r-[1px] border-pink-300 px-4 py-2 text-center">
                      {row.avgBedtime}:00
                    </td>
                    <td className=" border-y-[1px] border-r-[1px] border-pink-300   px-4 py-2 text-center">
                      {row.avgWakeTime}:00
                    </td>
                    <td className="border-y-[1px] border-l-[1px] border-pink-300  px-4 py-2 text-center">
                      {row.mostCommonDream}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* График динамики сна */}

        {trendData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-pink-800 mb-4">
              Динамика сна
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  domain={[0, 24]}
                  label={{ value: "Время", angle: -90, position: "insideLeft" }}
                />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="bedtime"
                  stroke="#ec4899" // pink-500
                  strokeWidth={3}
                  name="Время отхода"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="waketime"
                  stroke="#a855f7" // purple-500
                  strokeWidth={3}
                  name="Время пробуждения"
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

        {/* Список записей */}
      </div>
    </div>
  );
}

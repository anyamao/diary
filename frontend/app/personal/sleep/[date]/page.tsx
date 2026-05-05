"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface SleepSegment {
  start: string;
  end: string;
}

export default function SleepDayPage() {
  const [segments, setSegments] = useState<SleepSegment[]>([
    { start: "23:00", end: "07:00" },
  ]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const date = params.date as string;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (date) {
      fetchRecord();
    }
  }, [isAuthenticated, date]);

  const fetchRecord = async () => {
    try {
      const response = await api.get(`/sleep/records/${date}`);
      if (response.data) {
        setSegments(
          response.data.segments || [{ start: "23:00", end: "07:00" }],
        );
        setNotes(response.data.notes || "");
      }
    } catch (error) {
      console.error("Failed to fetch record:", error);
    } finally {
      setLoading(false);
    }
  };

  const addSegment = () => {
    setSegments([...segments, { start: "00:00", end: "01:00" }]);
  };

  const removeSegment = (index: number) => {
    if (segments.length > 1) {
      setSegments(segments.filter((_, i) => i !== index));
    }
  };

  const updateSegment = (
    index: number,
    field: keyof SleepSegment,
    value: string,
  ) => {
    const newSegments = [...segments];
    newSegments[index][field] = value;
    setSegments(newSegments);
  };

  const deleteRecord = async () => {
    if (confirm("Удалить запись о сне за этот день?")) {
      try {
        await api.delete(`/sleep/records/${date}`);
        router.push("/personal/sleep");
      } catch (error) {
        console.error("Failed to delete:", error);
        alert("Ошибка удаления");
      }
    }
  };

  const calculateTotalDuration = () => {
    let total = 0;
    segments.forEach((seg) => {
      const [startHour, startMin] = seg.start.split(":").map(Number);
      let [endHour, endMin] = seg.end.split(":").map(Number);
      let startTotal = startHour + startMin / 60;
      let endTotal = endHour + endMin / 60;
      if (endTotal < startTotal) endTotal += 24;
      total += endTotal - startTotal;
    });
    return total.toFixed(1);
  };

  const renderSleepBar = () => {
    const bars = [];
    for (const seg of segments) {
      const [startHour, startMin] = seg.start.split(":").map(Number);
      let [endHour, endMin] = seg.end.split(":").map(Number);
      let startTotal = startHour + startMin / 60;
      let endTotal = endHour + endMin / 60;

      if (endTotal < startTotal) {
        // Первая часть: от start до 24:00
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

        // Вторая часть: от 00:00 до end
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/sleep/records/${date}`, {
        segments: segments,
        notes,
      });
      router.push("/personal/sleep");
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    return `${day}.${month}.${year}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  const totalDuration = calculateTotalDuration();

  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Link
            href="/personal/sleep"
            className="text-blue-600 hover:text-blue-700"
          >
            ← Назад к трекеру
          </Link>
          <button
            onClick={deleteRecord}
            className="text-red-600 hover:text-red-700 text-sm"
          >
            🗑️ Удалить запись
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Сон за {formatDate(date)}
          </h1>
          <p className="text-gray-600 mb-6">
            Общая продолжительность:{" "}
            <span className="text-blue-600 font-bold">
              {totalDuration} часов
            </span>
          </p>

          {/* Визуализация сна - правильные полоски для пересекающих полночь */}
          <div className="mb-6">
            <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
              {renderSleepBar()}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Периоды сна
              </label>
              <div className="space-y-3">
                {segments.map((segment, idx) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <div className="flex-1 flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500">
                          Засыпание
                        </label>
                        <input
                          type="time"
                          value={segment.start}
                          onChange={(e) =>
                            updateSegment(idx, "start", e.target.value)
                          }
                          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500">
                          Пробуждение
                        </label>
                        <input
                          type="time"
                          value={segment.end}
                          onChange={(e) =>
                            updateSegment(idx, "end", e.target.value)
                          }
                          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    {segments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSegment(idx)}
                        className="mt-5 text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addSegment}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700"
              >
                + Добавить период сна (дневной сон, дремота)
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Заметки о сне
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Как спалось? Были ли кошмары? Что снилось?"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
              <Link
                href="/personal/sleep"
                className="flex-1 text-center border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                Отмена
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

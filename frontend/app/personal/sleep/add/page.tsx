"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";

interface SleepSegment {
  start: string;
  end: string;
}

interface SleepNote {
  id: string;
  title: string;
  content: string;
  dream_type: string | null;
  wake_mood: string | null;
  tags: string[];
  created_at: string;
}

export default function AddSleepPage() {
  const [segments, setSegments] = useState<SleepSegment[]>([
    { start: "23:00", end: "07:00" },
  ]);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [sleepRecordId, setSleepRecordId] = useState<string | null>(null);

  // Состояния для заметок
  const [sleepNotes, setSleepNotes] = useState<SleepNote[]>([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<SleepNote | null>(null);
  const [noteForm, setNoteForm] = useState({
    title: "",
    content: "",
    dream_type: "",
    wake_mood: "",
    tags: [] as string[],
    tagInput: "",
  });

  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

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

  const renderPreviewBar = () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await api.post(`/sleep/records/${date}`, {
        segments,
        notes,
      });
      setSleepRecordId(response.data.id);

      // Если есть заметки, сохраняем их
      if (sleepNotes.length > 0 && response.data.id) {
        for (const note of sleepNotes) {
          await api.post("/sleep-notes/", {
            title: note.title,
            content: note.content,
            dream_type: note.dream_type,
            wake_mood: note.wake_mood,
            tags: note.tags,
            sleep_record_id: response.data.id,
          });
        }
      }

      // Перенаправляем на главную страницу снов
      router.push("/personal/sleep");
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  // Функции для работы с заметками
  const addNote = () => {
    if (!noteForm.title.trim()) {
      alert("Введите название заметки");
      return;
    }

    const newNote: SleepNote = {
      id: Date.now().toString(),
      title: noteForm.title,
      content: noteForm.content,
      dream_type: noteForm.dream_type || null,
      wake_mood: noteForm.wake_mood || null,
      tags: noteForm.tags,
      created_at: new Date().toISOString(),
    };

    if (editingNote) {
      setSleepNotes(
        sleepNotes.map((n) =>
          n.id === editingNote.id ? { ...newNote, id: n.id } : n,
        ),
      );
    } else {
      setSleepNotes([...sleepNotes, newNote]);
    }

    setShowNoteModal(false);
    setEditingNote(null);
    setNoteForm({
      title: "",
      content: "",
      dream_type: "",
      wake_mood: "",
      tags: [],
      tagInput: "",
    });
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm("Удалить эту заметку?")) {
      setSleepNotes(sleepNotes.filter((n) => n.id !== noteId));
    }
  };

  const handleEditNote = (note: SleepNote) => {
    setEditingNote(note);
    setNoteForm({
      title: note.title,
      content: note.content || "",
      dream_type: note.dream_type || "",
      wake_mood: note.wake_mood || "",
      tags: note.tags || [],
      tagInput: "",
    });
    setShowNoteModal(true);
  };

  const addTag = () => {
    if (
      noteForm.tagInput.trim() &&
      !noteForm.tags.includes(noteForm.tagInput.trim())
    ) {
      setNoteForm({
        ...noteForm,
        tags: [...noteForm.tags, noteForm.tagInput.trim()],
        tagInput: "",
      });
    }
  };

  const removeTag = (tag: string) => {
    setNoteForm({
      ...noteForm,
      tags: noteForm.tags.filter((t) => t !== tag),
    });
  };

  const getDreamTypeEmoji = (type: string | null) => {
    const types: Record<string, string> = {
      nightmare: "😨",
      normal: "😴",
      love: "❤️",
      sad: "😢",
      happy: "😊",
    };
    return types[type || ""] || "💭";
  };

  const getDreamTypeText = (type: string | null) => {
    const types: Record<string, string> = {
      nightmare: "Кошмар",
      normal: "Обычный",
      love: "Любовный",
      sad: "Грустный",
      happy: "Счастливый",
    };
    return types[type || ""] || "Без типа";
  };

  const getWakeMoodEmoji = (mood: string | null) => {
    const moods: Record<string, string> = {
      sad: "😔",
      happy: "😊",
      scared: "😱",
      neutral: "😐",
    };
    return moods[mood || ""] || "😴";
  };

  const totalDuration = calculateTotalDuration();

  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            href="/personal/sleep"
            className="text-blue-600 hover:text-blue-700"
          >
            ← Назад к трекеру
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая колонка - форма добавления сна */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-6">
                Добавить запись о сне
              </h1>

              {/* Предпросмотр визуализации */}
              <div className="mb-6">
                <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                  {renderPreviewBar()}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>24:00</span>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Общая продолжительность:{" "}
                <span className="text-blue-600 font-bold">
                  {totalDuration} часов
                </span>
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дата
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

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

          {/* Правая колонка - заметки о снах */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Заметки о снах
                </h2>
                <button
                  onClick={() => {
                    setEditingNote(null);
                    setNoteForm({
                      title: "",
                      content: "",
                      dream_type: "",
                      wake_mood: "",
                      tags: [],
                      tagInput: "",
                    });
                    setShowNoteModal(true);
                  }}
                  className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {sleepNotes.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Нет заметок о снах
                </p>
              ) : (
                <div className="space-y-4">
                  {sleepNotes.map((note) => (
                    <div
                      key={note.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {getDreamTypeEmoji(note.dream_type)}
                          </span>
                          <span className="text-xl">
                            {getWakeMoodEmoji(note.wake_mood)}
                          </span>
                          <h3 className="font-semibold text-gray-800">
                            {note.title}
                          </h3>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditNote(note)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {note.content && (
                        <div className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {note.content}
                        </div>
                      )}

                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {note.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно для заметки */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingNote ? "Редактировать заметку" : "Новая заметка о сне"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Название
                </label>
                <input
                  type="text"
                  value={noteForm.title}
                  onChange={(e) =>
                    setNoteForm({ ...noteForm, title: e.target.value })
                  }
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Например: Сон про слонов"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Тип сна
                  </label>
                  <select
                    value={noteForm.dream_type}
                    onChange={(e) =>
                      setNoteForm({ ...noteForm, dream_type: e.target.value })
                    }
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Обычный</option>
                    <option value="nightmare">😨 Кошмар</option>
                    <option value="love">❤️ Любовный</option>
                    <option value="sad">😢 Грустный</option>
                    <option value="happy">😊 Счастливый</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Настроение после пробуждения
                  </label>
                  <select
                    value={noteForm.wake_mood}
                    onChange={(e) =>
                      setNoteForm({ ...noteForm, wake_mood: e.target.value })
                    }
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Обычное</option>
                    <option value="sad">😔 Грустное</option>
                    <option value="happy">😊 Веселое</option>
                    <option value="scared">😱 В ужасе</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Содержание
                </label>
                <textarea
                  value={noteForm.content}
                  onChange={(e) =>
                    setNoteForm({ ...noteForm, content: e.target.value })
                  }
                  rows={6}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Опиши свой сон..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Теги</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteForm.tagInput}
                    onChange={(e) =>
                      setNoteForm({ ...noteForm, tagInput: e.target.value })
                    }
                    onKeyDown={(e) => e.key === "Enter" && addTag()}
                    className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Например: слоны, вода, полет"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="bg-gray-200 px-4 rounded hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>
                {noteForm.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {noteForm.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm flex items-center gap-1"
                      >
                        #{tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={addNote}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  {editingNote ? "Обновить" : "Добавить"}
                </button>
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition"
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

"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Edit, Trash2, X } from "lucide-react";
import DreamTypePicker from "@/components/DreamTypePicker";
import { showToast } from "@/components/Toast";
import { showConfirm } from "@/components/ConfirmDialog";

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
  const [error, setError] = useState("");
  const [sleepRecordId, setSleepRecordId] = useState<string | null>(null);

  // Состояния для заметок
  const [sleepNotes, setSleepNotes] = useState<SleepNote[]>([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<SleepNote | null>(null);
  const [noteForm, setNoteForm] = useState({
    title: "",
    content: "",
    dream_type: "noemotions",
    wake_mood: "",
    tags: [] as string[],
    tagInput: "",
  });

  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  if (!isAuthenticated) {
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
            className="absolute h-full bg-purple-500 rounded-l-lg"
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
            className="absolute h-full bg-purple-500 rounded-r-lg"
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
            className="absolute h-full bg-purple-500 rounded-lg"
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

  // Проверка существования записи за этот день
  const checkRecordExists = async () => {
    try {
      const response = await api.get(`/sleep/check/${date}`);
      return response.data.exists;
    } catch (error) {
      console.error("Failed to check record:", error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    // Проверяем, существует ли уже запись за этот день
    const exists = await checkRecordExists();
    if (exists) {
      const errorMsg =
        "❌ На этот день уже есть запись о сне! Нельзя создать две записи за один день. Если хотите изменить данные, вернитесь в календарь и отредактируйте существующую запись.";
      setError(errorMsg);
      showToast(errorMsg, "error");
      setSaving(false);
      return;
    }

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

      showToast("Запись о сне успешно сохранена!", "success");
      router.push("/personal/sleep");
    } catch (error) {
      console.error("Failed to save:", error);
      showToast("Ошибка сохранения записи", "error");
    } finally {
      setSaving(false);
    }
  };

  // Функции для работы с заметками
  const addNote = async () => {
    if (!noteForm.title.trim()) {
      showToast("Введите название заметки", "warning");
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
      showToast("Заметка обновлена", "success");
    } else {
      setSleepNotes([...sleepNotes, newNote]);
      showToast("Заметка добавлена", "success");
    }

    setShowNoteModal(false);
    setEditingNote(null);
    setNoteForm({
      title: "",
      content: "",
      dream_type: "noemotions",
      wake_mood: "",
      tags: [],
      tagInput: "",
    });
  };

  const handleDeleteNote = async (noteId: string) => {
    const confirmed = await showConfirm(
      "Удалить заметку?",
      "Вы уверены, что хотите удалить эту заметку о сне?",
      "danger",
    );

    if (confirmed) {
      setSleepNotes(sleepNotes.filter((n) => n.id !== noteId));
      showToast("Заметка удалена", "success");
    }
  };

  const handleEditNote = (note: SleepNote) => {
    setEditingNote(note);
    setNoteForm({
      title: note.title,
      content: note.content || "",
      dream_type: note.dream_type || "noemotions",
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

  const getDreamTypeImage = (type: string | null) => {
    switch (type) {
      case "good":
        return "/gooddream.png";
      case "sad":
        return "/saddream.png";
      case "love":
        return "/romantic.png";
      case "nightmare":
        return "/nightmare.png";
      default:
        return "/noemotionsdream.png";
    }
  };

  const getDreamTypeText = (type: string | null) => {
    switch (type) {
      case "good":
        return "Хороший сон";
      case "sad":
        return "Грустный сон";
      case "love":
        return "Любовный сон";
      case "nightmare":
        return "Кошмар";
      default:
        return "Без эмоций";
    }
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
    <div className="min-h-screen bg-pink-50 p-8 flex flex-col">
      <div className="max-w-[1100px] flex flex-col w-full mx-auto">
        <div className="mb-6">
          <Link
            href="/personal/sleep"
            className="text-pink-600 hover:text-pink-700"
          >
            ← Назад к трекеру
          </Link>
        </div>

        <div className="grid gap-6">
          {/* Левая колонка - форма добавления сна */}
          <div className="">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-6">
                Добавить запись о сне
              </h1>

              {/* Сообщение об ошибке */}
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              {/* Предпросмотр визуализации */}
              <div className="mb-6">
                <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
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
                <span className="text-pink-600 font-bold">
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
                    className="mt-3 text-sm text-pink-600 hover:text-pink-700"
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
                    className="flex-1 bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600 transition disabled:opacity-50"
                  >
                    {saving ? "Сохранение..." : "Сохранить"}
                  </button>
                  <Link
                    href="/personal/sleep"
                    className="flex-1 text-center border border-pink-300 bg-pink-50 text-gray-700 py-2 rounded-lg hover:bg-pink-100 transition"
                  >
                    Отмена
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* Правая колонка - заметки о снах */}
          <div className="w-full">
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
                      dream_type: "noemotions",
                      wake_mood: "",
                      tags: [],
                      tagInput: "",
                    });
                    setShowNoteModal(true);
                  }}
                  className="bg-pink-500 text-white p-2 rounded-lg hover:bg-pink-600 transition"
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
                      onClick={() => handleEditNote(note)}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-pink-50 transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={getDreamTypeImage(note.dream_type)}
                            alt="dream type"
                            className="w-8 h-8 object-contain"
                          />
                          <h3 className="font-semibold text-gray-800">
                            {note.title}
                          </h3>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {note.content && (
                        <div className="text-sm text-gray-600 w-full overflow-x-auto">
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
                  <DreamTypePicker
                    currentType={noteForm.dream_type}
                    onSelectType={(type) =>
                      setNoteForm({ ...noteForm, dream_type: type })
                    }
                  />
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
                  className="flex-1 bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700 transition"
                >
                  {editingNote ? "Обновить" : "Добавить"}
                </button>
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="flex-1 border border-pink-300 bg-pink-50 text-gray-700 py-2 rounded-lg hover:bg-pink-100 transition"
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

"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { useRouter, useParams } from "next/navigation";
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

export default function SleepDayPage() {
  const [segments, setSegments] = useState<SleepSegment[]>([
    { start: "23:00", end: "07:00" },
  ]);
  const [notes, setNotes] = useState("");
  const [sleepNotes, setSleepNotes] = useState<SleepNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<SleepNote | null>(null);
  const [sleepRecordId, setSleepRecordId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
        setSleepRecordId(response.data.id);

        if (response.data.id) {
          const notesResponse = await api.get(
            `/sleep-notes/record/${response.data.id}`,
          );
          setSleepNotes(notesResponse.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch record:", error);
      showToast("Не удалось загрузить данные о сне", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteSleepRecord = async () => {
    const confirmed = await showConfirm(
      "Удалить запись о сне?",
      "Вы уверены, что хотите удалить всю запись о сне за этот день? Это действие нельзя отменить.",
      "danger",
    );

    if (confirmed) {
      setIsDeleting(true);
      try {
        await api.delete(`/sleep/records/${date}`);
        showToast("Запись о сне успешно удалена", "success");
        router.push("/personal/sleep");
      } catch (error) {
        console.error("Failed to delete:", error);
        showToast("Не удалось удалить запись о сне", "error");
      } finally {
        setIsDeleting(false);
      }
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
        const leftPercent1 = (startTotal / 24) * 100;
        const widthPercent1 = ((24 - startTotal) / 24) * 100;
        bars.push(
          <div
            key={`${startTotal}-24`}
            className="absolute h-full bg-purple-500"
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
            className="absolute h-full bg-purple-500"
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
            className="absolute h-full bg-purple-500"
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
      await fetchRecord();
      showToast("Данные о сне успешно сохранены", "success");
      router.push("/personal/sleep");
    } catch (error) {
      console.error("Failed to save:", error);
      showToast("Не удалось сохранить данные о сне", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNote = async () => {
    if (!sleepRecordId) {
      showToast("Сначала сохраните запись о сне", "warning");
      return;
    }

    if (!noteForm.title.trim()) {
      showToast("Введите название заметки", "warning");
      return;
    }

    try {
      const noteData = {
        title: noteForm.title,
        content: noteForm.content,
        dream_type: noteForm.dream_type || null,
        wake_mood: noteForm.wake_mood || null,
        tags: noteForm.tags,
        sleep_record_id: sleepRecordId,
      };

      if (editingNote) {
        await api.put(`/sleep-notes/${editingNote.id}`, noteData);
        showToast("Заметка о сне обновлена", "success");
      } else {
        await api.post("/sleep-notes/", noteData);
        showToast("Заметка о сне добавлена", "success");
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
      await fetchRecord();
    } catch (error: any) {
      console.error("Failed to save note:", error);
      showToast("Не удалось сохранить заметку", "error");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const confirmed = await showConfirm(
      "Удалить заметку?",
      "Вы уверены, что хотите удалить эту заметку о сне?",
      "danger",
    );

    if (confirmed) {
      try {
        await api.delete(`/sleep-notes/${noteId}`);
        await fetchRecord();
        showToast("Заметка о сне удалена", "success");
      } catch (error) {
        console.error("Failed to delete note:", error);
        showToast("Не удалось удалить заметку", "error");
      }
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

  const getWakeMoodEmoji = (mood: string | null) => {
    const moods: Record<string, string> = {
      sad: "😔",
      happy: "😊",
      scared: "😱",
      neutral: "😐",
    };
    return moods[mood || ""] || "😴";
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
    <div className="min-h-screen bg-pink-50 p-8">
      <div className="max-w-[1100px] mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Link
            href="/personal/sleep"
            className="text-pink-600 hover:text-pink-700"
          >
            ← Назад к трекеру
          </Link>
        </div>

        <div className="grid gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Сон за {formatDate(date)}
              </h1>
              <p className="text-gray-600 mb-6">
                Общая продолжительность:{" "}
                <span className="text-pink-600 font-bold">
                  {totalDuration} часов
                </span>
              </p>

              <div className="mb-6">
                <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                  {renderSleepBar()}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
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
                            <X className="w-4 h-4" />
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
                    + Добавить период сна
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

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700 transition disabled:opacity-50"
                  >
                    {saving ? "Сохранение..." : "Сохранить"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-1">
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
                    className="border cursor-pointer bg-white border-pink-300 rounded-lg p-4 shadow-sm hover:shadow-md transition"
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
                          className="text-red-500 p-1 hover:bg-pink-100 rounded-lg hover:text-red-600"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    {note.content && (
                      <div className="text-sm text-gray-600 w-full break-all whitespace-pre-wrap">
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

                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(note.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              <div className="flex flex-row items-center w-full">
                <div className="w-[90px] flex flex-col ">
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
                <div className="w-full">
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
                  onClick={handleSaveNote}
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

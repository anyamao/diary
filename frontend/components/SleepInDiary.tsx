"use client";

import { useState, useEffect } from "react";
import { Moon, Plus, Edit, Trash2, X } from "lucide-react";
import api from "@/lib/axios";

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
}

interface SleepRecord {
  id: string;
  date: string;
  segments: SleepSegment[];
  notes: string;
}

interface SleepInDiaryProps {
  date: string;
}

export default function SleepInDiary({ date }: SleepInDiaryProps) {
  const [sleepRecord, setSleepRecord] = useState<SleepRecord | null>(null);
  const [segments, setSegments] = useState<SleepSegment[]>([
    { start: "23:00", end: "07:00" },
  ]);
  const [sleepNotes, setSleepNotes] = useState<SleepNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<SleepNote | null>(null);
  const [error, setError] = useState("");
  const [noteForm, setNoteForm] = useState({
    title: "",
    content: "",
    dream_type: "",
    wake_mood: "",
    tags: [] as string[],
    tagInput: "",
  });

  useEffect(() => {
    fetchSleepRecord();
  }, [date]);

  const fetchSleepRecord = async () => {
    try {
      const response = await api.get(`/sleep/records/${date}`);
      if (response.data && response.data.id) {
        setSleepRecord(response.data);
        setSegments(
          response.data.segments || [{ start: "23:00", end: "07:00" }],
        );

        const notesResponse = await api.get(
          `/sleep-notes/record/${response.data.id}`,
        );
        setSleepNotes(notesResponse.data);
      } else {
        setSleepRecord(null);
        setSegments([{ start: "23:00", end: "07:00" }]);
        setSleepNotes([]);
      }
    } catch (error) {
      console.error("Failed to fetch sleep record:", error);
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
        bars.push(
          <div
            key={`${startTotal}-24`}
            className="absolute h-full bg-blue-500 rounded-l-full"
            style={{
              left: `${(startTotal / 24) * 100}%`,
              width: `${((24 - startTotal) / 24) * 100}%`,
            }}
          />,
        );
        bars.push(
          <div
            key={`0-${endTotal}`}
            className="absolute h-full bg-blue-500 rounded-r-full"
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
            className="absolute h-full bg-blue-500 rounded-full"
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

  // Сохранение периодов сна
  const saveSleepData = async () => {
    try {
      if (sleepRecord) {
        await api.put(`/sleep/records/${date}`, { segments, notes: "" });
      } else {
        const response = await api.post(`/sleep/records/${date}`, {
          segments,
          notes: "",
        });
        setSleepRecord(response.data);
      }
      await fetchSleepRecord();
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  // Сохранение заметки
  const saveNote = async (note: SleepNote) => {
    if (!sleepRecord?.id) {
      // Сначала создаем запись о сне
      const response = await api.post(`/sleep/records/${date}`, {
        segments,
        notes: "",
      });
      setSleepRecord(response.data);
      return await api.post(`/sleep-notes/`, {
        title: note.title,
        content: note.content,
        dream_type: note.dream_type,
        wake_mood: note.wake_mood,
        tags: note.tags,
        sleep_record_id: response.data.id,
      });
    }

    return await api.post(`/sleep-notes/`, {
      title: note.title,
      content: note.content,
      dream_type: note.dream_type,
      wake_mood: note.wake_mood,
      tags: note.tags,
      sleep_record_id: sleepRecord.id,
    });
  };

  // Удаление заметки
  const deleteNoteFromServer = async (noteId: string) => {
    await api.delete(`/sleep-notes/${noteId}`);
  };

  const addNoteAndSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!noteForm.title.trim()) {
      alert("Введите название");
      return;
    }

    setSaving(true);
    try {
      // Сначала сохраняем периоды сна (если нужно)
      await saveSleepData();

      // Сохраняем заметку
      const newNote: SleepNote = {
        id: `temp_${Date.now()}`,
        title: noteForm.title,
        content: noteForm.content,
        dream_type: noteForm.dream_type || null,
        wake_mood: noteForm.wake_mood || null,
        tags: noteForm.tags,
      };

      await saveNote(newNote);

      // Обновляем список заметок
      await fetchSleepRecord();
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
    } catch (err) {
      console.error("Error adding note:", err);
      setError("Ошибка добавления заметки");
    } finally {
      setSaving(false);
    }
  };

  const updateNoteAndSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!noteForm.title.trim() || !editingNote) {
      return;
    }

    setSaving(true);
    try {
      // Удаляем старую и создаем новую
      if (editingNote.id && !editingNote.id.startsWith("temp_")) {
        await deleteNoteFromServer(editingNote.id);
      }

      const updatedNote: SleepNote = {
        id: editingNote.id,
        title: noteForm.title,
        content: noteForm.content,
        dream_type: noteForm.dream_type || null,
        wake_mood: noteForm.wake_mood || null,
        tags: noteForm.tags,
      };

      await saveNote(updatedNote);
      await fetchSleepRecord();
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
    } catch (err) {
      console.error("Error updating note:", err);
      setError("Ошибка обновления заметки");
    } finally {
      setSaving(false);
    }
  };

  const deleteNoteAndSave = async (noteId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Удалить заметку о сне?")) {
      setSaving(true);
      try {
        if (noteId && !noteId.startsWith("temp_")) {
          await deleteNoteFromServer(noteId);
        }
        await fetchSleepRecord();
      } catch (err) {
        console.error("Error deleting note:", err);
        setError("Ошибка удаления заметки");
      } finally {
        setSaving(false);
      }
    }
  };

  const addTag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  const removeTag = (tag: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNoteForm({
      ...noteForm,
      tags: noteForm.tags.filter((t) => t !== tag),
    });
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

  const openAddNoteModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
  };

  const openEditNoteModal = (note: SleepNote, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center text-gray-500">
        Загрузка...
      </div>
    );
  }

  const totalDuration = calculateTotalDuration();

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Moon className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">Сон</h3>
        </div>
        {sleepRecord && (
          <button
            type="button"
            onClick={() => setShowEditor(!showEditor)}
            className="text-sm text-blue-600"
          >
            {showEditor ? "Отмена" : "Редактировать"}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-yellow-50 text-yellow-800 p-2 rounded mb-3 text-sm">
          {error}
        </div>
      )}

      {showEditor || !sleepRecord ? (
        // Режим редактирования / создания
        <>
          <div className="space-y-2">
            {segments.map((seg, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="time"
                  value={seg.start}
                  onChange={(e) => updateSegment(idx, "start", e.target.value)}
                  className="flex-1 p-2 border rounded"
                />
                <span className="py-2">—</span>
                <input
                  type="time"
                  value={seg.end}
                  onChange={(e) => updateSegment(idx, "end", e.target.value)}
                  className="flex-1 p-2 border rounded"
                />
                {segments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSegment(idx)}
                    className="text-red-500 px-2"
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
            className="text-sm text-blue-600 mt-2"
          >
            + Добавить период
          </button>

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await saveSleepData();
                setShowEditor(false);
              }}
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 rounded disabled:opacity-50"
            >
              Сохранить периоды
            </button>
          </div>
        </>
      ) : (
        // Режим просмотра - отображаем данные
        <>
          <div className="relative h-12 bg-gray-200 rounded-lg overflow-hidden">
            {renderSleepBar()}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            <span className="font-semibold text-blue-600">
              {totalDuration} ч
            </span>
          </p>
        </>
      )}

      {/* Заметки о сне - отображаются всегда */}
      {sleepNotes.length > 0 && (
        <div className="mt-3 space-y-2">
          {sleepNotes.map((note) => (
            <div key={note.id} className="bg-white rounded p-2 text-sm border">
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <span>{getDreamTypeEmoji(note.dream_type)}</span>
                  <span className="font-medium">{note.title}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => openEditNoteModal(note, e)}
                    className="text-blue-500"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => deleteNoteAndSave(note.id, e)}
                    className="text-red-500"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              {note.content && (
                <p className="text-gray-500 text-xs mt-1">{note.content}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={openAddNoteModal}
        className="mt-2 text-xs text-blue-500 flex items-center gap-1"
      >
        <Plus className="w-3 h-3" /> Добавить сон
      </button>

      {/* Модальное окно для заметки */}
      {showNoteModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">
              {editingNote ? "Редактировать" : "Новая заметка о сне"}
            </h2>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Название"
                value={noteForm.title}
                onChange={(e) =>
                  setNoteForm({ ...noteForm, title: e.target.value })
                }
                className="w-full p-2 border rounded"
              />

              <select
                value={noteForm.dream_type}
                onChange={(e) =>
                  setNoteForm({ ...noteForm, dream_type: e.target.value })
                }
                className="w-full p-2 border rounded"
              >
                <option value="">Тип сна</option>
                <option value="happy">😊 Счастливый</option>
                <option value="sad">😢 Грустный</option>
                <option value="love">❤️ Любовный</option>
                <option value="nightmare">😨 Кошмар</option>
              </select>

              <textarea
                placeholder="Содержание"
                value={noteForm.content}
                onChange={(e) =>
                  setNoteForm({ ...noteForm, content: e.target.value })
                }
                rows={3}
                className="w-full p-2 border rounded"
              />

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Теги"
                  value={noteForm.tagInput}
                  onChange={(e) =>
                    setNoteForm({ ...noteForm, tagInput: e.target.value })
                  }
                  className="flex-1 p-2 border rounded"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 bg-gray-200 rounded"
                >
                  +
                </button>
              </div>

              <div className="flex flex-wrap gap-1">
                {noteForm.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-blue-100 px-2 py-1 rounded text-sm flex items-center gap-1"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={(e) => removeTag(tag, e)}
                      className="text-blue-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={editingNote ? updateNoteAndSave : addNoteAndSave}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 rounded disabled:opacity-50"
                >
                  {saving
                    ? "Сохранение..."
                    : editingNote
                      ? "Обновить"
                      : "Добавить"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="flex-1 border py-2 rounded"
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

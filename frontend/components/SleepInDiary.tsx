"use client";

import { useState, useEffect, useRef } from "react";
import { Moon, Plus, Edit, Trash2, X } from "lucide-react";
import api from "@/lib/axios";
import DreamTypePicker from "./DreamTypePicker";
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
}

interface SleepRecord {
  id: string;
  date: string;
  segments: SleepSegment[];
  notes: string;
}

interface SleepInDiaryProps {
  date?: string;
  recordId?: string;
  onSleepSaved?: () => void;
  onCancel?: () => void;
}

function AutoResizeTextarea({ value, onChange, placeholder, className }: any) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={1}
      className={`w-full h-full p-1 outline-none text-sm resize-none overflow-hidden ${className}`}
    />
  );
}

export default function SleepInDiary({
  date: propDate,
  recordId: propRecordId,
  onSleepSaved,
  onCancel,
}: SleepInDiaryProps) {
  const [sleepRecord, setSleepRecord] = useState<SleepRecord | null>(null);
  const [segments, setSegments] = useState<SleepSegment[]>([
    { start: "23:00", end: "07:00" },
  ]);
  const [sleepNotes, setSleepNotes] = useState<SleepNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [addingNote, setAddingNote] = useState(false);
  const [error, setError] = useState("");
  const [noteForm, setNoteForm] = useState({
    title: "",
    content: "",
    dream_type: "noemotions",
    wake_mood: "",
    tags: [] as string[],
    tagInput: "",
  });
  const [generalSleepNote, setGeneralSleepNote] = useState("");
  const [isEditingGeneralNote, setIsEditingGeneralNote] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    if (propDate) {
      setCurrentDate(propDate);
      fetchSleepRecordByDate(propDate);
    } else if (propRecordId) {
      fetchSleepRecordById(propRecordId);
    }
  }, [propDate, propRecordId]);

  const fetchSleepRecordById = async (id: string) => {
    try {
      const response = await api.get(`/sleep/records/${id}`);
      if (response.data) {
        setSleepRecord(response.data);
        setSegments(
          response.data.segments || [{ start: "23:00", end: "07:00" }],
        );
        setGeneralSleepNote(response.data.notes || "");
        setCurrentDate(response.data.date.split("T")[0]);

        const notesResponse = await api.get(
          `/sleep-notes/record/${response.data.id}`,
        );
        setSleepNotes(notesResponse.data);
      }
    } catch (error) {
      showToast("Ошибка загрузки записи", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchSleepRecordByDate = async (date: string) => {
    try {
      const response = await api.get(`/sleep/records/${date}`);
      if (response.data && response.data.id) {
        setSleepRecord(response.data);
        setSegments(
          response.data.segments || [{ start: "23:00", end: "07:00" }],
        );
        setGeneralSleepNote(response.data.notes || "");

        const notesResponse = await api.get(
          `/sleep-notes/record/${response.data.id}`,
        );
        setSleepNotes(notesResponse.data);
      } else {
        setSleepRecord(null);
        setSegments([{ start: "23:00", end: "07:00" }]);
        setSleepNotes([]);
        setGeneralSleepNote("");
      }
    } catch (error) {
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

  const saveSleepData = async () => {
    try {
      if (sleepRecord) {
        await api.put(`/sleep/records/${currentDate}`, {
          segments,
          notes: generalSleepNote,
        });
        return sleepRecord.id;
      } else {
        const response = await api.post(`/sleep/records/${currentDate}`, {
          segments,
          notes: generalSleepNote,
        });
        setSleepRecord(response.data);
        return response.data.id;
      }
    } catch (err) {
      showToast("Ошибка сохранения данных о сне", "error");
      return null;
    }
  };

  const saveNote = async (note: SleepNote) => {
    const recordId = sleepRecord?.id;

    if (!recordId) {
      const response = await api.post(`/sleep/records/${currentDate}`, {
        segments,
        notes: generalSleepNote,
      });
      const newRecordId = response.data.id;
      setSleepRecord(response.data);

      return await api.post(`/sleep-notes/`, {
        title: note.title,
        content: note.content,
        dream_type: note.dream_type,
        wake_mood: note.wake_mood,
        tags: note.tags,
        sleep_record_id: newRecordId,
      });
    }

    return await api.post(`/sleep-notes/`, {
      title: note.title,
      content: note.content,
      dream_type: note.dream_type,
      wake_mood: note.wake_mood,
      tags: note.tags,
      sleep_record_id: recordId,
    });
  };
  const updateNote = async (noteId: string, note: SleepNote) => {
    await api.put(`/sleep-notes/${noteId}`, {
      title: note.title,
      content: note.content,
      dream_type: note.dream_type,
      wake_mood: note.wake_mood,
      tags: note.tags,
    });
  };

  const deleteNoteFromServer = async (noteId: string) => {
    await api.delete(`/sleep-notes/${noteId}`);
  };

  const deleteGeneralNote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = await showConfirm(
      "Удалить общую заметку?",
      "Вы уверены, что хотите удалить общую заметку о сне?",
      "danger",
    );

    if (!confirmed) return;

    setSaving(true);
    try {
      await api.put(`/sleep/records/${currentDate}`, {
        segments,
        notes: "",
      });
      setSleepRecord((prev) => (prev ? { ...prev, notes: "" } : prev));
      setGeneralSleepNote("");
      showToast("Общая заметка о сне удалена", "success");
      setIsEditingGeneralNote(false);
      if (onSleepSaved) onSleepSaved();
    } catch (err) {
      showToast("Ошибка удаления заметки", "error");
    } finally {
      setSaving(false);
    }
  };

  const saveGeneralNote = async () => {
    setSaving(true);
    try {
      if (!sleepRecord?.id) {
        const response = await api.post(`/sleep/records/${currentDate}`, {
          segments,
          notes: generalSleepNote,
        });
        setSleepRecord(response.data);
        showToast("Общая заметка о сне сохранена", "success");
        setIsEditingGeneralNote(false);
        if (onSleepSaved) onSleepSaved();
        return;
      }

      const response = await api.put(`/sleep/records/${currentDate}`, {
        segments,
        notes: generalSleepNote,
      });

      setSleepRecord((prev) =>
        prev ? { ...prev, notes: generalSleepNote } : prev,
      );
      showToast("Общая заметка о сне сохранена", "success");
      setIsEditingGeneralNote(false);
      if (onSleepSaved) onSleepSaved();
    } catch (err: any) {
      showToast("Ошибка сохранения заметки", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!noteForm.title.trim()) {
      showToast("Введите название заметки", "warning");
      return;
    }

    setSaving(true);
    try {
      let recordId = sleepRecord?.id;

      if (!recordId) {
        const response = await api.post(`/sleep/records/${currentDate}`, {
          segments,
          notes: generalSleepNote,
        });
        recordId = response.data.id;
        setSleepRecord(response.data);
      }

      // Создаём заметку
      const noteData = {
        title: noteForm.title,
        content: noteForm.content,
        dream_type: noteForm.dream_type || "noemotions",
        wake_mood: noteForm.wake_mood || null,
        tags: noteForm.tags,
        sleep_record_id: recordId,
      };

      const noteResponse = await api.post("/sleep-notes/", noteData);

      const notesResponse = await api.get(`/sleep-notes/record/${recordId}`);
      setSleepNotes(notesResponse.data);

      setAddingNote(false);
      setNoteForm({
        title: "",
        content: "",
        dream_type: "noemotions",
        wake_mood: "",
        tags: [],
        tagInput: "",
      });
      showToast("Заметка о сне добавлена", "success");
      if (onSleepSaved) onSleepSaved();
    } catch (err: any) {
      showToast(
        err.response?.data?.detail || "Ошибка добавления заметки",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };
  const handleUpdateNote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!noteForm.title.trim() || !editingNoteId) {
      return;
    }

    setSaving(true);
    try {
      const updatedNote: SleepNote = {
        id: editingNoteId,
        title: noteForm.title,
        content: noteForm.content,
        dream_type: noteForm.dream_type || "noemotions",
        wake_mood: noteForm.wake_mood || null,
        tags: noteForm.tags,
      };

      await updateNote(editingNoteId, updatedNote);
      await fetchSleepRecordByDate(currentDate);
      setEditingNoteId(null);
      setNoteForm({
        title: "",
        content: "",
        dream_type: "noemotions",
        wake_mood: "",
        tags: [],
        tagInput: "",
      });
      showToast("Заметка обновлена", "success");
      if (onSleepSaved) onSleepSaved();
    } catch (err) {
      showToast("Ошибка обновления заметки", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = await showConfirm(
      "Удалить заметку?",
      "Вы уверены, что хотите удалить эту заметку о сне?",
      "danger",
    );

    if (confirmed) {
      setSaving(true);
      try {
        await deleteNoteFromServer(noteId);
        await fetchSleepRecordByDate(currentDate);
        showToast("Заметка удалена", "success");
        if (onSleepSaved) onSleepSaved();
      } catch (err) {
        showToast("Ошибка удаления заметки", "error");
      } finally {
        setSaving(false);
      }
    }
  };

  const startEditNote = (note: SleepNote, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingNoteId(note.id);
    setNoteForm({
      title: note.title,
      content: note.content || "",
      dream_type: note.dream_type || "noemotions",
      wake_mood: note.wake_mood || "",
      tags: note.tags || [],
      tagInput: "",
    });
  };

  const startAddNote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAddingNote(true);
    setNoteForm({
      title: "",
      content: "",
      dream_type: "noemotions",
      wake_mood: "",
      tags: [],
      tagInput: "",
    });
  };
  const cancelEdit = () => {
    setEditingNoteId(null);
    setAddingNote(false);
    setNoteForm({
      title: "",
      content: "",
      dream_type: "noemotions",
      wake_mood: "",
      tags: [],
      tagInput: "",
    });
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

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center text-gray-500">
        Загрузка...
      </div>
    );
  }

  const totalDuration = calculateTotalDuration();

  return (
    <div className="mb-6 flex flex-col items-center justify-center w-full">
      <div className="flex flex-col max-w-[430px] sm:max-w-[1200px] bg-white border-[1px] flex-1 w-full border-pink-300 shadow-sm hover:shadow-md rounded-lg p-[20px]">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-pink-600" />
            <h3 className="font-semibold text-gray-800">Сон</h3>
          </div>
          <div className="flex flex-row items-center">
            <p className="text-sm text-gray-600 mr-[10px]">
              <span className="font-semibold text-pink-950">
                {totalDuration} ч
              </span>
            </p>
            {sleepRecord && (
              <button
                type="button"
                onClick={() => setShowEditor(!showEditor)}
                className="text-sm text-pink-600 hover:text-pink-700"
              >
                {showEditor ? "Отмена" : "Редактировать"}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-yellow-50 text-yellow-800 p-2 rounded mb-3 text-sm">
            {error}
          </div>
        )}

        {showEditor || !sleepRecord ? (
          <>
            <div className="space-y-2">
              {segments.map((seg, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="time"
                    value={seg.start}
                    onChange={(e) =>
                      updateSegment(idx, "start", e.target.value)
                    }
                    className="flex-1 p-2 border rounded focus:ring-pink-300 focus:border-pink-300 outline-none"
                  />
                  <span className="py-2">—</span>
                  <input
                    type="time"
                    value={seg.end}
                    onChange={(e) => updateSegment(idx, "end", e.target.value)}
                    className="flex-1 p-2 border rounded focus:ring-pink-300 focus:border-pink-300 outline-none"
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
              className="text-sm text-pink-600 hover:text-pink-700 mt-2"
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
                  if (onSleepSaved) onSleepSaved();
                }}
                disabled={saving}
                className="flex-1 bg-pink-500 text-white py-2 rounded hover:bg-pink-600 disabled:opacity-50"
              >
                Сохранить периоды
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="relative h-8 my-[10px] bg-gray-200 rounded-lg overflow-hidden">
              {renderSleepBar()}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 bg-white rounded-lg max-w-[430px] sm:max-w-[1200px] border-[1px] flex-1 w-full border-pink-300 shadow-sm p-4">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-semibold text-pink-800">
            Общая заметка о сне
          </label>
          <div className="flex gap-2">
            {!isEditingGeneralNote && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingGeneralNote(true);
                  setGeneralSleepNote(sleepRecord?.notes || "");
                }}
                className="text-xs text-pink-500 hover:text-pink-600"
              >
                {sleepRecord?.notes ? "Редактировать" : "Добавить"}
              </button>
            )}
            {sleepRecord?.notes && !isEditingGeneralNote && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteGeneralNote(e);
                }}
                className="text-xs text-red-500 hover:text-red-600"
              >
                Удалить
              </button>
            )}
          </div>
        </div>

        {!isEditingGeneralNote ? (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingGeneralNote(true);
              setGeneralSleepNote(sleepRecord?.notes || "");
            }}
            className="text-sm text-gray-600 whitespace-pre-wrap break-words cursor-pointer hover:bg-pink-50 p-2 rounded-lg transition"
          >
            {sleepRecord?.notes ||
              "➕ Нажмите, чтобы добавить общую заметку о сне..."}
          </div>
        ) : (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <AutoResizeTextarea
              placeholder="Напишите общую заметку о сне (как спалось, что чувствовали и т.д.)..."
              value={generalSleepNote}
              onChange={(e) => setGeneralSleepNote(e.target.value)}
              className="bg-pink-50"
            />
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  saveGeneralNote();
                }}
                disabled={saving}
                className="px-4 py-1 bg-pink-500 text-white rounded-lg hover:bg-pink-600 text-sm"
              >
                Сохранить
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingGeneralNote(false);
                  setGeneralSleepNote(sleepRecord?.notes || "");
                }}
                className="px-4 py-1 border border-pink-300 rounded-lg hover:bg-pink-100 text-sm"
              >
                Отмена
              </button>
              {sleepRecord?.notes && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteGeneralNote(e);
                  }}
                  disabled={saving}
                  className="px-4 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                >
                  Удалить
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="font-semibold text-sm flex-1 w-full max-w-[430px] sm:max-w-[1200px] text-pink-800 mt-[10px]">
        Какие сны вам сегодня снились?
      </p>

      <div className="mt-3  flex-1 max-w-[430px] sm:max-w-[1200px]   w-full">
        {sleepNotes.map((note) => (
          <div
            key={note.id}
            onClick={(e) => {
              e.stopPropagation();
              startEditNote(note, e);
            }}
            className="bg-white rounded-lg my-[10px] flex-1 w-full text-sm border-[1px] p-[20px] border-pink-300 shadow-sm hover:shadow-md"
          >
            {editingNoteId === note.id ? (
              <div className="space-y-2">
                <div className="flex flex-row">
                  <DreamTypePicker
                    currentType={noteForm.dream_type}
                    onSelectType={(type) =>
                      setNoteForm({ ...noteForm, dream_type: type })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Название"
                    value={noteForm.title}
                    onChange={(e) =>
                      setNoteForm({ ...noteForm, title: e.target.value })
                    }
                    className="w-full ml-[10px] p-1 border-b-[1px] border-b-pink-200 outline-none text-sm"
                    autoFocus
                  />
                </div>

                <AutoResizeTextarea
                  placeholder="Содержание"
                  value={noteForm.content}
                  onChange={(e) =>
                    setNoteForm({ ...noteForm, content: e.target.value })
                  }
                />

                <div className="flex mt-[10px] gap-1">
                  <input
                    type="text"
                    placeholder="Теги"
                    value={noteForm.tagInput}
                    onChange={(e) =>
                      setNoteForm({ ...noteForm, tagInput: e.target.value })
                    }
                    className="flex-1 p-1 border rounded focus:ring-pink-300 focus:border-pink-300 outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-2 bg-gray-200 rounded text-sm"
                  >
                    +
                  </button>
                </div>
                {noteForm.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {noteForm.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-blue-100 px-2 py-0.5 rounded text-xs flex items-center gap-1"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-blue-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleUpdateNote}
                    disabled={saving}
                    className="flex-1 bg-pink-500 text-white py-1 hover:bg-pink-600 duration-300 rounded-lg h-[40px] text-sm"
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex-1 border border-pink-300 hover:bg-pink-200 duration-300 py-1 bg-pink-100 rounded-lg text-sm"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-row items-center">
                      <img
                        src={
                          note.dream_type === "good"
                            ? "/gooddream.png"
                            : note.dream_type === "sad"
                              ? "/saddream.png"
                              : note.dream_type === "love"
                                ? "/romantic.png"
                                : note.dream_type === "nightmare"
                                  ? "/nightmare.png"
                                  : "/noemotionsdream.png"
                        }
                        alt="dream type"
                        className="w-10 h-10 flex-shrink-0"
                      />
                      <span className="font-medium ml-[10px] border-b-[1px] border-pink-200 max-w-[400px] pb-[5px] overflow-x-auto">
                        {note.title}
                      </span>
                    </div>
                    <div className="flex gap-1 ml-2 flex-shrink-0">
                      <button
                        onClick={(e) => handleDeleteNote(note.id, e)}
                        className="text-red-500 p-1"
                        title="Удалить"
                      >
                        <Trash2 className="w-6 h-6 p-1 hover:bg-pink-100 rounded-lg" />
                      </button>
                    </div>
                  </div>
                  {note.content && (
                    <div className="text-sm text-gray-600 mt-[10px] w-full break-all whitespace-pre-wrap">
                      {note.content}
                    </div>
                  )}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-gray-100 px-1 py-0.5 rounded text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {addingNote ? (
        <div className="mt-3 bg-white flex-1 w-full rounded-lg border-pink-300 shadow-sm hover:shadow-md duration-300 border">
          <div className="space-y-2 p-[20px]">
            <div className="flex flex-row">
              <DreamTypePicker
                currentType={noteForm.dream_type}
                onSelectType={(type) =>
                  setNoteForm({ ...noteForm, dream_type: type })
                }
              />
              <input
                type="text"
                placeholder="Название"
                value={noteForm.title}
                onChange={(e) =>
                  setNoteForm({ ...noteForm, title: e.target.value })
                }
                className="w-full ml-[10px] p-1 border-b-[1px] border-b-pink-200 outline-none text-sm"
                autoFocus
              />
            </div>
            <AutoResizeTextarea
              placeholder="Содержание"
              value={noteForm.content}
              onChange={(e) =>
                setNoteForm({ ...noteForm, content: e.target.value })
              }
            />

            <div className="flex gap-1">
              <input
                type="text"
                placeholder="Теги"
                value={noteForm.tagInput}
                onChange={(e) =>
                  setNoteForm({ ...noteForm, tagInput: e.target.value })
                }
                className="flex-1 p-1 border rounded focus:ring-pink-300 focus:border-pink-300 outline-none text-sm"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-2 bg-gray-200 rounded text-sm"
              >
                +
              </button>
            </div>
            {noteForm.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {noteForm.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-blue-100 px-2 py-0.5 rounded text-xs flex items-center gap-1"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-blue-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-6 pt-[15px]">
              <button
                onClick={handleAddNote}
                disabled={saving}
                className="flex-1 bg-pink-500 text-white py-1 hover:bg-pink-600 duration-300 rounded-lg h-[40px] text-sm"
              >
                Добавить
              </button>
              <button
                onClick={cancelEdit}
                className="flex-1 border border-pink-300 hover:bg-pink-200 duration-300 py-1 bg-pink-100 rounded-lg text-sm"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={startAddNote}
          className="mt-3 text-xs text-pink-500 flex-1 w-full max-w-[400px] sm:max-w-[1200px] flex items-center gap-1 hover:text-pink-600"
        >
          <Plus className="w-3 h-3" /> Добавить сон
        </button>
      )}
    </div>
  );
}

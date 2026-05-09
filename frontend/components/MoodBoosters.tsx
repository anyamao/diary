"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Save,
  Heart,
  Frown,
  StickyNote,
  Edit,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import MarkdownEditor from "@/components/MarkdownEditor";
import { showToast } from "@/components/Toast";
import { showConfirm } from "@/components/ConfirmDialog";

interface MoodItem {
  id: string;
  text: string;
  type: "booster" | "drainer";
}

interface SelfNote {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function MoodBoosters() {
  const [boosters, setBoosters] = useState<MoodItem[]>([]);
  const [drainers, setDrainers] = useState<MoodItem[]>([]);
  const [selfNotes, setSelfNotes] = useState<SelfNote[]>([]);
  const [newBooster, setNewBooster] = useState("");
  const [newDrainer, setNewDrainer] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<SelfNote | null>(null);
  const [noteForm, setNoteForm] = useState({ title: "", content: "" });
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      loadMoodItems();
      loadSelfNotes();
    }
  }, [isAuthenticated]);

  const loadMoodItems = async () => {
    try {
      const response = await api.get("/personality/mood-items");
      if (response.data) {
        setBoosters(response.data.boosters || []);
        setDrainers(response.data.drainers || []);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const loadSelfNotes = async () => {
    try {
      const response = await api.get("/personality/self-notes");
      if (response.data) {
        setSelfNotes(response.data);
      }
    } catch (error) {}
  };

  const addBooster = () => {
    if (newBooster.trim()) {
      const newItem: MoodItem = {
        id: Date.now().toString(),
        text: newBooster.trim(),
        type: "booster",
      };
      setBoosters([...boosters, newItem]);
      setNewBooster("");
      showToast("Фактор добавлен", "success");
    }
  };

  const addDrainer = () => {
    if (newDrainer.trim()) {
      const newItem: MoodItem = {
        id: Date.now().toString(),
        text: newDrainer.trim(),
        type: "drainer",
      };
      setDrainers([...drainers, newItem]);
      setNewDrainer("");
      showToast("Фактор добавлен", "success");
    }
  };

  const removeBooster = async (id: string) => {
    const confirmed = await showConfirm(
      "Удалить фактор?",
      "Вы уверены, что хотите удалить этот фактор?",
      "danger",
    );
    if (confirmed) {
      setBoosters(boosters.filter((b) => b.id !== id));
      showToast("Фактор удалён", "success");
    }
  };

  const removeDrainer = async (id: string) => {
    const confirmed = await showConfirm(
      "Удалить фактор?",
      "Вы уверены, что хотите удалить этот фактор?",
      "danger",
    );
    if (confirmed) {
      setDrainers(drainers.filter((d) => d.id !== id));
      showToast("Фактор удалён", "success");
    }
  };

  const saveItems = async () => {
    setSaving(true);
    try {
      await api.post("/personality/mood-items", {
        boosters: boosters.map(({ id, text, type }) => ({ id, text, type })),
        drainers: drainers.map(({ id, text, type }) => ({ id, text, type })),
      });
      showToast("Сохранено!", "success");
    } catch (error: any) {
      if (error.response?.status === 401) {
        showToast("Ошибка авторизации. Пожалуйста, войдите заново.", "error");
      } else {
        showToast("Ошибка сохранения", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const saveSelfNote = async () => {
    if (!noteForm.title.trim()) {
      showToast("Введите название заметки", "warning");
      return;
    }

    try {
      if (editingNote) {
        await api.put(`/personality/self-notes/${editingNote.id}`, noteForm);
        showToast("Заметка обновлена", "success");
      } else {
        await api.post("/personality/self-notes", noteForm);
        showToast("Заметка создана", "success");
      }
      setShowNoteModal(false);
      setEditingNote(null);
      setNoteForm({ title: "", content: "" });
      loadSelfNotes();
    } catch (error) {
      showToast("Ошибка сохранения", "error");
    }
  };

  const deleteSelfNote = async (id: string) => {
    const confirmed = await showConfirm(
      "Удалить заметку?",
      "Вы уверены, что хотите удалить эту заметку?",
      "danger",
    );
    if (confirmed) {
      try {
        await api.delete(`/personality/self-notes/${id}`);
        loadSelfNotes();
        showToast("Заметка удалена", "success");
      } catch (error) {
        showToast("Ошибка удаления", "error");
      }
    }
  };

  const editSelfNote = (note: SelfNote) => {
    setEditingNote(note);
    setNoteForm({ title: note.title, content: note.content });
    setShowNoteModal(true);
  };

  if (loading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-pink-900 mb-4">
        Что влияет на твое настроение?
      </h2>
      <p className="text-gray-600 mb-6">
        Записывай, что повышает твое настроение, а что его понижает. Это поможет
        лучше понимать себя и управлять эмоциями.
      </p>

      <div className="grid md:grid-cols-2 bg-white md:p-4 p-3 shadow-md border-[1px] rounded-lg border-pink-200 gap-8 mb-8">
        {/* Повышающие факторы */}
        <div className="bg-pink-100 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-6 h-6 text-pink-600 fill-pink-600" />
            <h3 className="text-md font-semibold text-gray-800">
              Повышает настроение
            </h3>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newBooster}
              onChange={(e) => setNewBooster(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addBooster()}
              placeholder="Прогулка, музыка, кофе..."
              className="flex-1 p-2 text-sm  bg-pink-100 focus:outline-none outline-none "
            />
            <button
              onClick={addBooster}
              className="px-3 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {boosters.map((item) => (
              <div
                key={item.id}
                className="flex justify-between hover:text-red-500 items-center p-2 border-b-[1px] border-pink-200 "
              >
                <span className="text-gray-800"> {item.text}</span>
                <button
                  onClick={() => removeBooster(item.id)}
                  className=" text-red-500"
                >
                  <Trash2 className="w-6 h-6 p-1 rounded-lg hover:bg-pink-200 duration-300" />
                </button>
              </div>
            ))}
            {boosters.length === 0 && (
              <p className="text-gray-400 text-center py-4">
                Пока ничего не добавлено
              </p>
            )}
          </div>
        </div>

        <div className="bg-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-md font-semibold text-gray-800">
              Понижает настроение
            </h3>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newDrainer}
              onChange={(e) => setNewDrainer(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addDrainer()}
              placeholder="Стресс, одиночество..."
              className="flex-1 p-2 text-sm outline-none focus:outline-none bg-gray-200"
            />
            <button
              onClick={addDrainer}
              className="px-3 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {drainers.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-2 border-b-[1px] border-gray-300 "
              >
                <span className="text-gray-800"> {item.text}</span>
                <button
                  onClick={() => removeDrainer(item.id)}
                  className="text-red-500 "
                >
                  <Trash2 className="w-6 hover:bg-pink-200 rounded-lg p-1 h-6" />
                </button>
              </div>
            ))}
            {drainers.length === 0 && (
              <p className="text-gray-400 text-center py-4">
                Пока ничего не добавлено
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center mb-8">
        <button
          onClick={saveItems}
          disabled={saving}
          className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
        >
          {saving ? "Сохранение..." : "Сохранить факторы"}
        </button>
      </div>

      <div className="bg-pink-50 rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-pink-900">
              Заметки о себе
            </h3>
          </div>
          <button
            onClick={() => {
              setEditingNote(null);
              setNoteForm({ title: "", content: "" });
              setShowNoteModal(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-pink-500 text-white rounded-lg duration-300 hover:bg-pink-600 text-sm"
          >
            <Plus className="w-4 h-4" /> Добавить заметку
          </button>
        </div>

        <p className="text-pink-600 text-sm mb-4">
          Важные напоминания о себе, своих желаниях, мечтах и решениях. То, что
          не хочется забыть.
        </p>

        <div className="space-y-3">
          {selfNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => editSelfNote(note)}
              className="bg-white rounded-lg border border-pink-200 p-4 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-800">{note.title}</h4>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSelfNote(note.id);
                    }}
                    className="text-red-500"
                  >
                    <Trash2 className="w-6 h-6 hover:bg-pink-200 rounded-lg p-1" />
                  </button>
                </div>
              </div>
              <div
                className="text-gray-600 text-sm prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: note.content }}
              />
              <div className="text-xs text-gray-400 mt-2">
                {new Date(note.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
          {selfNotes.length === 0 && (
            <p className="text-gray-400 text-center py-4">
              Нет заметок. Добавьте первую!
            </p>
          )}
        </div>
      </div>

      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-pink-950">
              {editingNote ? "Редактировать заметку" : "Новая заметка о себе"}
            </h2>

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={noteForm.title}
                  onChange={(e) =>
                    setNoteForm({ ...noteForm, title: e.target.value })
                  }
                  className="w-full p-2 outline-none text-pink-950 border-b-[1px] border-pink-200"
                  placeholder="Название"
                />
              </div>
              <div>
                <textarea
                  value={noteForm.content}
                  onChange={(e) =>
                    setNoteForm({ ...noteForm, content: e.target.value })
                  }
                  rows={8}
                  className="w-full text-pink-950 p-2 outline-none"
                  placeholder="Что важно для тебя? Что не хочешь забыть? Какие у тебя цели и мечты?"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={saveSelfNote}
                  className="flex-1 bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600 transition"
                >
                  Сохранить
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

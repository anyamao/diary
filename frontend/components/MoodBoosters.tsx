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
      console.error("Failed to load mood items:", error);
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
    } catch (error) {
      console.error("Failed to load self notes:", error);
    }
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
    }
  };

  const removeBooster = (id: string) => {
    setBoosters(boosters.filter((b) => b.id !== id));
  };

  const removeDrainer = (id: string) => {
    setDrainers(drainers.filter((d) => d.id !== id));
  };

  const saveItems = async () => {
    setSaving(true);
    try {
      await api.post("/personality/mood-items", {
        boosters: boosters.map(({ id, text, type }) => ({ id, text, type })),
        drainers: drainers.map(({ id, text, type }) => ({ id, text, type })),
      });
      alert("Сохранено!");
    } catch (error: any) {
      console.error("Failed to save:", error);
      if (error.response?.status === 401) {
        alert("Ошибка авторизации. Пожалуйста, войдите заново.");
      } else {
        alert("Ошибка сохранения");
      }
    } finally {
      setSaving(false);
    }
  };

  // Функции для работы с заметками о себе
  const saveSelfNote = async () => {
    if (!noteForm.title.trim()) {
      alert("Введите название заметки");
      return;
    }

    try {
      if (editingNote) {
        await api.put(`/personality/self-notes/${editingNote.id}`, noteForm);
      } else {
        await api.post("/personality/self-notes", noteForm);
      }
      setShowNoteModal(false);
      setEditingNote(null);
      setNoteForm({ title: "", content: "" });
      loadSelfNotes();
    } catch (error) {
      console.error("Failed to save note:", error);
      alert("Ошибка сохранения");
    }
  };

  const deleteSelfNote = async (id: string) => {
    if (confirm("Удалить эту заметку?")) {
      try {
        await api.delete(`/personality/self-notes/${id}`);
        loadSelfNotes();
      } catch (error) {
        console.error("Failed to delete note:", error);
        alert("Ошибка удаления");
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
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Что влияет на твое настроение?
      </h2>
      <p className="text-gray-600 mb-6">
        Записывай, что повышает твое настроение, а что его понижает. Это поможет
        лучше понимать себя и управлять эмоциями.
      </p>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Повышающие факторы */}
        <div className="bg-green-50 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-6 h-6 text-green-600 fill-green-600" />
            <h3 className="text-xl font-semibold text-gray-800">
              Повышает настроение
            </h3>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newBooster}
              onChange={(e) => setNewBooster(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addBooster()}
              placeholder="Например: прогулка, музыка, кофе..."
              className="flex-1 p-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={addBooster}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {boosters.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-2 bg-white rounded-lg border border-green-200"
              >
                <span className="text-gray-800">✨ {item.text}</span>
                <button
                  onClick={() => removeBooster(item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
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

        {/* Понижающие факторы */}
        <div className="bg-red-50 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Frown className="w-6 h-6 text-red-600" />
            <h3 className="text-xl font-semibold text-gray-800">
              Понижает настроение
            </h3>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newDrainer}
              onChange={(e) => setNewDrainer(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addDrainer()}
              placeholder="Например: стресс, одиночество, дождь..."
              className="flex-1 p-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              onClick={addDrainer}
              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {drainers.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-2 bg-white rounded-lg border border-red-200"
              >
                <span className="text-gray-800">💧 {item.text}</span>
                <button
                  onClick={() => removeDrainer(item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
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

      {/* Заметки о себе */}
      <div className="bg-yellow-50 rounded-xl p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <StickyNote className="w-6 h-6 text-yellow-600" />
            <h3 className="text-xl font-semibold text-gray-800">
              Заметки о себе
            </h3>
          </div>
          <button
            onClick={() => {
              setEditingNote(null);
              setNoteForm({ title: "", content: "" });
              setShowNoteModal(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
          >
            <Plus className="w-4 h-4" /> Добавить заметку
          </button>
        </div>

        <p className="text-gray-600 text-sm mb-4">
          Важные напоминания о себе, своих желаниях, мечтах и решениях. То, что
          не хочется забыть.
        </p>

        <div className="space-y-3">
          {selfNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-lg border border-yellow-200 p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-800">{note.title}</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => editSelfNote(note)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteSelfNote(note.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
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

      <div className="mt-8 flex justify-center">
        <button
          onClick={saveItems}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Сохранение..." : "Сохранить списки"}
        </button>
      </div>

      <div className="mt-6 p-4 bg-purple-50 rounded-lg">
        <p className="text-sm text-purple-800">
          💡 Совет: Регулярно обновляй этот список и старайся включать больше
          "повышающих" активностей в свою жизнь, а также минимизировать влияние
          "понижающих" факторов. Это один из ключей к эмоциональному
          благополучию!
        </p>
      </div>

      {/* Модальное окно для заметки */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingNote ? "Редактировать заметку" : "Новая заметка о себе"}
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
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Например: Важно помнить..."
                />
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
                  rows={8}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Что важно для тебя? Что не хочешь забыть? Какие у тебя цели и мечты?"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={saveSelfNote}
                  className="flex-1 bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition"
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

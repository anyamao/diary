"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, Pin, PinOff } from "lucide-react";
import MarkdownEditor from "@/components/MarkdownEditor";

export default function EditBusinessNotePage() {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: "",
    is_pinned: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (params.id) {
      fetchNote();
    }
  }, [isAuthenticated, params.id]);

  const fetchNote = async () => {
    try {
      const response = await api.get(`/business-notes/${params.id}`);
      setFormData(response.data);
    } catch (error) {
      console.error("Failed to fetch note:", error);
      router.push("/business/notes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put(`/business-notes/${params.id}`, formData);
      router.push("/business/notes");
    } catch (error) {
      console.error("Failed to update note:", error);
      alert("Не удалось обновить заметку");
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async () => {
    if (confirm("Удалить эту заметку?")) {
      try {
        await api.delete(`/business-notes/${params.id}`);
        router.push("/business/notes");
      } catch (error) {
        console.error("Failed to delete note:", error);
        alert("Ошибка удаления");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6 flex justify-between items-center">
          <Link
            href="/business/notes"
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Назад к заметкам
          </Link>
          <button
            onClick={deleteNote}
            className="text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" /> Удалить
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Редактировать заметку
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Заголовок *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Содержание (поддерживается Markdown)
              </label>
              <MarkdownEditor
                value={formData.content}
                onChange={(value) =>
                  setFormData({ ...formData, content: value })
                }
                placeholder="Опиши свою идею здесь..."
                rows={12}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Теги (через запятую)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="например, идея, проект, стартап, веб-приложение"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="pinned"
                checked={formData.is_pinned}
                onChange={(e) =>
                  setFormData({ ...formData, is_pinned: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="pinned" className="text-gray-700">
                Закрепить заметку (будет показываться вверху списка)
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? "Сохранение..." : "💾 Сохранить изменения"}
              </button>
              <Link
                href="/business/notes"
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

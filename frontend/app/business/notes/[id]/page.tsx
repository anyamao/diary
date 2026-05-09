"use client";
import Loading from "@/components/Loading";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bookmark, EllipsisVertical } from "lucide-react";
import MarkdownEditor from "@/components/MarkdownEditor";
import { showToast } from "@/components/Toast";
import { showConfirm } from "@/components/ConfirmDialog";
import EntryInfoModal from "@/components/EntryInfoModal";

interface BusinessNote {
  id: string;
  title: string;
  content: string;
  tags: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export default function EditBusinessNotePage() {
  const [formData, setFormData] = useState<BusinessNote>({
    id: "",
    title: "",
    content: "",
    tags: "",
    is_pinned: false,
    created_at: "",
    updated_at: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push("/login");
      return;
    }
    if (params.id) {
      fetchNote();
    }
  }, [isAuthenticated, isLoading, params.id]);

  const fetchNote = async () => {
    try {
      const response = await api.get(`/business-notes/${params.id}`);
      setFormData(response.data);
    } catch (error) {
      showToast("Не удалось загрузить заметку", "error");
      router.push("/business/notes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const noteData = {
        title: formData.title,
        content: formData.content,
        tags: formData.tags || "",
        is_pinned: formData.is_pinned,
      };

      await api.put(`/business-notes/${params.id}`, noteData);
      showToast("Заметка успешно обновлена!", "success");
      router.push("/business/notes");
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.detail?.[0]?.msg ||
        error.response?.data?.detail ||
        "Не удалось обновить заметку";
      setError(errorMsg);
      showToast(errorMsg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    const form = document.querySelector("form");
    if (form) {
      form.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true }),
      );
    }
  };

  const togglePinned = () => {
    setFormData({ ...formData, is_pinned: !formData.is_pinned });
  };

  const deleteNote = async () => {
    const confirmed = await showConfirm(
      "Удалить заметку?",
      "Вы уверены, что хотите удалить эту заметку? Это действие нельзя отменить.",
      "danger",
    );

    if (confirmed) {
      try {
        await api.delete(`/business-notes/${params.id}`);
        showToast("Заметка удалена", "success");
        router.push("/business/notes");
      } catch (error) {
        showToast("Не удалось удалить заметку", "error");
      }
    }
  };

  if (loading) {
    return <Loading></Loading>;
  }

  return (
    <div className="h-full w-full min-h-screen bg-pink-50 py-8 flex justify-center">
      <div className="w-full h-full max-w-[1100px] flex flex-col flex-1">
        <div className="flex flex-row justify-between items-center text-pink-900">
          <Link href="/business/notes" className="text-pink-900">
            <ArrowLeft className="w-5 h-5 md:ml-[40px] ml-[10px]" />
          </Link>
          <div className="flex flex-row mr-[10px] items-center">
            <button
              type="button"
              onClick={togglePinned}
              className="mr-[20px] cursor-pointer transition hover:scale-110"
              title={
                formData.is_pinned ? "Убрать из закрепленных" : "Закрепить"
              }
            >
              <Bookmark
                className={`w-5 h-5 ${formData.is_pinned ? "fill-yellow-500 text-yellow-500" : "text-pink-900"}`}
              />
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-pink-500 duration-300 mr-[5px] text-white text-sm hover:bg-pink-600 cursor-pointer font-semibold py-[5px] px-[10px] rounded-lg disabled:opacity-50"
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
            <button
              onClick={() => setShowInfo(true)}
              className="text-gray-500 hover:text-gray-700 transition"
            >
              <EllipsisVertical className="w-5 h-5 mr-[10px] cursor-pointer hover:text-pink-700" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm mx-4">
            Ошибка: {error}
          </div>
        )}

        <div className="rounded-lg p-2  md:p-8 text-pink-950">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-2 bg-pink-50 border-b-2 border-pink-200 focus:outline-none focus:border-pink-500 text-lg"
                placeholder="Название заметки..."
              />
            </div>

            <div>
              <MarkdownEditor
                value={formData.content}
                onChange={(value) =>
                  setFormData({ ...formData, content: value })
                }
                placeholder="Пиши свои идеи здесь... (Поддерживается Markdown)"
                rows={12}
              />
            </div>

            <div>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                className="w-full px-4 py-2 bg-pink-50 border-b-2 border-pink-200 focus:outline-none focus:border-pink-500 text-lg"
                placeholder="Теги (через запятую)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Теги помогут группировать похожие идеи. Разделяйте их запятыми.
              </p>
            </div>
          </form>
        </div>
      </div>

      {showInfo && (
        <EntryInfoModal
          createdAt={formData.created_at}
          updatedAt={formData.updated_at}
          contentLength={formData.content.length}
          titleLength={formData.title.length}
          isFavorite={formData.is_pinned}
          onClose={() => setShowInfo(false)}
        />
      )}
    </div>
  );
}

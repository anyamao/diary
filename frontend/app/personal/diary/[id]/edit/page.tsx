"use client";

import { eventBus } from "@/lib/eventBus";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import Link from "next/link";
import {
  X,
  ListChevronsUpDown,
  RotateCcw,
  ArrowLeft,
  Bookmark,
  EllipsisVertical,
  Calendar,
} from "lucide-react";
import MarkdownEditor from "@/components/MarkdownEditor";
import EmotionPicker from "@/components/EmotionPicker";
import QuestionsModal from "@/components/QuestionsModal";
import EntryInfoModal from "@/components/EntryInfoModal";
import DatePicker from "@/components/DatePicker";
import SleepInDiary from "@/components/SleepInDiary";
import { showToast } from "@/components/Toast";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditEntryPage({ params }: PageProps) {
  const { id: entryId } = use(params);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    mood: "noemotions",
    tags: "",
    is_favorite: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEmotionPicker, setShowEmotionPicker] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const selectedDate = formData.created_at
    ? formData.created_at.split("T")[0]
    : new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (entryId) {
      fetchEntry();
    }
  }, [isAuthenticated, entryId]);

  const fetchEntry = async () => {
    try {
      const response = await api.get(`/diary/entries/${entryId}`);
      setFormData(response.data);
    } catch (error) {
      console.error("Failed to fetch entry:", error);
      showToast("Не удалось загрузить запись", "error");
      router.push("/personal/diary");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put(`/diary/entries/${entryId}`, formData);
      eventBus.emit("diary-entry-updated");
      showToast("Запись успешно обновлена!", "success");
      router.push("/personal/diary");
    } catch (error) {
      console.error("Failed to update entry:", error);
      showToast("Не удалось обновить запись", "error");
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
      eventBus.emit("diary-entry-updated");
    }
  };

  const toggleFavorite = () => {
    setFormData({ ...formData, is_favorite: !formData.is_favorite });
  };

  const handleQuestionSelect = (question: string) => {
    setFormData({
      ...formData,
      content: formData.content + "\n\n> **Вопрос дня:** " + question + "\n",
    });
    setShowQuestions(false);
  };

  const getEmotionImage = () => {
    const emotion = formData.mood || "noemotions";
    return `/${emotion}.png`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleString("ru-RU", { month: "long" }),
      year: date.getFullYear(),
    };
  };

  const handleDateChange = (newDate: Date) => {
    setFormData({ ...formData, created_at: newDate.toISOString() });
  };

  const date = formData.created_at ? formatDate(formData.created_at) : null;

  if (loading) {
    return (
      <div className="h-full w-full min-h-[1200px] bg-pink-50 flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full min-h-[1200px] bg-pink-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex flex-row justify-between items-center text-pink-900">
          <Link href="/personal/diary" className="text-pink-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-row items-center">
            <button
              type="button"
              onClick={toggleFavorite}
              className="mr-[20px] cursor-pointer transition hover:scale-110"
              title={
                formData.is_favorite ? "Убрать из избранного" : "В избранное"
              }
            >
              <Bookmark
                className={`w-5 h-5 ${formData.is_favorite ? "fill-yellow-500 text-yellow-500" : "text-pink-900"}`}
              />
            </button>
            <button
              onClick={() => setShowQuestions(true)}
              className="mr-[10px] text-sm border-pink-900 hover:bg-pink-200 duration-300 cursor-pointer border-[1px] px-[10px] py-[5px] rounded-lg"
            >
              Вопросы
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
              className="cursor-pointer hover:text-pink-700"
            >
              <EllipsisVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="rounded-lg p-8 text-pink-950">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-row items-center justify-between">
              <button
                type="button"
                onClick={() => setShowDatePicker(true)}
                className="flex flex-row items-center gap-2 cursor-pointer hover:opacity-70 transition"
              >
                <Calendar className="w-4 h-4 text-pink-500" />
                {date && (
                  <>
                    <p className="text-[20px] font-medium">{date.day}</p>
                    <p className="text-sm text-gray-600">
                      {date.month} {date.year}
                    </p>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowEmotionPicker(true)}
                className="cursor-pointer hover:scale-110 transition-transform"
              >
                <img
                  src={getEmotionImage()}
                  alt="emotion"
                  className="w-[50px] h-[50px]"
                />
              </button>
            </div>

            <SleepInDiary date={selectedDate} />

            <div>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-2 bg-pink-50 border-b-2 border-pink-200 focus:outline-none focus:border-pink-500 text-lg"
                placeholder="Название..."
              />
            </div>

            <div>
              <MarkdownEditor
                value={formData.content}
                onChange={(value) =>
                  setFormData({ ...formData, content: value })
                }
                placeholder="Пиши свои мысли здесь... (Поддерживается Markdown)"
                rows={12}
              />
            </div>
          </form>
        </div>
      </div>

      {showEmotionPicker && (
        <EmotionPicker
          currentEmotion={formData.mood}
          onSelectEmotion={(emotion) =>
            setFormData({ ...formData, mood: emotion })
          }
          onClose={() => setShowEmotionPicker(false)}
        />
      )}

      {showQuestions && (
        <QuestionsModal
          onSelectQuestion={handleQuestionSelect}
          onClose={() => setShowQuestions(false)}
        />
      )}

      {showInfo && (
        <EntryInfoModal
          createdAt={formData.created_at}
          updatedAt={formData.updated_at}
          contentLength={formData.content.length}
          titleLength={formData.title.length}
          isFavorite={formData.is_favorite}
          onClose={() => setShowInfo(false)}
        />
      )}

      {showDatePicker && (
        <DatePicker
          currentDate={new Date(formData.created_at)}
          onDateChange={handleDateChange}
          onClose={() => setShowDatePicker(false)}
        />
      )}
    </div>
  );
}

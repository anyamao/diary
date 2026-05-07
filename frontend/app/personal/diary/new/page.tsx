"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import Link from "next/link";
import { ArrowLeft, Bookmark, EllipsisVertical, Calendar } from "lucide-react";
import MarkdownEditor from "@/components/MarkdownEditor";
import EmotionPicker from "@/components/EmotionPicker";
import DatePicker from "@/components/DatePicker";
import SleepInDiary from "@/components/SleepInDiary";
import { eventBus } from "@/lib/eventBus";
import { showToast } from "@/components/Toast";

// Функция для получения даты в UTC без смещения
const getUTCDate = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};

// Форматирование даты для отображения
const formatDisplayDate = (dateString: string) => {
  const date = new Date(dateString);
  return {
    day: date.getUTCDate(),
    month: date.toLocaleString("ru-RU", { month: "long", timeZone: "UTC" }),
    year: date.getUTCFullYear(),
  };
};

export default function NewEntryPage() {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    mood: "noemotions",
    tags: "",
    is_favorite: false,
    created_at: getUTCDate().toISOString(),
  });
  const [saving, setSaving] = useState(false);
  const [showEmotionPicker, setShowEmotionPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  if (!isAuthenticated && !isLoading) {
    router.push("/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const entryData = {
        title: formData.title,
        content: formData.content,
        mood: formData.mood,
        tags: formData.tags || "",
        is_favorite: formData.is_favorite,
        created_at: formData.created_at,
      };

      console.log("Sending entry:", entryData);
      await api.post("/diary/entries", entryData);
      eventBus.emit("diary-entry-created");
      showToast("Запись успешно создана!", "success");
      router.push("/personal/diary");
    } catch (error: any) {
      console.error("Failed to save entry:", error);
      const errorMsg =
        error.response?.data?.detail?.[0]?.msg ||
        error.response?.data?.detail ||
        "Не удалось сохранить запись";
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

  const handleDateChange = (newDate: Date) => {
    const utcDate = new Date(
      Date.UTC(newDate.getFullYear(), newDate.getMonth(), newDate.getDate()),
    );
    setFormData({ ...formData, created_at: utcDate.toISOString() });
    setShowDatePicker(false);
  };

  const toggleFavorite = () => {
    setFormData({ ...formData, is_favorite: !formData.is_favorite });
  };

  const getEmotionImage = () => {
    const emotion = formData.mood || "noemotions";
    return `/${emotion}.png`;
  };

  const date = formatDisplayDate(formData.created_at);
  const selectedDate = formData.created_at.split("T")[0];

  return (
    <div className="h-full w-full min-h-screen bg-pink-50 py-8  flex justify-center">
      <div className="w-full h-full max-w-[1100px] flex flex-col flex-1 ">
        <div className="flex flex-row justify-between items-center text-pink-900">
          <Link href="/personal/diary" className="text-pink-900">
            <ArrowLeft className="w-5 h-5 ml-[40px]" />
          </Link>
          <div className="flex flex-row mr-[10px] items-center">
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
            <p className="mr-[15px] text-sm border-pink-900 hover:bg-pink-200 duration-300 cursor-pointer border-[1px] px-[10px] py-[5px] rounded-lg">
              Вопросы
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-pink-500 duration-300 mr-[5px] text-white text-sm hover:bg-pink-600 cursor-pointer font-semibold py-[5px] px-[10px] rounded-lg disabled:opacity-50"
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            Ошибка: {error}
          </div>
        )}

        <div className="rounded-lg p-8 text-pink-950">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-row items-center justify-between">
              <div className="flex flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDatePicker(true)}
                  className="flex flex-row items-center gap-2 cursor-pointer hover:opacity-70 transition bg-white px-3 py-1 rounded-full"
                >
                  <Calendar className="w-4 h-4 text-pink-500" />
                  <p className="text-[20px] font-medium">{date.day}</p>
                  <p className="text-sm text-gray-600">
                    {date.month} {date.year}
                  </p>
                </button>
              </div>

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

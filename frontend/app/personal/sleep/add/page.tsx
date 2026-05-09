"use client";
import Loading from "@/components/Loading";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SleepInDiary from "@/components/SleepInDiary";
import { showToast } from "@/components/Toast";

export default function AddSleepPage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSaved, setIsSaved] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  const handleSleepSaved = () => {
    if (!isSaved) {
      setIsSaved(true);
      showToast("Запись о сне успешно сохранена!", "success");
    }
  };

  return (
    <div className="min-h-screen bg-pink-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Link
            href="/personal/sleep"
            className="text-pink-600 hover:text-pink-700"
          >
            ← Назад к трекеру
          </Link>
          {isSaved && (
            <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
              ✓ Сохранено
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-3 md:p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Добавить запись о сне
          </h1>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дата
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setIsSaved(false);
              }}
              max={new Date().toISOString().split("T")[0]}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
              required
            />
          </div>

          <SleepInDiary date={date} onSleepSaved={handleSleepSaved} />
        </div>
      </div>
    </div>
  );
}

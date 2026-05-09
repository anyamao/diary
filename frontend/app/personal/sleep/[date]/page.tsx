"use client";

import Loading from "@/components/Loading";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import SleepInDiary from "@/components/SleepInDiary";
import { showToast } from "@/components/Toast";

export default function EditSleepPage() {
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const date = params.date as string;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    setLoading(false);
  }, [isAuthenticated]);

  const handleSleepSaved = () => {
    if (!isSaved) {
      setIsSaved(true);
      showToast("Запись о сне успешно обновлена!", "success");
    }
  };

  if (loading) {
    return <Loading></Loading>;
  }

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

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Редактировать запись о сне
          </h1>

          <p className="text-gray-600 mb-4">
            Дата: {new Date(date).toLocaleDateString("ru-RU")}
          </p>

          <SleepInDiary date={date} onSleepSaved={handleSleepSaved} />
        </div>
      </div>
    </div>
  );
}

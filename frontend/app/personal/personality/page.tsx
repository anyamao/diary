"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Brain,
  Heart,
  Smile,
  Frown,
  FileText,
  ClipboardList,
  Activity,
} from "lucide-react";

// Компоненты тестов
import PersonalityTest from "@/components/PersonalityTest";
import DepressionTest from "@/components/DepressionTest";
import MoodBoosters from "@/components/MoodBoosters";

export default function PersonalityPage() {
  const [activeTab, setActiveTab] = useState<
    "personality" | "depression" | "mood"
  >("personality");
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Моя личность</h1>
        <p className="text-gray-600 mb-8">
          Узнай себя лучше через тесты и самонаблюдение
        </p>

        {/* Навигация */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setActiveTab("personality")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition ${
              activeTab === "personality"
                ? "bg-purple-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-purple-50"
            }`}
          >
            <Brain className="w-5 h-5" />
            Тип личности
          </button>
          <button
            onClick={() => setActiveTab("depression")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition ${
              activeTab === "depression"
                ? "bg-purple-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-purple-50"
            }`}
          >
            <Activity className="w-5 h-5" />
            Психологическое состояние
          </button>
          <button
            onClick={() => setActiveTab("mood")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition ${
              activeTab === "mood"
                ? "bg-purple-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-purple-50"
            }`}
          >
            <Heart className="w-5 h-5" />
            Настроение и ресурсы
          </button>
        </div>

        {/* Контент */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {activeTab === "personality" && <PersonalityTest />}
          {activeTab === "depression" && <DepressionTest />}
          {activeTab === "mood" && <MoodBoosters />}
        </div>
      </div>
    </div>
  );
}

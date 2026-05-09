"use client";
import Loading from "@/components/Loading";
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
    return <Loading></Loading>;
  }

  return (
    <div className="min-h-screen bg-pink-50 p-8">
      <div className="max-w-[1100px] mx-auto">
        <h1 className="text-3xl font-bold text-pink-950 mb-2">Моя личность</h1>

        <p className="text-gray-600 mb-8">
          Узнай себя лучше через тесты и самонаблюдение
        </p>
        <div className="flex md:flex-row flex-col md:items-center  ">
          <div className="flex text-xs sm:text-sm">
            <button
              onClick={() => setActiveTab("personality")}
              className={`px-4 py-2 h-[35px] rounded-lg transition ${
                activeTab === "personality"
                  ? "bg-pink-500 text-white"
                  : "bg-white text-gray-700 hover:bg-pink-100"
              }`}
            >
              Тип личности
            </button>
            <button
              onClick={() => setActiveTab("depression")}
              className={`px-4 py-2 h-[35px] rounded-lg ml-[20px] transition ${
                activeTab === "depression"
                  ? "bg-pink-500 text-white"
                  : "bg-white text-gray-700 hover:bg-pink-100"
              }`}
            >
              Психологическое состояние
            </button>
          </div>
          <div className="flex">
            <button
              onClick={() => setActiveTab("mood")}
              className={`px-4 py-2 text-xs h-[35px] mt-[10px] md:ml-[20px] md:mt-[0px]  rounded-lg transition ${
                activeTab === "mood"
                  ? "bg-pink-500 text-white"
                  : "bg-white text-gray-700 hover:bg-pink-100"
              }`}
            >
              Настроение и ресурсы
            </button>
          </div>
        </div>

        <div className=" mt-[30px]">
          {activeTab === "personality" && <PersonalityTest />}
          {activeTab === "depression" && <DepressionTest />}
          {activeTab === "mood" && <MoodBoosters />}
        </div>
      </div>
    </div>
  );
}

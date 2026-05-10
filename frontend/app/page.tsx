"use client";

import Link from "next/link";
import {
  BookOpen,
  Moon,
  BarChart3,
  Brain,
  Heart,
  Calendar,
  Timer,
  NotebookPen,
  Sparkles,
  ArrowRight,
  Star,
  Smile,
  TrendingUp,
  Shield,
} from "lucide-react";

export default function HomePage() {
  const personalFeatures = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Дневник",
      description:
        "Записывай мысли, отмечай настроение, сохраняй важные моменты",
      link: "/personal/diary",
      color: "bg-pink-100 text-pink-600",
    },
    {
      icon: <Moon className="w-6 h-6" />,
      title: "Трекер сна",
      description: "Анализируй свой сон, записывай сны и улучшай режим",
      link: "/personal/sleep",
      color: "bg-purple-100 text-purple-600",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Трекер настроения",
      description: "Отслеживай эмоции и смотри статистику",
      link: "/personal/mood-tracker",
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Тесты личности",
      description: "Узнай себя через научные психологические тесты",
      link: "/personal/personality",
      color: "bg-green-100 text-green-600",
    },
  ];

  const businessFeatures = [
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Планер",
      description: "Планируй задачи по дням с цветными тегами",
      link: "/business/planner",
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      icon: <Timer className="w-6 h-6" />,
      title: "Study Timer",
      description: "Отслеживай время учёбы и смотри статистику",
      link: "/business/study-timer",
      color: "bg-orange-100 text-orange-600",
    },
    {
      icon: <NotebookPen className="w-6 h-6" />,
      title: "Заметки",
      description: "Сохраняй идеи и важную информацию в Markdown",
      link: "/business/notes",
      color: "bg-teal-100 text-teal-600",
    },
  ];

  const stats = [
    {
      icon: <Star className="w-5 h-5" />,
      value: "5",
      label: "вебсайтов в одном",
    },
    {
      icon: <Smile className="w-5 h-5" />,
      value: "8",
      label: "типов настроения",
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      value: "4",
      label: "психологических теста",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      value: "100%",
      label: "твои данные в безопасности",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-pink-50">
      <div className="relative overflow-hidden pt-[120px] pb-16 md:pb-24">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5" />
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-pink-200 px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-pink-700" />
            <span className="text-sm font-medium text-pink-800">
              Добро пожаловать
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-pink-900 mb-6">
            VibeNote
            <span className="block text-2xl md:text-3xl text-gray-600 mt-2">
              Твой личный дневник для осознанности
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Веди дневник, отслеживай настроение и сон, планируй задачи и узнавай
            себя лучше
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-pink-600 text-white px-8 py-3 rounded-xl hover:bg-pink-700 transition flex items-center justify-center gap-2 text-lg"
            >
              Войти в аккаунт
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/register"
              className="bg-white text-pink-600 border-2 border-pink-200 px-8 py-3 rounded-xl hover:bg-pink-50 transition flex items-center justify-center gap-2 text-lg"
            >
              Зарегестрироваться
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-pink-100 rounded-full mb-3 text-pink-600">
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-pink-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-pink-900 mb-3">
            Личное пространство
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Для саморефлексии, заботы о себе и понимания своих эмоций
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {personalFeatures.map((feature, index) => (
            <Link
              key={index}
              href={feature.link}
              className="group bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-pink-100 hover:border-pink-300"
            >
              <div
                className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500">{feature.description}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-pink-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-pink-900 mb-3">
              Рабочее пространство
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Для продуктивности, планирования и достижения целей
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {businessFeatures.map((feature, index) => (
              <Link
                key={index}
                href={feature.link}
                className="group bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-pink-100 hover:border-pink-300"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="bg-pink-100 rounded-3xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-pink-900 mb-4">
            Готов начать свой путь к осознанности?
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Присоединяйся к сообществу VibeNote и начни лучше понимать себя
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-pink-600 text-white px-8 py-3 rounded-xl hover:bg-pink-700 transition text-lg"
          >
            Создать аккаунт
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

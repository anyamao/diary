"use client";

import {
  Calendar,
  Timer,
  NotebookPen,
  Target,
  Sparkles,
  Clock,
} from "lucide-react";

export default function BusinessPage() {
  const features = [
    {
      icon: <Calendar className="w-8 h-8 text-pink-600" />,
      title: "Планер",
      description:
        "Планируй свою неделю визуально! Отмечай важные дни звёздочками, добавляй задачи с указанием времени. Нажми на любой день, чтобы увидеть детали и управлять задачами. Все задачи цветные — легко ориентироваться!",
      benefits: [
        "Визуальное планирование",
        "Цветные теги для задач",
        "Важные дни с подсветкой",
        "Детальный просмотр дня",
      ],
    },
    {
      icon: <NotebookPen className="w-8 h-8 text-pink-600" />,
      title: "Заметки",
      description:
        "Сохраняй бизнес-идеи и важные заметки! Поддерживается Markdown — можешь форматировать текст, добавлять заголовки, списки и ссылки. Закрепляй важные заметки, чтобы они всегда были на виду.",
      benefits: [
        "Markdown поддержка",
        "Закрепление важного",
        "Поиск по заметкам",
        "Теги для категорий",
      ],
    },
    {
      icon: <Timer className="w-8 h-8 text-pink-600" />,
      title: "Study Timer",
      description:
        "Твой личный трекер продуктивности! Засекай время на учёбу, выбирай цветные теги для разных предметов, добавляй описание к сессии. Статистика покажет, сколько времени ты уделил каждому предмету.",
      benefits: [
        "Трекинг времени",
        "Цветные теги предметов",
        "Подробная статистика",
        "История всех сессий",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-pink-100 pt-[60px] pb-16">
      <div className="max-w-6xl mx-auto px-4">
        {/* Hero секция */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-pink-200 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-pink-700" />
            <span className="text-sm font-medium text-pink-800">
              Business Section
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-pink-900 mb-4">
            Управляй своими проектами
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Всё для продуктивной работы: планируй задачи, отслеживай время и
            сохраняй идеи
          </p>
        </div>

        {/* Карточки функций */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              <div className="p-6">
                <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-pink-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {feature.description}
                </p>
                <div className="pt-4 border-t border-pink-100">
                  <div className="flex flex-wrap gap-2">
                    {feature.benefits.map((benefit, i) => (
                      <span
                        key={i}
                        className="text-xs bg-pink-50 text-pink-700 px-2 py-1 rounded-full"
                      >
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Дополнительная информация */}
        <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <Target className="w-5 h-5 text-pink-600" />
              <h3 className="font-semibold text-pink-900">Гибкая настройка</h3>
            </div>
            <p className="text-gray-600 text-sm">
              У тебя есть 10 цветных тегов, которые можно переименовывать под
              свои нужды. Настрой систему под себя!
            </p>
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <Clock className="w-5 h-5 text-pink-600" />
              <h3 className="font-semibold text-pink-900">Полный контроль</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Отслеживай прогресс через статистику, редактируй и удаляй любые
              сессии или заметки. Всё под твоим контролем.
            </p>
          </div>
          <img
            src="/diary_armsup.png"
            alt="Illustration"
            className="w-40 h-40 object-contain"
          />
        </div>

        {/* Подсказка */}
      </div>
    </div>
  );
}

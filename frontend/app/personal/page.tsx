"use client";

import {
  BookOpen,
  Moon,
  BarChart3,
  Brain,
  Heart,
  Smile,
  StickyNote,
  Sparkles,
  Activity,
  CalendarDays,
  Clock,
} from "lucide-react";
import Link from "next/link";

export default function PersonalPage() {
  const features = [
    {
      icon: <BookOpen className="w-8 h-8 text-pink-600" />,
      title: "Дневник",
      description:
        "Твоё личное пространство для записей. Добавляй настроение, форматируй текст в Markdown, отмечай избранные записи. А ещё здесь можно записывать сны с выбором типа сна (хороший, грустный, любовный, кошмар) и добавлять теги.",
      benefits: [
        "Markdown форматирование",
        "Выбор настроения",
        "Заметки о снах",
        "Избранные записи",
      ],
      link: "/personal/diary",
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-pink-600" />,
      title: "Трекер настроения",
      description:
        "Отслеживай свои эмоции в календаре! Каждый день отмечен иконкой твоего настроения. Статистика покажет распределение эмоций, динамику по дням недели и среднюю длину записей.",
      benefits: [
        "Календарь настроений",
        "Графики и статистика",
        "Отслеживание динамики",
        "Анализ по дням недели",
      ],
      link: "/personal/mood-tracker",
    },
    {
      icon: <Moon className="w-8 h-8 text-pink-600" />,
      title: "Трекер сна",
      description:
        "Подробный анализ твоего сна! Отмечай время засыпания и пробуждения (можно несколько периодов), записывай сны с выбором типа, добавляй теги. Статистика покажет среднюю продолжительность, время отхода и пробуждения.",
      benefits: [
        "Мультипериоды сна",
        "Анализ по дням недели",
        "Статистика и графики",
        "Заметки о снах",
      ],
      link: "/personal/sleep",
    },
    {
      icon: <Brain className="w-8 h-8 text-pink-600" />,
      title: "Тесты личности",
      description:
        "Узнай себя лучше! Пройди тест 'Большая пятёрка' (40 вопросов), тест на мотивацию или эмоциональный интеллект. Также доступен тест на депрессию (PHQ-9) для оценки психологического состояния.",
      benefits: [
        "Большая пятёрка",
        "Эмоциональный интеллект",
        "Тест на мотивацию",
        "Шкала депрессии",
      ],
      link: "/personal/personality",
    },
    {
      icon: <Heart className="w-8 h-8 text-pink-600" />,
      title: "Что влияет на настроение",
      description:
        "Создай свой список! Записывай, что повышает твоё настроение (бустеры) и что его понижает (дрейнеры). Это поможет лучше понимать себя и управлять эмоциями.",
      benefits: [
        "Бустеры настроения",
        "Дрейнеры настроения",
        "Анализ триггеров",
        "Самопознание",
      ],
      link: "/personal/personality",
    },
    {
      icon: <StickyNote className="w-8 h-8 text-pink-600" />,
      title: "Заметки о себе",
      description:
        "Важные напоминания о себе, своих желаниях, мечтах и решениях. Веди дневник саморефлексии, записывай свои мысли и цели. Всё в одном месте!",
      benefits: [
        "Личные заметки",
        "Саморефлексия",
        "Цели и мечты",
        "Напоминания",
      ],
      link: "/personal/personality",
    },
  ];

  const statsCards = [
    {
      icon: <CalendarDays className="w-5 h-5" />,
      label: "Дневник",
      value: " С трекером настроения",
      color: "bg-pink-100",
    },
    {
      icon: <Activity className="w-5 h-5" />,
      label: "Настроений",
      value: "8 типов",
      color: "bg-purple-100",
    },
    {
      icon: <Clock className="w-5 h-5" />,
      label: "Анализ сна",
      value: "С трекером режима",
      color: "bg-blue-100",
    },
    {
      icon: <Brain className="w-5 h-5" />,
      label: "Тестов",
      value: "4 теста",
      color: "bg-green-100",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-pink-100 pt-[60px] pb-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-pink-200 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-pink-700" />
            <span className="text-sm font-medium text-pink-800">
              Personal Section
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-pink-900 mb-4">
            Заботься о себе каждый день
          </h1>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            Веди дневник, отслеживай настроение и сон, проходи тесты и узнавай
            себя лучше
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {statsCards.map((stat, index) => (
            <div
              key={index}
              className={`${stat.color} rounded-xl p-4 text-center shadow-sm`}
            >
              <div className="flex justify-center mb-2 text-pink-600">
                {stat.icon}
              </div>
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className="text-sm font-semibold text-gray-700">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <Link
              key={index}
              href={feature.link}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group block"
            >
              <div className="p-6">
                <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-pink-900 mb-2">
                  {feature.title}
                </h3>
                <div className="text-gray-600 text-sm leading-relaxed mb-4">
                  {feature.description}
                </div>
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
            </Link>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-pink-100 to-pink-50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Smile className="w-6 h-6 text-pink-600" />
              <h3 className="font-semibold text-pink-900">Совет дня</h3>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">
              Веди дневник регулярно — даже 5 минут в день помогают лучше
              понимать свои эмоции и снижать уровень стресса. А заметки о снах
              помогут заметить интересные паттерны!
            </p>
          </div>
          <div className="bg-gradient-to-r from-purple-100 to-purple-50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Moon className="w-6 h-6 text-purple-600" />
              <h3 className="font-semibold text-purple-900">Про сон</h3>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">
              Отслеживание сна помогает понять свой режим. Записывай, что
              снилось — возможно, ты заметишь связь между событиями в жизни и
              снами!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

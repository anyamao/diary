"use client";

import { useState } from "react";
import { X, RotateCcw, List, Shuffle, Plus } from "lucide-react";
import { showToast } from "@/components/Toast";

interface QuestionsModalProps {
  onSelectQuestion: (question: string) => void;
  onClose: () => void;
}

const QUESTIONS = [
  "Что сегодня вызвало у тебя эмоции?",
  "За что ты благодарен(на) сегодня?",
  "Что тебя сегодня удивило?",
  "Какая была самая яркая эмоция сегодня?",
  "Что ты сегодня узнал(а) о себе?",
  "Кто сегодня сделал твой день лучше?",
  "Что ты сегодня сделал(а) для других?",
  "Какая мысль сегодня чаще всего посещала тебя?",
  "Что бы ты хотел(а) изменить в сегодняшнем дне?",
  "Что сегодня получилось лучше всего?",
  "Какое событие сегодня запомнится больше всего?",
  "Что сегодня тебя рассмешило?",
  "Что сегодня тебя расстроило?",
  "Чего ты сегодня испугался(лась)?",
  "Что сегодня вдохновило тебя?",
  "Что сегодня тебя успокоило?",
  "Какую ошибку ты сегодня сделал(а) и что из этого извлек(ла)?",
  "С кем бы ты хотел(а) поделиться сегодняшним днем?",
  "Что бы ты пожелал(а) себе на завтра?",
  "Какая музыка описывает твое сегодняшнее настроение?",
];

export default function QuestionsModal({
  onSelectQuestion,
  onClose,
}: QuestionsModalProps) {
  const [showAll, setShowAll] = useState(false);
  const [randomQuestion, setRandomQuestion] = useState(QUESTIONS[0]);
  const [currentDisplayQuestion, setCurrentDisplayQuestion] = useState(
    QUESTIONS[0],
  );

  const getRandomQuestion = () => {
    const random = Math.floor(Math.random() * QUESTIONS.length);
    const newQuestion = QUESTIONS[random];
    setRandomQuestion(newQuestion);
    setCurrentDisplayQuestion(newQuestion);
    return newQuestion;
  };

  const handleNewRandom = () => {
    const newQuestion = getRandomQuestion();
    // Не добавляем сразу, просто показываем
    setCurrentDisplayQuestion(newQuestion);
  };

  const handleSelectFromList = (question: string) => {
    setRandomQuestion(question);
    setCurrentDisplayQuestion(question);
    setShowAll(false);
  };

  const handleAddCurrentQuestion = () => {
    onSelectQuestion(currentDisplayQuestion);
    showToast("Вопрос добавлен в запись", "success");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Вопросы для размышления
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {!showAll ? (
          <>
            <div className="flex flex-row h-[50px] mb-[20px] items-center">
              <div className="bg-pink-50 rounded-lg flex h-[50px] items-center justify-center w-full ">
                <p className="text-pink-900 text-center text-lg">
                  {currentDisplayQuestion}
                </p>
              </div>
              <div className="relative group">
                <button
                  onClick={handleAddCurrentQuestion}
                  className="w-[45px] h-[40px] ml-[10px] flex items-center justify-center bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Добавить вопрос
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleNewRandom}
                className="flex-1 flex items-center justify-center gap-2 bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600 transition"
              >
                <Shuffle className="w-4 h-4" />
                Новый вопрос
              </button>
              <button
                onClick={() => setShowAll(true)}
                className="flex-1 flex items-center justify-center gap-2 border border-pink-500 text-pink-600 py-2 rounded-lg hover:bg-pink-50 transition"
              >
                <List className="w-4 h-4" />
                Показать все
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="max-h-96 overflow-y-auto mb-4 space-y-2">
              {QUESTIONS.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectFromList(question)}
                  className="w-full text-left p-3 rounded-lg hover:bg-pink-50 transition border border-gray-100"
                >
                  <p className="text-sm text-gray-700">{question}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAll(false)}
              className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              Назад к случайному вопросу
            </button>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface WakeMoodPickerProps {
  currentMood: string | null;
  onSelectMood: (mood: string) => void;
  onClose: () => void;
}

const wakeMoods = [
  { id: "refreshed", name: "Отдохнувший", emoji: "😊" },
  { id: "tired", name: "Уставший", emoji: "😴" },
  { id: "sleepy", name: "Сонный", emoji: "😪" },
  { id: "energetic", name: "Энергичный", emoji: "⚡" },
  { id: "grumpy", name: "Раздражённый", emoji: "😤" },
  { id: "neutral", name: "Нейтрально", emoji: "😐" },
  { id: "happy", name: "Счастливый", emoji: "😊" },
  { id: "anxious", name: "Тревожный", emoji: "😰" },
];

export default function WakeMoodPicker({
  currentMood,
  onSelectMood,
  onClose,
}: WakeMoodPickerProps) {
  const [selected, setSelected] = useState(currentMood || "neutral");

  useEffect(() => {
    setSelected(currentMood || "neutral");
  }, [currentMood]);

  const handleSelect = (moodId: string) => {
    setSelected(moodId);
    onSelectMood(moodId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Как ты себя чувствуешь после сна?
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {wakeMoods.map((mood) => (
            <button
              key={mood.id}
              onClick={() => handleSelect(mood.id)}
              className={`flex flex-col items-center p-3 rounded-xl transition ${
                selected === mood.id
                  ? "bg-pink-100 border-2 border-pink-500"
                  : "hover:bg-gray-50 border-2 border-transparent"
              }`}
            >
              <span className="text-3xl mb-2">{mood.emoji}</span>
              <span className="text-xs text-gray-600 text-center">
                {mood.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

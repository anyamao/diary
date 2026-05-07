"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface DreamTypePickerProps {
  currentType: string | null;
  onSelectType: (type: string) => void;
}

const dreamTypes = [
  { id: "noemotions", name: "Без эмоций", image: "/noemotionsdream.png" },
  { id: "good", name: "Хороший сон", image: "/gooddream.png" },
  { id: "sad", name: "Грустный сон", image: "/saddream.png" },
  { id: "love", name: "Любовный сон", image: "/romantic.png" },
  { id: "nightmare", name: "Кошмар", image: "/nightmare.png" },
];

export default function DreamTypePicker({
  currentType,
  onSelectType,
}: DreamTypePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getCurrentImage = () => {
    const type = dreamTypes.find((t) => t.id === currentType);
    return type?.image || "/noemotionsdream.png";
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer hover:scale-110 transition-transform w-10 h-10"
      >
        <img src={getCurrentImage()} alt="dream type" className="w-10 h-10 " />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-50 min-w-[280px] max-w-[340px]">
            <div className="flex justify-between items-center mb-3 pb-2 border-b">
              <span className="text-sm font-medium text-gray-700">Тип сна</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {dreamTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    onSelectType(type.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-2 p-2 rounded-lg transition ${
                    currentType === type.id
                      ? "bg-blue-50 border border-blue-300"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <img
                    src={type.image}
                    alt={type.name}
                    className="w-6 h-6 object-contain"
                  />
                  <span className="text-xs text-gray-700">{type.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

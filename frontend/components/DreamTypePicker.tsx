"use client";

import { useState, useEffect } from "react";
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
  const [selected, setSelected] = useState(currentType || "noemotions");

  useEffect(() => {
    setSelected(currentType || "noemotions");
  }, [currentType]);

  const getCurrentImage = () => {
    const type = dreamTypes.find((t) => t.id === currentType);
    return type?.image || "/noemotionsdream.png";
  };

  const handleSelect = (typeId: string) => {
    setSelected(typeId);
    onSelectType(typeId);
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="cursor-pointer hover:scale-110 transition-transform w-10 h-10"
      >
        <img src={getCurrentImage()} alt="dream type" className="w-10 h-10" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Тип сна</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {dreamTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleSelect(type.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition ${
                    selected === type.id
                      ? "bg-pink-100 border-2 border-pink-500"
                      : "hover:bg-gray-50 border-2 border-transparent"
                  }`}
                >
                  <img
                    src={type.image}
                    alt={type.name}
                    className="w-10 h-10 object-contain"
                  />
                  <span className="text-sm text-gray-700">{type.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

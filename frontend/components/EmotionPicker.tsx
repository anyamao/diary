'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface EmotionPickerProps {
  currentEmotion: string;
  onSelectEmotion: (emotion: string) => void;
  onClose: () => void;
}

const emotions = [
  { id: 'noemotions', name: 'Без эмоций', image: '/noemotions.png' },
  { id: 'happy', name: 'Счастлив', image: '/happy.png' },
  { id: 'sad', name: 'Грустный', image: '/sad.png' },
  { id: 'verysad', name: 'Очень грустный', image: '/verysad.png' },
  { id: 'angry', name: 'Злой', image: '/angry.png' },
  { id: 'stressed', name: 'Напряженный', image: '/stressed.png' },
  { id: 'verystressed', name: 'Очень напряженный', image: '/verystressed.png' },
  { id: 'calm', name: 'Спокойный', image: '/calm.png' },
];

export default function EmotionPicker({ currentEmotion, onSelectEmotion, onClose }: EmotionPickerProps) {
  const [selected, setSelected] = useState(currentEmotion || 'noemotions');

  useEffect(() => {
    setSelected(currentEmotion || 'noemotions');
  }, [currentEmotion]);

  const handleSelect = (emotionId: string) => {
    setSelected(emotionId);
    onSelectEmotion(emotionId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Как ты себя чувствуешь?</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="grid grid-cols-4 gap-4">
          {emotions.map((emotion) => (
            <button
              key={emotion.id}
              onClick={() => handleSelect(emotion.id)}
              className={`flex flex-col items-center p-3 rounded-xl transition ${
                selected === emotion.id
                  ? 'bg-pink-100 border-2 border-pink-500'
                  : 'hover:bg-gray-50 border-2 border-transparent'
              }`}
            >
              <img
                src={emotion.image}
                alt={emotion.name}
                className="w-12 h-12 object-contain mb-2"
              />
              <span className="text-xs text-gray-600 text-center">{emotion.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

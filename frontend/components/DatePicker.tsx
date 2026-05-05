'use client';

import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onClose: () => void;
}

export default function DatePicker({ currentDate, onDateChange, onClose }: DatePickerProps) {
  const [selectedDate, setSelectedDate] = useState(currentDate);

  const handleSave = () => {
    onDateChange(selectedDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Выберите дату</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <Calendar className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <input
          type="date"
          value={selectedDate.toISOString().split('T')[0]}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500 mb-4"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600 transition"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

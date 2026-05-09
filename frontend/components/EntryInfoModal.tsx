"use client";

import { X, Calendar, Clock, FileText, Edit, Star } from "lucide-react";

interface EntryInfoModalProps {
  createdAt: string;
  updatedAt: string;
  contentLength: number;
  titleLength: number;
  isFavorite: boolean;
  onClose: () => void;
}

export default function EntryInfoModal({
  createdAt,
  updatedAt,
  contentLength,
  titleLength,
  isFavorite,
  onClose,
}: EntryInfoModalProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasBeenEdited = createdAt !== updatedAt;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Информация о записи
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-pink-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Создано</p>
              <p className="text-sm text-gray-600">{formatDate(createdAt)}</p>
            </div>
          </div>

          {hasBeenEdited && (
            <div className="flex items-start gap-3">
              <Edit className="w-5 h-5 text-pink-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Последнее редактирование
                </p>
                <p className="text-sm text-gray-600">{formatDate(updatedAt)}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-pink-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Статистика</p>
              <p className="text-sm text-gray-600">
                Заголовок: {titleLength} символов
              </p>
              <p className="text-sm text-gray-600">
                Содержание: {contentLength} символов
              </p>
              <p className="text-sm text-gray-600">
                Слов: {contentLength > 0 ? Math.floor(contentLength / 5) : 0}
              </p>
            </div>
          </div>

          {isFavorite && (
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Избранное</p>
                <p className="text-sm text-gray-600">
                  Эта запись отмечена как избранная
                </p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600 transition"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}

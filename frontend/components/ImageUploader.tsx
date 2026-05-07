"use client";

import { useState, useRef } from "react";
import { Image as ImageIcon } from "lucide-react";
import { showToast } from "./Toast";

interface ImageUploaderProps {
  onImageInsert: (imageMarkdown: string) => void;
}

export default function ImageUploader({ onImageInsert }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Уменьшаем размер изображения
          const maxWidth = 600;
          const maxHeight = 600;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          // Конвертируем в JPEG с качеством 0.7
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Пожалуйста, выберите изображение", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Изображение не должно превышать 5MB", "error");
      return;
    }

    setIsUploading(true);
    try {
      const resizedImage = await resizeImage(file);
      // Обрезаем строку для отладки
      console.log("Image data length:", resizedImage.length);

      const imageMarkdown = `![image](${resizedImage})`;
      onImageInsert(imageMarkdown);
      showToast("Изображение добавлено", "success");
    } catch (error) {
      console.error("Failed to process image:", error);
      showToast("Не удалось обработать изображение", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      <button
        type="button"
        onClick={triggerFileInput}
        disabled={isUploading}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded transition disabled:opacity-50"
      >
        {isUploading ? (
          <>
            <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
            <span>Загрузка...</span>
          </>
        ) : (
          <>
            <ImageIcon className="w-4 h-4" />
            <span>Добавить фото</span>
          </>
        )}
      </button>
    </>
  );
}

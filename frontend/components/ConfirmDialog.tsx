"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Да, удалить",
  cancelText = "Отмена",
  type = "danger",
}: ConfirmDialogProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
          button: "bg-red-600 hover:bg-red-700",
          border: "border-red-200",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
          button: "bg-yellow-600 hover:bg-yellow-700",
          border: "border-yellow-200",
        };
      default:
        return {
          icon: <AlertTriangle className="w-6 h-6 text-blue-600" />,
          button: "bg-blue-600 hover:bg-blue-700",
          border: "border-blue-200",
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-scale-in">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-3">
            {styles.icon}
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-gray-600">{message}</p>
        </div>

        <div className="flex gap-3 p-4 pt-0">
          <button
            onClick={onConfirm}
            className={`flex-1 ${styles.button} text-white py-2 rounded-lg transition`}
          >
            {confirmText}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Глобальный компонент для диалога
let confirmResolver: ((value: boolean) => void) | null = null;

export const showConfirm = (
  title: string,
  message: string,
  type: "danger" | "warning" | "info" = "danger",
): Promise<boolean> => {
  const event = new CustomEvent("show-confirm", {
    detail: { title, message, type },
  });
  window.dispatchEvent(event);

  return new Promise((resolve) => {
    confirmResolver = resolve;
  });
};

export function ConfirmDialogContainer() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    title: "",
    message: "",
    type: "danger" as "danger" | "warning" | "info",
  });

  useEffect(() => {
    const handleShowConfirm = (event: CustomEvent) => {
      setConfig(event.detail);
      setIsOpen(true);
    };

    window.addEventListener("show-confirm", handleShowConfirm as EventListener);

    return () => {
      window.removeEventListener(
        "show-confirm",
        handleShowConfirm as EventListener,
      );
    };
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    if (confirmResolver) {
      confirmResolver(true);
      confirmResolver = null;
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (confirmResolver) {
      confirmResolver(false);
      confirmResolver = null;
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={config.title}
      message={config.message}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      type={config.type}
    />
  );
}

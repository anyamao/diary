"use client";

import { useEffect, useState } from "react";
import { Bell, X, Check } from "lucide-react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  is_read: boolean;
}

export default function NotificationsBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000); // Проверка каждую минуту
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data);
      setUnreadCount(response.data.length);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(notifications.filter((n) => n.id !== id));
      setUnreadCount((prev) => prev - 1);
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    for (const notification of notifications) {
      await markAsRead(notification.id);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "celebrate":
        return "🎉";
      case "warning":
        return "💔";
      case "success":
        return "✅";
      default:
        return "📢";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "celebrate":
        return "border-green-400 bg-green-50";
      case "warning":
        return "border-yellow-400 bg-yellow-50";
      case "success":
        return "border-blue-400 bg-blue-50";
      default:
        return "border-gray-400 bg-gray-50";
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-pink-100 rounded-full transition"
      >
        <Bell className="w-5 h-5 text-pink-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
            <div className="p-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Уведомления</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-pink-600 hover:text-pink-700"
                >
                  Прочитать все
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Нет новых уведомлений
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition relative ${getTypeColor(notification.type)}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="text-xl">
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 text-sm">
                          {notification.title}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-gray-400 hover:text-green-500"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

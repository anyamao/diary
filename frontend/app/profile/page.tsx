"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/Toast";
import { showConfirm } from "@/components/ConfirmDialog";
import { User, Save, Trash2, Check, Camera } from "lucide-react";

const avatars = [
  { id: "icon1.jpg", src: "/icon1.jpg", name: "Аватар 1" },
  { id: "icon2.jpg", src: "/icon2.jpg", name: "Аватар 2" },
  { id: "icon3.jpg", src: "/icon3.jpg", name: "Аватар 3" },
  { id: "icon4.jpg", src: "/icon4.jpg", name: "Аватар 4" },
];

export default function ProfilePage() {
  const [username, setUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState("icon1.png");
  const [selectedAvatar, setSelectedAvatar] = useState("icon1.png");
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    logout,
  } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (user?.username) {
      setUsername(user.username);
      setNewUsername(user.username);
    }
    fetchCurrentAvatar();
  }, [isAuthenticated, authLoading, user, router]);

  const fetchCurrentAvatar = async () => {
    try {
      const response = await api.get("/auth/avatar");
      setCurrentAvatar(response.data.avatar);
      setSelectedAvatar(response.data.avatar);
    } catch (error) {
      console.error("Failed to fetch avatar:", error);
    }
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      showToast("Имя пользователя не может быть пустым", "warning");
      return;
    }

    if (newUsername === username) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.put("/auth/update-username", {
        username: newUsername,
      });
      showToast("Имя пользователя обновлено", "success");
      setUsername(newUsername);
      setIsEditing(false);
      if (user) {
        user.username = newUsername;
      }
    } catch (error: any) {
      console.error("Failed to update username:", error);
      showToast(
        error.response?.data?.detail || "Ошибка при обновлении имени",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (avatarId: string) => {
    setSelectedAvatar(avatarId);
    try {
      await api.put("/auth/update-avatar", { avatar: avatarId });
      setCurrentAvatar(avatarId);
      showToast("Аватар обновлён", "success");
    } catch (error) {
      console.error("Failed to update avatar:", error);
      showToast("Ошибка при обновлении аватара", "error");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await showConfirm(
      "Удалить аккаунт?",
      "Это действие НЕОБРАТИМО. Все ваши данные (записи дневника, заметки, результаты тестов) будут навсегда удалены. Вы уверены?",
      "danger",
    );

    if (!confirmed) return;

    const confirmedAgain = await showConfirm(
      "Последнее предупреждение",
      "Вы уверены, что хотите навсегда удалить свой аккаунт? Все данные будут потеряны.",
      "danger",
    );

    if (!confirmedAgain) return;

    setIsLoading(true);
    try {
      await api.delete("/auth/delete-account");
      showToast("Аккаунт успешно удалён", "success");
      await logout();
      router.push("/");
    } catch (error: any) {
      console.error("Failed to delete account:", error);
      showToast(
        error.response?.data?.detail || "Ошибка при удалении аккаунта",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-pink-50 mt-[-60px] p-8 pt-[70px]">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-pink-500 px-6 py-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={`/${currentAvatar}`}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full border-4 border-white bg-white object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Мой профиль</h1>
                <p className="text-pink-100 text-sm mt-1">
                  Управление аккаунтом
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Email (неизменяемый) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                {user?.email}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Email нельзя изменить
              </p>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Имя пользователя
              </label>
              {isEditing ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="flex-1 p-3 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Введите новое имя"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleUpdateUsername}
                    disabled={isLoading}
                    className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Сохранить
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setNewUsername(username);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div className="text-gray-900 bg-pink-50 p-3 rounded-lg flex-1">
                    {username}
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="ml-2 px-4 py-2 bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-200"
                  >
                    Изменить
                  </button>
                </div>
              )}
            </div>

            {/* Avatar selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Аватар
              </label>
              <div className="grid grid-cols-4 gap-4 max-w-md">
                {avatars.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => handleAvatarChange(avatar.id)}
                    className={`relative p-2 rounded-lg transition-all duration-200 ${
                      currentAvatar === avatar.id
                        ? "bg-pink-100 ring-2 ring-pink-500"
                        : "hover:bg-pink-50"
                    }`}
                  >
                    <img
                      src={avatar.src}
                      alt={avatar.name}
                      className="w-16 h-16 rounded-full mx-auto border-2 border-pink-200 object-cover"
                    />
                    {currentAvatar === avatar.id && (
                      <div className="absolute top-1 right-1 bg-pink-500 rounded-full p-1">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Нажмите на аватар, чтобы выбрать
              </p>
            </div>

            {/* Additional info */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-semibold text-gray-800 mb-2">О аккаунте</h3>
              <p className="text-sm text-gray-600">
                Дата регистрации:{" "}
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString("ru-RU")
                  : "—"}
              </p>
            </div>

            {/* Dangerous zone */}
            <div className="border-t-2 border-red-200 pt-4 mt-4">
              <h3 className="text-lg font-semibold text-red-600 mb-3">
                Опасная зона
              </h3>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-red-800">Удалить аккаунт</p>
                    <p className="text-sm text-red-600">
                      Все данные будут безвозвратно удалены
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isLoading}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Удалить аккаунт
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

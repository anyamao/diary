"use client";

import {
  PanelRight,
  Plus,
  FileText,
  Bookmark,
  Trash2,
  X,
  MoreHorizontal,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import { eventBus } from "@/lib/eventBus";
import { showConfirm } from "@/components/ConfirmDialog";
import { showToast } from "@/components/Toast";
interface DiaryEntry {
  id: string;
  title: string;
  mood: string;
  is_favorite: boolean;
  created_at: string;
}

export default function Sidepanel() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const { isAuthenticated, checkAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && pathname?.startsWith("/personal/diary")) {
      fetchEntries();
    }
  }, [isAuthenticated, pathname]);

  // Подписываемся на события обновления
  useEffect(() => {
    const handleUpdate = () => {
      console.log("🔄 Sidepanel: получил событие обновления");
      fetchEntries();
    };

    eventBus.on("diary-entry-created", handleUpdate);
    eventBus.on("diary-entry-updated", handleUpdate);
    eventBus.on("diary-entry-deleted", handleUpdate);

    return () => {
      eventBus.off("diary-entry-created", handleUpdate);
      eventBus.off("diary-entry-updated", handleUpdate);
      eventBus.off("diary-entry-deleted", handleUpdate);
    };
  }, [isAuthenticated]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const response = await api.get("/diary/entries");
      setEntries(response.data);
    } catch (error) {
      console.error("Failed to fetch entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm(
      "Удалить запись?",
      "Вы уверены, что хотите удалить эту запись?",
      "danger",
    );
    if (confirmed) {
      try {
        await api.delete(`/diary/entries/${id}`);
        setEntries(entries.filter((entry) => entry.id !== id));
        eventBus.emit("diary-entry-deleted");
        if (pathname === `/personal/diary/${id}/edit`) {
          router.push("/personal/diary");
        }
        showToast("Удалено успешно!", "success");
        setOpenMenuId(null);
      } catch (error) {
        console.error("Failed to delete:", error);
        showToast("Не удалось удалить", "error");
      }
    }
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    try {
      await api.put(`/diary/entries/${id}`, { is_favorite: !isFavorite });
      setEntries(
        entries.map((entry) =>
          entry.id === id ? { ...entry, is_favorite: !isFavorite } : entry,
        ),
      );
      eventBus.emit("diary-entry-updated");
      setOpenMenuId(null);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      alert("Не удалось изменить статус избранного");
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/personal/diary/${id}/edit`);
    setOpenMenuId(null);
  };

  const handleNewEntry = () => {
    router.push("/personal/diary/new");
  };

  const getMoodImage = (mood: string) => {
    const moodMap: { [key: string]: string } = {
      noemotions: "/noemotions.png",
      happy: "/happy.png",
      sad: "/sad.png",
      verysad: "/verysad.png",
      angry: "/angry.png",
      stressed: "/stressed.png",
      verystressed: "/verystressed.png",
      calm: "/calm.png",
    };
    return moodMap[mood] || "/noemotions.png";
  };

  const favoriteEntries = entries.filter((entry) => entry.is_favorite);
  const normalEntries = entries.filter((entry) => !entry.is_favorite);

  if (!isAuthenticated) {
    return null;
  }

  if (!isOpen) {
    return (
      <div className="fixed left-0 top-[120px] z-20">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-pink-500 text-white p-2 rounded-r-lg hover:bg-pink-600 transition shadow-md"
        >
          <PanelRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-full  w-[280px] bg-white border-r-[1px] border-pink-200 overflow-y-auto shadow-sm">
      <div className="flex flex-col p-4">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-pink-200">
          <p className="text-pink-900 font-bold text-sm">Мой дневник</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewEntry}
              className="p-1 hover:bg-pink-100 rounded transition"
              title="Новая запись"
            >
              <Plus className="w-4 h-4 text-pink-600" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-pink-100 rounded transition"
              title="Свернуть"
            >
              <X className="w-4 h-4 text-pink-600" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            Загрузка...
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Нет записей</p>
            <button
              onClick={handleNewEntry}
              className="mt-3 text-xs text-pink-600 hover:text-pink-700"
            >
              Создать первую запись →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {favoriteEntries.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 pb-1 border-b border-pink-100">
                  <Bookmark className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Избранное
                  </p>
                </div>
                <div className="space-y-1">
                  {favoriteEntries.map((entry) => (
                    <EntryItem
                      key={entry.id}
                      entry={entry}
                      pathname={pathname}
                      openMenuId={openMenuId}
                      setOpenMenuId={setOpenMenuId}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleFavorite={handleToggleFavorite}
                      getMoodImage={getMoodImage}
                    />
                  ))}
                </div>
              </div>
            )}

            {normalEntries.length > 0 && (
              <div>
                {favoriteEntries.length > 0 && (
                  <div className="flex items-center gap-2 mb-2 pb-1 border-b border-pink-100">
                    <Heart className="w-3 h-3 text-pink-400" />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Все записи
                    </p>
                  </div>
                )}
                <div className="space-y-1">
                  {normalEntries.map((entry) => (
                    <EntryItem
                      key={entry.id}
                      entry={entry}
                      pathname={pathname}
                      openMenuId={openMenuId}
                      setOpenMenuId={setOpenMenuId}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleFavorite={handleToggleFavorite}
                      getMoodImage={getMoodImage}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EntryItem({
  entry,
  pathname,
  openMenuId,
  setOpenMenuId,
  onEdit,
  onDelete,
  onToggleFavorite,
  getMoodImage,
}: {
  entry: DiaryEntry;
  pathname: string;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  getMoodImage: (mood: string) => string;
}) {
  const isMenuOpen = openMenuId === entry.id;

  return (
    <div
      className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
        pathname === `/personal/diary/${entry.id}/edit`
          ? "bg-pink-100"
          : "hover:bg-pink-50"
      }`}
      onClick={() => onEdit(entry.id)}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <img
          src={getMoodImage(entry.mood)}
          alt="mood"
          className="w-8 h-8 object-contain"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-700 truncate font-medium">
            {entry.title}
          </p>
          <p className="text-xs text-gray-400">
            {new Date(entry.created_at).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
      </div>

      <div className="relative">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpenMenuId(isMenuOpen ? null : entry.id);
          }}
          className={`p-1 ${entry.is_favorite ? "hover:bg-pink-200" : "hover:bg-pink-100"}   rounded transition`}
          title="Меню"
        >
          <MoreHorizontal className="w-4 h-4 text-gray-500" />
        </button>

        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpenMenuId(null);
              }}
            />
            <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg py-[7px] border border-gray-200 z-20 w-[180px]">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleFavorite(entry.id, entry.is_favorite);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-pink-50 transition flex items-center gap-2"
              >
                {entry.is_favorite ? (
                  <>
                    <Bookmark className="text-yellow-500 w-4 h-4 fill-yellow-500" />
                    Убрать из избранного
                  </>
                ) : (
                  <>
                    <Bookmark className="text-yellow-500 w-4 h-4" />В избранное
                  </>
                )}
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(entry.id);
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2"
              >
                <Trash2 className="text-red-500 w-4 h-4" /> Удалить
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

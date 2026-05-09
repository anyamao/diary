"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Loading from "@/components/Loading";
import api from "@/lib/axios";
import Link from "next/link";
import MarkdownPreview from "@/components/MarkdownPreview";
import {
  Search,
  Calendar,
  ArrowUpDown,
  X,
  Bookmark,
  Trash2,
  Filter,
} from "lucide-react";
import { eventBus } from "@/lib/eventBus";
import { showToast } from "@/components/Toast";
import { showConfirm } from "@/components/ConfirmDialog";

interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  mood: string;
  tags: string;
  is_favorite: boolean;
  created_at: string;
}

type SortOrder = "newest" | "oldest";
type DateFilterType = "all" | "today" | "week" | "month" | "custom";

export default function PersonalDiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { isAuthenticated, isLoading, user, checkAuth } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      setDateFilter("custom");
      setCustomStartDate(dateParam);
      setCustomEndDate(dateParam);
      setShowFilters(true);
      showToast(`Показаны записи за ${dateParam}`, "info");
    }
  }, [searchParams]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
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
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      fetchEntries();
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    filterAndSortEntries();
  }, [
    entries,
    searchQuery,
    sortOrder,
    dateFilter,
    customStartDate,
    customEndDate,
  ]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const response = await api.get("/diary/entries");
      setEntries(response.data);
    } catch (error) {
      showToast("Не удалось загрузить записи", "error");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortEntries = () => {
    let filtered = [...entries];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (entry) =>
          entry.title.toLowerCase().includes(query) ||
          entry.content.toLowerCase().includes(query),
      );
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateFilter) {
      case "today":
        filtered = filtered.filter((entry) => {
          const entryDate = new Date(entry.created_at);
          return entryDate >= today;
        });
        break;
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        filtered = filtered.filter((entry) => {
          const entryDate = new Date(entry.created_at);
          return entryDate >= weekAgo;
        });
        break;
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        filtered = filtered.filter((entry) => {
          const entryDate = new Date(entry.created_at);
          return entryDate >= monthAgo;
        });
        break;
      case "custom":
        if (customStartDate) {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          filtered = filtered.filter((entry) => {
            const entryDate = new Date(entry.created_at);
            return entryDate >= start;
          });
        }
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          filtered = filtered.filter((entry) => {
            const entryDate = new Date(entry.created_at);
            return entryDate <= end;
          });
        }
        break;
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    setFilteredEntries(filtered);
  };

  const deleteEntry = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = await showConfirm(
      "Удалить запись?",
      "Вы уверены, что хотите удалить эту запись? Это действие нельзя отменить.",
      "danger",
    );

    if (confirmed) {
      try {
        await api.delete(`/diary/entries/${id}`);
        eventBus.emit("diary-entry-deleted");
        showToast("Запись удалена", "success");
      } catch (error) {
        showToast("Не удалось удалить запись", "error");
      }
    }
  };

  const toggleFavorite = async (
    id: string,
    currentStatus: boolean,
    e: React.MouseEvent,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.put(`/diary/entries/${id}`, { is_favorite: !currentStatus });
      eventBus.emit("diary-entry-updated");
      showToast(
        currentStatus ? "Убрано из избранного" : "Добавлено в избранное",
        "success",
      );
    } catch (error) {
      showToast("Не удалось изменить статус избранного", "error");
    }
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

  const getPreviewText = (content: string) => {
    let text = content
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .replace(/`(.*?)`/g, "$1")
      .replace(/#{1,6}\s/g, "")
      .replace(/\n/g, " ")
      .slice(0, 150);

    if (content.length > 150) text += "...";
    return text || "Нет содержимого";
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSortOrder("newest");
    setDateFilter("all");
    setCustomStartDate("");
    setCustomEndDate("");
    showToast("Фильтры сброшены", "info");
  };

  if (loading || isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="p-3 pt-8 sm:p-8 w-full h-full flex-1 bg-pink-50 flex justify-center min-h-screen">
      <div className="flex flex-col w-full h-full max-w-[1000px]">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Мой дневник</h1>
          <div className="flex md:flex-row flex-col w-full justify-between items-center">
            <p className="text-gray-600 mt-2">
              С возвращением, {user?.full_name || user?.username}!
            </p>
            <Link
              href="/personal/diary/new"
              className="bg-pink-500 text-white mt-[10px] md:mt-[0px] px-6 py-2 rounded-lg hover:bg-pink-600 transition inline-block"
            >
              Создать новую запись
            </Link>
          </div>
        </div>

        <div className="mb-6 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по заголовку или содержанию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-500 bg-white"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                showFilters || dateFilter !== "all" || sortOrder !== "newest"
                  ? "bg-pink-500 text-white"
                  : "bg-white text-gray-700 border border-pink-200 hover:bg-pink-50"
              }`}
            >
              <Filter className="w-4 h-4" />
              Фильтры
            </button>
          </div>

          {showFilters && (
            <div className="bg-white rounded-lg p-4 border border-pink-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-gray-500" />
                    <select
                      value={sortOrder}
                      onChange={(e) =>
                        setSortOrder(e.target.value as SortOrder)
                      }
                      className="px-3 py-1 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm"
                    >
                      <option value="newest">Сначала новые</option>
                      <option value="oldest">Сначала старые</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <select
                      value={dateFilter}
                      onChange={(e) =>
                        setDateFilter(e.target.value as DateFilterType)
                      }
                      className="px-3 py-1 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm"
                    >
                      <option value="all">Все записи</option>
                      <option value="today">За сегодня</option>
                      <option value="week">За неделю</option>
                      <option value="month">За месяц</option>
                      <option value="custom">Свои даты</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={clearFilters}
                  className="text-sm text-pink-600 hover:text-pink-700 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Сбросить
                </button>
              </div>

              {dateFilter === "custom" && (
                <div className="flex gap-3 pt-2">
                  <div>
                    <label className="text-xs text-gray-600">С</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="ml-2 px-3 py-1 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">По</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="ml-2 px-3 py-1 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-sm text-gray-500">
            Найдено записей: {filteredEntries.length}
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl text-gray-600 mb-4">
              {searchQuery || dateFilter !== "all"
                ? "Ничего не найдено"
                : "Нет записей в дневнике"}
            </h2>
            <p className="text-gray-500 mb-6">
              {searchQuery || dateFilter !== "all"
                ? "Попробуйте изменить параметры поиска"
                : "Напишите свою первую запись!"}
            </p>
            {(searchQuery || dateFilter !== "all") && (
              <button
                onClick={clearFilters}
                className="text-pink-600 hover:text-pink-700"
              >
                Сбросить фильтры
              </button>
            )}
            {!searchQuery && dateFilter === "all" && entries.length === 0 && (
              <Link
                href="/personal/diary/new"
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition inline-block"
              >
                Создать первую запись
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEntries.map((entry) => (
              <Link
                href={`/personal/diary/${entry.id}/edit`}
                key={entry.id}
                className="bg-white rounded-lg shadow-md hover:shadow-md hover:border-b-[2px] duration-300 border-pink-200 transition p-6 py-4 border-l-4 border-pink-400 flex flex-col h-full"
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2 flex-1">
                    <img
                      src={getMoodImage(entry.mood)}
                      alt="mood"
                      className="w-9 h-9 object-contain"
                    />
                    <div className="text-xs ml-[10px] text-gray-500">
                      {new Date(entry.created_at).toLocaleDateString("ru-RU", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => deleteEntry(entry.id, e)}
                      className="text-red-500 hover:text-red-700 transition text-sm"
                      title="Удалить"
                    >
                      <Trash2 className="text-red-500 hover:bg-pink-200 p-[3px] rounded-sm duration-300 w-6 h-6" />
                    </button>

                    <button
                      onClick={(e) =>
                        toggleFavorite(entry.id, entry.is_favorite, e)
                      }
                      className={`transition text-sm ${entry.is_favorite ? "text-yellow-500" : "text-gray-300 hover:text-yellow-500"}`}
                      title={
                        entry.is_favorite
                          ? "Убрать из избранного"
                          : "В избранное"
                      }
                    >
                      <Bookmark
                        className={`w-6 h-6 ml-[5px] ${entry.is_favorite ? "fill-yellow-500" : ""}`}
                      />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 line-clamp-1">
                  {entry.title}
                </h3>

                <div className="mb-2 flex-1">
                  <div className="text-gray-600 line-clamp-3 prose prose-sm max-w-none">
                    <MarkdownPreview content={getPreviewText(entry.content)} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

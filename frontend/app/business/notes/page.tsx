"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Pin, PinOff, Trash2, Edit, Plus, X } from "lucide-react";

interface BusinessNote {
  id: string;
  title: string;
  content: string;
  tags: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export default function BusinessNotesPage() {
  const [notes, setNotes] = useState<BusinessNote[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<BusinessNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      fetchNotes();
      fetchTags();
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    filterNotes();
  }, [notes, searchQuery, selectedTag]);

  const fetchNotes = async () => {
    try {
      const response = await api.get("/business-notes");
      setNotes(response.data);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await api.get("/business-notes/tags/all");
      setAllTags(response.data);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  };

  const filterNotes = () => {
    let filtered = [...notes];

    // Поиск по заголовку и содержанию
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query),
      );
    }

    // Фильтр по тегу
    if (selectedTag) {
      filtered = filtered.filter(
        (note) =>
          note.tags &&
          note.tags
            .split(",")
            .map((t) => t.trim())
            .includes(selectedTag),
      );
    }

    // Сначала закрепленные, потом по дате обновления
    filtered.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) {
        return a.is_pinned ? -1 : 1;
      }
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });

    setFilteredNotes(filtered);
  };

  const deleteNote = async (id: string) => {
    if (confirm("Удалить эту заметку?")) {
      try {
        await api.delete(`/business-notes/${id}`);
        fetchNotes();
      } catch (error) {
        console.error("Failed to delete note:", error);
        alert("Ошибка удаления");
      }
    }
  };

  const togglePin = async (id: string) => {
    try {
      await api.patch(`/business-notes/${id}/pin`);
      fetchNotes();
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTag("");
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Бизнес-идеи и заметки
            </h1>
            <p className="text-gray-600">
              Здесь хранятся твои идеи для будущих проектов и рабочие заметки
            </p>
          </div>
          <Link
            href="/business/notes/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Новая заметка
          </Link>
        </div>

        {/* Панель поиска и фильтров */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по заголовку или содержанию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowTagFilter(!showTagFilter)}
                className={`px-4 py-2 rounded-lg border transition ${
                  selectedTag
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {selectedTag ? `Тег: ${selectedTag}` : "Фильтр по тегу"}
                {selectedTag && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTag("");
                    }}
                    className="ml-2 hover:text-gray-300"
                  >
                    <X className="w-3 h-3 inline" />
                  </button>
                )}
              </button>
              {showTagFilter && allTags.length > 0 && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border z-10">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setSelectedTag("");
                        setShowTagFilter(false);
                      }}
                      className="w-full text-left px-3 py-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Все заметки
                    </button>
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setSelectedTag(tag);
                          setShowTagFilter(false);
                        }}
                        className="w-full text-left px-3 py-1 text-sm hover:bg-gray-100 rounded"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {(searchQuery || selectedTag) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Сбросить
              </button>
            )}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Найдено заметок: {filteredNotes.length}
          </div>
        </div>

        {/* Список заметок */}
        <div className="grid gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`bg-white rounded-lg shadow-md p-6 transition hover:shadow-lg ${
                note.is_pinned ? "border-l-4 border-yellow-400" : ""
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {note.is_pinned && (
                      <Pin className="w-4 h-4 text-yellow-500" />
                    )}
                    <Link href={`/business/notes/${note.id}`}>
                      <h2 className="text-xl font-semibold text-gray-800 hover:text-blue-600">
                        {note.title}
                      </h2>
                    </Link>
                  </div>
                  {note.tags && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {note.tags.split(",").map((tag, i) => (
                        <span
                          key={i}
                          onClick={() => setSelectedTag(tag.trim())}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded cursor-pointer hover:bg-gray-200"
                        >
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => togglePin(note.id)}
                    className="text-gray-400 hover:text-yellow-500 transition"
                    title={note.is_pinned ? "Открепить" : "Закрепить"}
                  >
                    {note.is_pinned ? (
                      <Pin className="w-4 h-4" />
                    ) : (
                      <PinOff className="w-4 h-4" />
                    )}
                  </button>
                  <Link href={`/business/notes/${note.id}`}>
                    <button className="text-blue-500 hover:text-blue-700 transition">
                      <Edit className="w-4 h-4" />
                    </button>
                  </Link>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-red-500 hover:text-red-700 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <Link href={`/business/notes/${note.id}`}>
                <div className="text-gray-600 line-clamp-3 prose prose-sm max-w-none">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: note.content || "Нет содержимого",
                    }}
                  />
                </div>
              </Link>

              <div className="text-xs text-gray-400 mt-3">
                Обновлено: {new Date(note.updated_at).toLocaleString()}
              </div>
            </div>
          ))}

          {filteredNotes.length === 0 && (
            <div className="text-center py-16 bg-white rounded-lg shadow-md">
              <div className="text-6xl mb-4">💡</div>
              <h2 className="text-2xl text-gray-600 mb-4">
                {searchQuery || selectedTag
                  ? "Ничего не найдено"
                  : "Нет заметок"}
              </h2>
              <p className="text-gray-500 mb-6">
                {searchQuery || selectedTag
                  ? "Попробуйте изменить параметры поиска"
                  : "Создайте свою первую бизнес-идею или заметку"}
              </p>
              {searchQuery || selectedTag ? (
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Сбросить фильтры
                </button>
              ) : (
                <Link
                  href="/business/notes/new"
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Создать первую заметку
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

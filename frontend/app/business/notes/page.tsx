"use client";
import { Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MarkdownPreview from "@/components/MarkdownPreview";
import {
  Search,
  Bookmark,
  Trash2,
  Edit,
  Plus,
  X,
  BookmarkOff,
} from "lucide-react";
import { showToast } from "@/components/Toast";
import { showConfirm } from "@/components/ConfirmDialog";
import Loading from "@/components/Loading";
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
  const [isDeleting, setIsDeleting] = useState(false);
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
      showToast("Не удалось загрузить заметки", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await api.get("/business-notes/tags/all");
      setAllTags(response.data);
    } catch (error) {}
  };

  const filterNotes = () => {
    let filtered = [...notes];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query),
      );
    }

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
    const confirmed = await showConfirm(
      "Удалить заметку?",
      "Вы уверены, что хотите удалить эту заметку? Это действие нельзя отменить.",
      "danger",
    );

    if (confirmed) {
      setIsDeleting(true);
      try {
        await api.delete(`/business-notes/${id}`);
        await fetchNotes();
        showToast("Заметка успешно удалена", "success");
      } catch (error) {
        showToast("Не удалось удалить заметку", "error");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const togglePin = async (id: string, isPinned: boolean) => {
    try {
      await api.patch(`/business-notes/${id}/pin`);
      await fetchNotes();
      showToast(
        isPinned ? "Заметка откреплена" : "Заметка закреплена",
        "success",
      );
    } catch (error) {
      showToast("Не удалось изменить статус закрепления", "error");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTag("");
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

  if (isLoading || loading) {
    return <Loading></Loading>;
  }

  return (
    <div className="min-h-screen bg-pink-50 p-8">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-pink-950 mb-2">
              Бизнес-идеи и заметки
            </h1>
            <p className="text-gray-600">
              Здесь хранятся твои идеи для будущих проектов и рабочие заметки
            </p>
          </div>
          <Link
            href="/business/notes/new"
            className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Новая заметка
          </Link>
        </div>

        <div className="mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по заголовку или содержанию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowTagFilter(!showTagFilter)}
                className={`px-4 py-2 rounded-lg border transition ${
                  selectedTag
                    ? "bg-pink-600 text-white border-pink-600"
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`bg-white rounded-lg border-l-[4px]  hover:border-b-[2px] border-b-pink-400 shadow-md hover:shadow-lg transition cursor-pointer flex flex-col h-full border-pink-400 
              
              `}
              onClick={() => router.push(`/business/notes/${note.id}`)}
            >
              <div className="p-6 flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h2 className="text-xl max-w-[240px] font-semibold text-gray-800 hover:text-pink-600 line-clamp-1">
                      {note.title}
                    </h2>
                    {note.tags && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {note.tags.split(",").map((tag, i) => (
                          <span
                            key={i}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTag(tag.trim());
                            }}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded cursor-pointer hover:bg-gray-200"
                          >
                            #{tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                      disabled={isDeleting}
                      className="text-red-500 p-1 hover:text-red-600 transition hover:bg-pink-100 rounded-lg disabled:opacity-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePin(note.id, note.is_pinned);
                      }}
                      className="text-gray-400 hover:text-yellow-500 transition"
                      title={note.is_pinned ? "Открепить" : "Закрепить"}
                    >
                      {note.is_pinned ? (
                        <Bookmark className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <Bookmark className="w-6 h-6 hover:text-yellow-500" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mb-2 flex-1">
                  <div className="text-gray-600 line-clamp-3 prose prose-sm max-w-none">
                    <MarkdownPreview content={getPreviewText(note.content)} />
                  </div>
                </div>

                <div className="text-xs text-gray-400 mt-3">
                  Обновлено: {new Date(note.updated_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}

          {filteredNotes.length === 0 && (
            <div className="col-span-full text-center py-16 px-3 bg-white rounded-lg shadow-md">
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
                  className="text-pink-600 hover:text-pink-700"
                >
                  Сбросить фильтры
                </button>
              ) : (
                <Link
                  href="/business/notes/new"
                  className="inline-block bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition"
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

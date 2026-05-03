"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import Link from "next/link";

interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  mood: string;
  tags: string;
  is_favorite: boolean;
  created_at: string;
}

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchEntries();
  }, [isAuthenticated]);

  const fetchEntries = async () => {
    try {
      const response = await api.get("/diary/entries");
      setEntries(response.data);
    } catch (error) {
      console.error("Failed to fetch entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (id: string) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      try {
        await api.delete(`/diary/entries/${id}`);
        setEntries(entries.filter((entry) => entry.id !== id));
      } catch (error) {
        console.error("Failed to delete entry:", error);
      }
    }
  };

  const getMoodEmoji = (mood: string) => {
    const moods: { [key: string]: string } = {
      happy: "😊",
      sad: "😢",
      excited: "🤩",
      angry: "😠",
      calm: "😌",
      loved: "🥰",
    };
    return moods[mood] || "📝";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading your diary...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">My Diary</h1>
            <p className="text-gray-600 mt-2">
              Welcome back, {user?.full_name || user?.username}!
            </p>
          </div>
          <Link
            href="/diary/new"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
          >
            <span>✏️</span>
            New Entry
          </Link>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <div className="text-6xl mb-4">📔</div>
            <h2 className="text-2xl text-gray-600 mb-4">
              No diary entries yet
            </h2>
            <p className="text-gray-500 mb-6">
              Start writing your first diary entry!
            </p>
            <Link
              href="/diary/new"
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Create First Entry
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6 border-l-4 border-purple-500"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getMoodEmoji(entry.mood)}</span>
                    <h3 className="text-xl font-semibold text-gray-800">
                      {entry.title}
                    </h3>
                  </div>
                  {entry.is_favorite && (
                    <span className="text-yellow-500 text-xl">⭐</span>
                  )}
                </div>

                <p className="text-gray-600 mb-4 line-clamp-3">
                  {entry.content || "No content"}
                </p>

                {entry.tags && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {entry.tags.split(",").map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded"
                      >
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                )}

                <div className="text-xs text-gray-500 mb-4">
                  {new Date(entry.created_at).toLocaleDateString()}
                </div>

                <div className="flex gap-3">
                  <Link
                    href={`/diary/${entry.id}/edit`}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

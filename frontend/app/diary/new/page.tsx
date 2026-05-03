"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import Link from "next/link";

export default function NewEntryPage() {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    mood: "",
    tags: "",
    is_favorite: false,
  });
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.post("/diary/entries", formData);
      router.push("/diary");
    } catch (error) {
      console.error("Failed to save entry:", error);
      alert("Failed to save entry. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const moods = [
    { value: "happy", label: "Happy", emoji: "😊" },
    { value: "sad", label: "Sad", emoji: "😢" },
    { value: "excited", label: "Excited", emoji: "🤩" },
    { value: "angry", label: "Angry", emoji: "😠" },
    { value: "calm", label: "Calm", emoji: "😌" },
    { value: "loved", label: "Loved", emoji: "🥰" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-6">
          <Link href="/diary" className="text-purple-600 hover:text-purple-700">
            ← Back to Diary
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Write New Entry
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                placeholder="What's on your mind?"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                How are you feeling?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {moods.map((mood) => (
                  <button
                    key={mood.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, mood: mood.value })
                    }
                    className={`p-3 rounded-lg border transition ${
                      formData.mood === mood.value
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-300 hover:border-purple-300"
                    }`}
                  >
                    <div className="text-2xl">{mood.emoji}</div>
                    <div className="text-sm">{mood.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                placeholder="Write your thoughts here..."
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., personal, work, ideas"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="favorite"
                checked={formData.is_favorite}
                onChange={(e) =>
                  setFormData({ ...formData, is_favorite: e.target.checked })
                }
                className="w-4 h-4 text-purple-600"
              />
              <label htmlFor="favorite" className="text-gray-700">
                Mark as favorite ⭐
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Entry"}
              </button>
              <Link
                href="/diary"
                className="flex-1 text-center border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

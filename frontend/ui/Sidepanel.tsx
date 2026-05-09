"use client";

import { PanelRight, Plus, Edit, Trash2, FileText } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";

interface DiaryEntry {
  id: string;
  title: string;
  created_at: string;
}

interface SidepanelProps {
  onSelectEntry?: (entryId: string) => void;
  onNewEntry?: () => void;
}

export default function Sidepanel({
  onSelectEntry,
  onNewEntry,
}: SidepanelProps) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isAuthenticated && pathname.startsWith("/personal/diary")) {
      fetchEntries();
    }
  }, [isAuthenticated, pathname]);

  const fetchEntries = async () => {
    try {
      const response = await api.get("/diary/entries");
      setEntries(response.data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Delete this entry?")) {
      try {
        await api.delete(`/diary/entries/${id}`);
        setEntries(entries.filter((entry) => entry.id !== id));
        if (pathname === `/personal/diary/${id}/edit`) {
          router.push("/personal/diary");
        }
      } catch (error) {}
    }
  };

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/personal/diary/${id}/edit`);
  };

  const handleNewEntry = () => {
    if (onNewEntry) {
      onNewEntry();
    } else {
      router.push("/personal/diary/new");
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed left-0 top-[120px] z-20">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-pink-500 text-white p-2 rounded-r-lg hover:bg-pink-600 transition"
        >
          <PanelRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-full min-h-screen w-[280px] bg-white border-r-[1px] border-pink-200  top-[120px] overflow-y-auto">
      <div className="flex flex-col p-4">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-pink-200">
          <p className="text-pink-900 font-bold text-sm">Мой дневник</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewEntry}
              className="p-1 hover:bg-pink-100 rounded transition"
              title="New entry"
            >
              <Plus className="w-4 h-4 text-pink-600" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-pink-100 rounded transition"
              title="Collapse"
            >
              <PanelRight className="w-4 h-4 text-pink-600" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            Loading...
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No entries yet</p>
            <button
              onClick={handleNewEntry}
              className="mt-3 text-xs text-pink-600 hover:text-pink-700"
            >
              Create your first entry →
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                  pathname === `/personal/diary/${entry.id}/edit`
                    ? "bg-pink-100"
                    : "hover:bg-pink-50"
                }`}
                onClick={() => {
                  if (onSelectEntry) {
                    onSelectEntry(entry.id);
                  } else {
                    router.push(`/personal/diary/${entry.id}/edit`);
                  }
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">
                    {entry.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={(e) => handleEdit(entry.id, e)}
                    className="p-1 hover:bg-pink-200 rounded"
                    title="Edit"
                  >
                    <Edit className="w-3 h-3 text-gray-500" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(entry.id, e)}
                    className="p-1 hover:bg-red-100 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
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

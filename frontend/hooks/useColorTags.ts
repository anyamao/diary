import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";

interface ColorTags {
  [colorName: string]: string;
}

export const useColorTags = () => {
  const [tags, setTags] = useState<ColorTags>({});
  const [loading, setLoading] = useState(true);

  const loadTags = useCallback(async () => {
    try {
      const response = await api.get("/planner/tags");
      const tagsMap: ColorTags = {};
      response.data.forEach((tag: any) => {
        tagsMap[tag.color] = tag.tag_name;
      });
      setTags(tagsMap);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load color tags:", error);
      setLoading(false);
    }
  }, []);

  const saveTag = useCallback(async (color: string, tagName: string) => {
    try {
      await api.post("/planner/tags", {
        color: color,
        tag_name: tagName,
      });
      // Обновляем локальное состояние
      setTags((prev) => ({ ...prev, [color]: tagName }));
      // Триггерим событие для синхронизации
      window.dispatchEvent(new Event("color-tags-updated"));
      return true;
    } catch (error) {
      console.error("Failed to save color tag:", error);
      return false;
    }
  }, []);

  const deleteTag = useCallback(async (color: string) => {
    try {
      await api.delete(`/planner/tags/${color}`);
      // Обновляем локальное состояние
      setTags((prev) => {
        const newTags = { ...prev };
        delete newTags[color];
        return newTags;
      });
      window.dispatchEvent(new Event("color-tags-updated"));
      return true;
    } catch (error) {
      console.error("Failed to delete color tag:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  // Слушаем события обновления
  useEffect(() => {
    const handleUpdate = () => {
      loadTags();
    };
    window.addEventListener("color-tags-updated", handleUpdate);
    return () => window.removeEventListener("color-tags-updated", handleUpdate);
  }, [loadTags]);

  return {
    tags,
    loading,
    saveTag,
    deleteTag,
    loadTags,
  };
};

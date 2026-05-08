import { useState, useEffect } from "react";
import api from "@/lib/axios";

export const useColorTags = () => {
  const [tags, setTags] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  const loadTags = async () => {
    try {
      const response = await api.get("/color-tags");
      setTags(response.data);
    } catch (error) {
      console.error("Failed to load tags:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveTag = async (colorName: string, tagName: string) => {
    try {
      await api.post(`/color-tags/${colorName}`, { tag_name: tagName });
      await loadTags();
      return true;
    } catch (error) {
      console.error("Failed to save tag:", error);
      return false;
    }
  };

  const deleteTag = async (colorName: string) => {
    try {
      await api.delete(`/color-tags/${colorName}`);
      await loadTags();
      return true;
    } catch (error) {
      console.error("Failed to delete tag:", error);
      return false;
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  return { tags, loading, saveTag, deleteTag, loadTags };
};

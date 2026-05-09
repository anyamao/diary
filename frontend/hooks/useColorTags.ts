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
      setLoading(false);
    }
  }, []);

  const saveTag = useCallback(async (color: string, tagName: string) => {
    try {
      await api.post("/planner/tags", {
        color: color,
        tag_name: tagName,
      });
      setTags((prev) => ({ ...prev, [color]: tagName }));
      window.dispatchEvent(new Event("color-tags-updated"));
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  const deleteTag = useCallback(async (color: string) => {
    try {
      await api.delete(`/planner/tags/${color}`);
      setTags((prev) => {
        const newTags = { ...prev };
        delete newTags[color];
        return newTags;
      });
      window.dispatchEvent(new Event("color-tags-updated"));
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

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

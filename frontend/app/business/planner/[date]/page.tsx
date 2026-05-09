"use client";
import Loading from "@/components/Loading";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  Star,
  Save,
  Clock,
  Tag,
  Pen,
} from "lucide-react";
import { showToast } from "@/components/Toast";
import { showConfirm } from "@/components/ConfirmDialog";
import { useColorTags } from "@/hooks/useColorTags";

interface Task {
  id: string;
  title: string;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  color: string;
  is_completed: boolean;
  position: number;
}

const colors = [
  {
    name: "yellow",
    label: "Желтый",
    bg: "bg-yellow-100",
    border: "border-yellow-400",
    text: "text-yellow-800",
    tagBg: "bg-yellow-200",
    base: "bg-yellow-500",
  },
  {
    name: "blue",
    label: "Синий",
    bg: "bg-blue-100",
    border: "border-blue-400",
    text: "text-blue-800",
    tagBg: "bg-blue-200",
    base: "bg-blue-500",
  },
  {
    name: "green",
    label: "Зеленый",
    bg: "bg-green-100",
    border: "border-green-400",
    text: "text-green-800",
    tagBg: "bg-green-200",
    base: "bg-green-500",
  },
  {
    name: "purple",
    label: "Фиолетовый",
    bg: "bg-purple-100",
    border: "border-purple-400",
    text: "text-purple-800",
    tagBg: "bg-purple-200",
    base: "bg-purple-500",
  },
  {
    name: "pink",
    label: "Розовый",
    bg: "bg-pink-100",
    border: "border-pink-400",
    text: "text-pink-800",
    tagBg: "bg-pink-200",
    base: "bg-pink-500",
  },
  {
    name: "orange",
    label: "Оранжевый",
    bg: "bg-orange-100",
    border: "border-orange-400",
    text: "text-orange-800",
    tagBg: "bg-orange-200",
    base: "bg-orange-500",
  },
];

const hours = Array.from(
  { length: 24 },
  (_, i) => `${i.toString().padStart(2, "0")}:00`,
);

export default function PlannerDayPage() {
  const [dayData, setDayData] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isImportant, setIsImportant] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    start_time: "09:00",
    end_time: "10:00",
    color: "yellow",
  });

  // Используем хук для синхронизации тегов цветов
  const { tags: colorTags, loadTags: loadColorTags } = useColorTags();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const date = params.date as string;

  useEffect(() => {
    checkAuth();
    loadColorTags();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated && date) {
      fetchDayData();
    }
  }, [isAuthenticated, isLoading, date]);

  const fetchDayData = async () => {
    try {
      const response = await api.get(`/planner/days/${date}`);
      setDayData(response.data);
      setTasks(response.data.tasks || []);
      setIsImportant(response.data.is_important || false);
      setNotes(response.data.notes || "");
    } catch (error) {
      console.error("Failed to fetch day data:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveDaySettings = async () => {
    setSaving(true);
    try {
      await api.put(`/planner/days/${date}`, {
        is_important: isImportant,
        notes: notes,
      });
      showToast("Настройки дня сохранены", "success");
    } catch (error) {
      console.error("Failed to save:", error);
      showToast("Ошибка сохранения", "error");
    } finally {
      setSaving(false);
    }
  };

  const saveTask = async () => {
    if (!taskForm.title.trim()) {
      showToast("Введите название задачи", "warning");
      return;
    }

    try {
      if (editingTask) {
        await api.put(`/planner/tasks/${editingTask.id}`, taskForm);
        showToast("Задача обновлена", "success");
      } else {
        await api.post("/planner/tasks", {
          ...taskForm,
          planner_day_id: dayData.id,
          position: tasks.length,
        });
        showToast("Задача добавлена", "success");
      }
      setShowTaskModal(false);
      setEditingTask(null);
      setTaskForm({
        title: "",
        description: "",
        start_time: "09:00",
        end_time: "10:00",
        color: "yellow",
      });
      fetchDayData();
    } catch (error) {
      console.error("Failed to save task:", error);
      showToast("Ошибка сохранения", "error");
    }
  };

  const deleteTask = async (taskId: string) => {
    const confirmed = await showConfirm(
      "Удалить задачу?",
      "Вы уверены, что хотите удалить эту задачу?",
      "danger",
    );
    if (confirmed) {
      try {
        await api.delete(`/planner/tasks/${taskId}`);
        fetchDayData();
        showToast("Задача удалена", "success");
      } catch (error) {
        console.error("Failed to delete task:", error);
        showToast("Ошибка удаления", "error");
      }
    }
  };

  const toggleTaskCompleted = async (taskId: string) => {
    try {
      await api.patch(`/planner/tasks/${taskId}/toggle`);
      fetchDayData();
      showToast("Статус задачи обновлен", "success");
    } catch (error) {
      console.error("Failed to toggle task:", error);
      showToast("Ошибка", "error");
    }
  };

  const getColorStyle = (colorName: string) => {
    return colors.find((c) => c.name === colorName) || colors[0];
  };

  const getTaskDisplayName = (colorName: string) => {
    return (
      colorTags[colorName] ||
      colors.find((c) => c.name === colorName)?.label ||
      colorName
    );
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()} ${d.toLocaleString("ru", { month: "long" })} ${d.getFullYear()}`;
  };

  if (isLoading || loading) {
    return <Loading></Loading>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            href="/business/planner"
            className="text-pink-600 hover:text-pink-700"
          >
            ← Назад к календарю
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая колонка - задачи и заметки */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-pink-950">
                    {formatDateTime(date)}
                  </h1>
                  <button
                    onClick={() => setIsImportant(!isImportant)}
                    className={`p-2 rounded-full transition ${isImportant ? "text-yellow-500" : "text-gray-300 hover:text-yellow-500"}`}
                    title={
                      isImportant
                        ? "Убрать важность"
                        : "Отметить как важный день"
                    }
                  >
                    <Star
                      className={`w-6 h-6 ${isImportant ? "fill-yellow-500" : ""}`}
                    />
                  </button>
                </div>
                <button
                  onClick={saveDaySettings}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                >
                  {saving ? "Сохранение..." : "Сохранить"}
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Заметки на день
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full p-3 outline-none"
                  placeholder="Важные заметки на сегодня..."
                />
              </div>

              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-pink-900">Задачи</h2>
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setTaskForm({
                      title: "",
                      description: "",
                      start_time: "09:00",
                      end_time: "10:00",
                      color: "yellow",
                    });
                    setShowTaskModal(true);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-pink-100  text-pink-900 border-[1px] border-pink-300 rounded-lg hover:bg-pink-200"
                >
                  <Plus className="w-4 h-4" /> Добавить
                </button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {tasks.map((task) => {
                  const colorStyle = getColorStyle(task.color);
                  const displayName = getTaskDisplayName(task.color);
                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-lg border-l-4 ${colorStyle.border} ${colorStyle.bg} transition ${task.is_completed ? "opacity-60" : ""}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-2 flex-1">
                          <button
                            onClick={() => toggleTaskCompleted(task.id)}
                            className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                              task.is_completed
                                ? "bg-green-500 border-green-500"
                                : "border-gray-400 hover:border-green-400"
                            }`}
                          >
                            {task.is_completed && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3
                                className={`text-sm font-medium ${task.is_completed ? "line-through text-gray-500" : "text-gray-800"}`}
                              >
                                {task.title}
                              </h3>
                            </div>
                            {task.start_time && (
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {task.start_time} - {task.end_time || "..."}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {displayName !== colorStyle.label && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full b">
                              {displayName}
                            </span>
                          )}

                          <button
                            onClick={() => {
                              setEditingTask(task);
                              setTaskForm({
                                title: task.title,
                                description: task.description || "",
                                start_time: task.start_time || "09:00",
                                end_time: task.end_time || "10:00",
                                color: task.color,
                              });
                              setShowTaskModal(true);
                            }}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <Edit className="w-4 h-4 mx-[10px]" />
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {tasks.length === 0 && (
                  <p className="text-gray-400 text-center py-4">Нет задач</p>
                )}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-pink-900 mb-4">
                Расписание дня
              </h2>

              <div className="flex mb-2">
                <div className="w-16 text-xs text-gray-500">Час</div>
                <div className="flex-1 grid grid-cols-6 gap-0.5">
                  {[0, 10, 20, 30, 40, 50].map((min) => (
                    <div
                      key={min}
                      className="text-center text-xs text-gray-400"
                    >
                      {min === 0 ? "00" : min}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                {hours.map((hour) => {
                  const hourNum = parseInt(hour);
                  const tasksAtHour = tasks.filter((t) => {
                    if (!t.start_time) return false;
                    const startHour = parseInt(t.start_time.split(":")[0]);
                    const endHour = t.end_time
                      ? parseInt(t.end_time.split(":")[0])
                      : startHour + 1;
                    return hourNum >= startHour && hourNum < endHour;
                  });

                  return (
                    <div key={hour} className="flex items-center gap-2">
                      <div className="w-16 text-xs font-mono text-gray-500 font-medium">
                        {hour}
                      </div>
                      <div className="flex-1 relative h-8">
                        <div className="absolute inset-0 grid grid-cols-6 gap-0.5">
                          {Array.from({ length: 6 }, (_, i) => {
                            const minuteStart = i * 10;
                            let activeTask = null;
                            let taskColor = null;

                            for (const task of tasks) {
                              if (!task.start_time) continue;
                              const [startHour, startMin] = task.start_time
                                .split(":")
                                .map(Number);
                              const [endHour, endMin] = task.end_time
                                ? task.end_time.split(":").map(Number)
                                : [startHour + 1, 0];

                              const taskStartMinutes =
                                startHour * 60 + startMin;
                              let taskEndMinutes = endHour * 60 + endMin;
                              if (taskEndMinutes < taskStartMinutes)
                                taskEndMinutes += 24 * 60;

                              const cellStartMinutes =
                                hourNum * 60 + minuteStart;
                              const cellEndMinutes = cellStartMinutes + 10;

                              if (
                                cellStartMinutes < taskEndMinutes &&
                                cellEndMinutes > taskStartMinutes
                              ) {
                                activeTask = task;
                                taskColor = task.color;
                                break;
                              }
                            }

                            const activeColor = taskColor
                              ? colors.find((c) => c.name === taskColor)
                              : null;

                            return (
                              <div
                                key={i}
                                className="group relative h-full rounded transition"
                              >
                                <div
                                  className={`h-full w-full rounded ${activeColor?.bg || "bg-gray-50"} ${activeColor ? "border " + activeColor.border : ""}`}
                                  title={activeTask ? activeTask.title : ""}
                                />
                                {activeTask && (
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                                    {activeTask.title}
                                    {activeTask.start_time && (
                                      <span className="ml-1 text-gray-300">
                                        ({activeTask.start_time})
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-500 mb-2">Цвета:</p>
                <div className="flex flex-wrap gap-3">
                  {colors.map((color) => (
                    <div
                      key={color.name}
                      className="flex items-center gap-1 text-xs"
                    >
                      <div
                        className={`w-3 h-3 rounded ${color.bg} border ${color.border}`}
                      />
                      <span className="capitalize">
                        {colorTags[color.name] || color.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно для задачи - ТОЧНО ТАКОЕ ЖЕ КАК В planner/page.tsx */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {editingTask ? "Редактировать задачу" : "Новая задача"}
              </h3>
              <button
                onClick={() => setShowTaskModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={taskForm.title}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, title: e.target.value })
                }
                placeholder="Название задачи"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
                autoFocus
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">
                    Начало
                  </label>
                  <input
                    type="time"
                    value={taskForm.start_time}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, start_time: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">
                    Конец
                  </label>
                  <input
                    type="time"
                    value={taskForm.end_time}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, end_time: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Цвет</label>
                <div className="flex gap-2">
                  {colors.slice(0, 6).map((color) => (
                    <button
                      key={color.name}
                      onClick={() =>
                        setTaskForm({ ...taskForm, color: color.name })
                      }
                      className={`w-8 h-8 rounded-full transition ${color.base} ${
                        taskForm.color === color.name
                          ? "ring-2 ring-offset-2 ring-gray-400"
                          : ""
                      }`}
                      title={colorTags[color.name] || color.label}
                    >
                      <span className="sr-only">{color.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Описание
                </label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, description: e.target.value })
                  }
                  rows={2}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={saveTask}
                  className="flex-1 bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700"
                >
                  {editingTask ? "Сохранить" : "Добавить"}
                </button>
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

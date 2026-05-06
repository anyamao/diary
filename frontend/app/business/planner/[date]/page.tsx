"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, Edit, Check, X, Star, Save } from "lucide-react";

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
    code: "#fbbf24",
    bg: "bg-yellow-100",
    border: "border-yellow-400",
    light: "bg-yellow-50",
  },
  {
    name: "blue",
    code: "#60a5fa",
    bg: "bg-blue-100",
    border: "border-blue-400",
    light: "bg-blue-50",
  },
  {
    name: "green",
    code: "#34d399",
    bg: "bg-green-100",
    border: "border-green-400",
    light: "bg-green-50",
  },
  {
    name: "purple",
    code: "#c084fc",
    bg: "bg-purple-100",
    border: "border-purple-400",
    light: "bg-purple-50",
  },
  {
    name: "pink",
    code: "#f472b6",
    bg: "bg-pink-100",
    border: "border-pink-400",
    light: "bg-pink-50",
  },
  {
    name: "orange",
    code: "#fb923c",
    bg: "bg-orange-100",
    border: "border-orange-400",
    light: "bg-orange-50",
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

  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const date = params.date as string;

  useEffect(() => {
    checkAuth();
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
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  const saveTask = async () => {
    if (!taskForm.title.trim()) {
      alert("Введите название задачи");
      return;
    }

    try {
      if (editingTask) {
        await api.put(`/planner/tasks/${editingTask.id}`, taskForm);
      } else {
        await api.post("/planner/tasks", {
          ...taskForm,
          planner_day_id: dayData.id,
          position: tasks.length,
        });
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
      alert("Ошибка сохранения");
    }
  };

  const deleteTask = async (taskId: string) => {
    if (confirm("Удалить эту задачу?")) {
      try {
        await api.delete(`/planner/tasks/${taskId}`);
        fetchDayData();
      } catch (error) {
        console.error("Failed to delete task:", error);
        alert("Ошибка удаления");
      }
    }
  };

  const toggleTaskCompleted = async (taskId: string) => {
    try {
      await api.patch(`/planner/tasks/${taskId}/toggle`);
      fetchDayData();
    } catch (error) {
      console.error("Failed to toggle task:", error);
    }
  };

  const getColorStyle = (colorName: string) => {
    return colors.find((c) => c.name === colorName) || colors[0];
  };

  // Функция для определения позиции задачи в сетке 6x24
  const getTaskGridPosition = (startTime: string, endTime: string) => {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    // Преобразуем в минуты от начала дня
    const startMinutes = startHour * 60 + startMinute;
    let endMinutes = endHour * 60 + endMinute;

    // Если время окончания меньше времени начала (переход через полночь)
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }

    // Каждый слот = 10 минут (6 слотов в час, 24*6=144 слота)
    const slotWidth = 100 / 144; // процент на один слот

    const startSlot = Math.floor(startMinutes / 10);
    const durationSlots = Math.ceil((endMinutes - startMinutes) / 10);

    return {
      left: startSlot * slotWidth,
      width: durationSlots * slotWidth,
    };
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()} ${d.toLocaleString("ru", { month: "long" })} ${d.getFullYear()}`;
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            href="/business/planner"
            className="text-blue-600 hover:text-blue-700"
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
                  <h1 className="text-2xl font-bold text-gray-800">
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
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Save className="w-4 h-4" />{" "}
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
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Важные заметки на сегодня..."
                />
              </div>

              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Задачи</h2>
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
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" /> Добавить
                </button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {tasks.map((task) => {
                  const colorStyle = getColorStyle(task.color);
                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-lg border-l-4 ${colorStyle.border} ${colorStyle.bg} transition ${task.is_completed ? "opacity-60" : ""}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-2 flex-1">
                          <button
                            onClick={() => toggleTaskCompleted(task.id)}
                            className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition ${
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
                            <h3
                              className={`text-sm font-medium ${task.is_completed ? "line-through text-gray-500" : "text-gray-800"}`}
                            >
                              {task.title}
                            </h3>
                            {task.start_time && (
                              <p className="text-xs text-gray-500 mt-1">
                                {task.start_time} - {task.end_time || "..."}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
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
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
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

          {/* Правая колонка - временная шкала */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Расписание дня
              </h2>

              {/* Заголовки часов */}
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

              {/* Сетка 24x6 */}
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

                  // Если есть задача, которая пересекается с этим часом
                  let mainTask = tasksAtHour[0];
                  let colorStyle = mainTask
                    ? getColorStyle(mainTask.color)
                    : null;

                  // Проверяем задачи, которые начинаются в этом часу (для отображения полной полосы)
                  const tasksStartingHere = tasks.filter((t) => {
                    if (!t.start_time) return false;
                    const startHour = parseInt(t.start_time.split(":")[0]);
                    return startHour === hourNum;
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
                            let isActive = false;
                            let taskColor = null;

                            // Проверяем, активна ли эта 10-минутная ячейка
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
                                isActive = true;
                                taskColor = task.color;
                                break;
                              }
                            }

                            const activeColor = taskColor
                              ? getColorStyle(taskColor)
                              : null;

                            return (
                              <div
                                key={i}
                                className={`h-full rounded transition ${isActive ? activeColor?.bg || "bg-blue-100" : "bg-gray-50"} ${isActive ? "border" + (activeColor?.border || "") : ""}`}
                                title={
                                  isActive
                                    ? `Активно: ${tasksAtHour.map((t) => t.title).join(", ")}`
                                    : ""
                                }
                              />
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
                      <span className="capitalize">{color.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Модальное окно для задачи */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {editingTask ? "Редактировать задачу" : "Новая задача"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Название *
                </label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, title: e.target.value })
                  }
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Начало
                  </label>
                  <input
                    type="time"
                    value={taskForm.start_time}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, start_time: e.target.value })
                    }
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Конец
                  </label>
                  <input
                    type="time"
                    value={taskForm.end_time}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, end_time: e.target.value })
                    }
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Цвет</label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() =>
                        setTaskForm({ ...taskForm, color: color.name })
                      }
                      className={`w-8 h-8 rounded-full transition ${color.bg} border-2 ${
                        taskForm.color === color.name
                          ? "border-gray-800 scale-110"
                          : "border-transparent"
                      }`}
                      title={color.name}
                    />
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Описание
                  </label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, description: e.target.value })
                    }
                    rows={2}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={saveTask}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    {editingTask ? "Обновить" : "Создать"}
                  </button>
                  <button
                    onClick={() => setShowTaskModal(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
          )
        </div>
      )}
      )
    </div>
  );
}

"use client";
import Loading from "@/components/Loading";
import { CalendarDays } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Calendar,
  ChevronUp,
  ChevronDown,
  Plus,
  Check,
  X,
  Trash2,
  Edit,
  Target,
  FileText,
  Tag,
  Pen,
  Clock,
} from "lucide-react";
import { showToast } from "@/components/Toast";
import { showConfirm } from "@/components/ConfirmDialog";
import { useColorTags } from "@/hooks/useColorTags";
const weekDays = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];
const weekDaysShort = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const monthNames = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

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
    name: "dark-pink",
    label: "Темно-розовый",
    bg: "bg-pink-200",
    border: "border-pink-400",
    text: "text-pink-800",
    tagBg: "bg-pink-300",
    base: "bg-pink-600",
  },

  {
    name: "teal",
    label: "Бирюзовый",
    bg: "bg-teal-100",
    border: "border-teal-400",
    text: "text-teal-800",
    tagBg: "bg-teal-200",
    base: "bg-teal-500",
  },
  {
    name: "indigo",
    label: "Индиго",
    bg: "bg-indigo-200",
    border: "border-indigo-400",
    text: "text-indigo-800",
    tagBg: "bg-indigo-200",
    base: "bg-indigo-600",
  },
  {
    name: "fuchsia",
    label: "Фукция",
    bg: "bg-fuchsia-200",
    border: "border-fuchsia-400",
    text: "text-fuchsia-800",
    tagBg: "bg-fuchsia-200",
    base: "bg-fuchsia-600",
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

export default function PlannerPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [months, setMonths] = useState<any[]>([]);
  const [weekPlan, setWeekPlan] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [isWeekVisible, setIsWeekVisible] = useState(true);
  const [hiddenWeeks, setHiddenWeeks] = useState<number[]>([]);
  const [addingTaskForDay, setAddingTaskForDay] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskColor, setNewTaskColor] = useState("yellow");
  const [newTaskDay, setNewTaskDay] = useState<string>("");
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskColor, setEditTaskColor] = useState("yellow");
  const [editTaskStart, setEditTaskStart] = useState("09:00");
  const [editTaskEnd, setEditTaskEnd] = useState("10:00");
  const [showEditModal, setShowEditModal] = useState(false);
  const {
    tags: tagNames,
    saveTag: saveTagName,
    loadTags: loadTagNames,
  } = useColorTags();
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");
  // Цели
  const [weeklyGoals, setWeeklyGoals] = useState<{ [key: number]: string }>({});
  const [monthlyGoal, setMonthlyGoal] = useState("");
  const [editingWeeklyGoal, setEditingWeeklyGoal] = useState<number | null>(
    null,
  );
  const [editingMonthlyGoal, setEditingMonthlyGoal] = useState(false);
  const [weeklyNotes, setWeeklyNotes] = useState<{ [key: number]: string }>({});
  const [editingWeeklyNote, setEditingWeeklyNote] = useState<number | null>(
    null,
  );
  const calendarDateRef = useRef(new Date());
  const [loadingMonths, setLoadingMonths] = useState(false);
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const [calendarDate, setCalendarDate] = useState(new Date()); // Только для календаря
  // Функция для получения правильного диапазона недели (с учетом компенсации)
  const getCorrectWeekRange = (startDate: Date) => {
    const start = new Date(startDate);
    const end = new Date(startDate);

    // Компенсируем сдвиг
    start.setDate(start.getDate());
    end.setDate(end.getDate() + 7);

    const formatDateRange = (date: Date) => {
      const day = date.getDate();
      const month = date.toLocaleString("ru-RU", { month: "short" });
      return `${day} ${month}`;
    };

    // Сдвигаем начало на 1 день вперед, конец на 1 день вперед
    const correctedStart = new Date(start);
    const correctedEnd = new Date(end);
    correctedStart.setDate(start.getDate());
    correctedEnd.setDate(end.getDate() - 1);

    return `${formatDateRange(correctedStart)} - ${formatDateRange(correctedEnd)}`;
  };
  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const addTaskLocally = (dayDate: string, newTask: any) => {
    setWeekPlan((prevWeekPlan) => {
      const newWeekPlan = [...prevWeekPlan];
      for (let week of newWeekPlan) {
        const dayIndex = week.days.findIndex((d: any) => d.date === dayDate);
        if (dayIndex !== -1) {
          // Проверяем, нет ли уже такой задачи
          const taskExists = week.days[dayIndex].tasks.some(
            (t: any) =>
              t.title === newTask.title &&
              t.start_time === newTask.start_time &&
              t.end_time === newTask.end_time,
          );

          if (!taskExists) {
            week.days[dayIndex].tasks = [...week.days[dayIndex].tasks, newTask];
          }
          break;
        }
      }
      return newWeekPlan;
    });

    // Обновляем месяцы
    setMonths((prevMonths) => {
      const newMonths = [...prevMonths];
      for (let month of newMonths) {
        const dayIndex = month.days.findIndex((d: any) => d.date === dayDate);
        if (dayIndex !== -1) {
          month.days[dayIndex].has_tasks = true;
          break;
        }
      }
      return newMonths;
    });
  };
  const loadMonthsOnly = useCallback(async () => {
    setLoadingMonths(true);
    const monthsData = [];
    const startMonth = new Date(calendarDateRef.current);
    startMonth.setMonth(calendarDateRef.current.getMonth() - 1);

    for (let i = 0; i < 3; i++) {
      const month = new Date(startMonth);
      month.setMonth(startMonth.getMonth() + i);
      const year = month.getFullYear();
      const monthNum = month.getMonth() + 1;

      try {
        const response = await api.get(`/planner/months/${year}/${monthNum}`);

        const daysWithImportance = await Promise.all(
          response.data.map(async (day: any) => {
            try {
              const dayData = await api.get(`/planner/days/${day.date}`);
              return {
                ...day,
                is_important: dayData.data?.is_important || false,
              };
            } catch {
              return { ...day, is_important: false };
            }
          }),
        );

        monthsData.push({
          year,
          month: monthNum,
          name: monthNames[monthNum - 1],
          days: daysWithImportance,
        });
      } catch (error) {}
    }
    setMonths(monthsData);
    setLoadingMonths(false);
  }, []); // Пустой массив зависимостей, так как используем ref
  const loadWeekPlanOnly = async () => {
    try {
      const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
      const startOfWeek = getWeekStart(firstDayOfMonth);

      const weeksData = [];
      for (let week = 0; week < 4; week++) {
        const weekStart = new Date(startOfWeek);
        weekStart.setDate(startOfWeek.getDate() + week * 7);

        const weekDaysPromises = [];
        for (let i = 0; i < 7; i++) {
          const day = new Date(weekStart);
          day.setDate(weekStart.getDate() + i);
          const dateStr = formatDate(day);
          weekDaysPromises.push(
            api.get(`/planner/days/${dateStr}`).catch(() => ({ data: null })),
          );
        }

        const responses = await Promise.all(weekDaysPromises);
        const weekDaysData = responses.map((res, index) => {
          const day = new Date(weekStart);
          day.setDate(weekStart.getDate() + index);
          const data = res?.data;
          return {
            date: formatDate(day),
            dayOfWeek: weekDays[index],
            dayNumber: day.getDate(),
            isImportant: data?.is_important || false,
            notes: data?.notes || "",
            tasks: data?.tasks || [],
          };
        });

        weeksData.push({
          weekNumber: week + 1,
          days: weekDaysData,
          startDate: formatDate(weekStart),
        });
      }
      setWeekPlan(weeksData);

      await loadMonthsOnly();
    } catch (error) {}
  };

  const getWeekRange = (startDate: Date) => {
    const start = new Date(startDate);
    const end = new Date(startDate);

    // Добавляем компенсацию (+1 день)
    start.setDate(start.getDate() + 1);
    end.setDate(end.getDate() + 7); // +1 день для компенсации +6 дней для недели = +7

    const formatDate = (date: Date) => {
      const day = date.getDate();
      const month = date.toLocaleString("ru-RU", { month: "short" });
      return `${day} ${month}`;
    };

    return `${formatDate(start)} - ${formatDate(end)}`;
  };
  // Добавьте состояние для кэша важности
  const [importanceCache, setImportanceCache] = useState<
    Record<string, boolean>
  >({});

  // При загрузке weekPlan обновляем кэш
  useEffect(() => {
    if (weekPlan.length > 0) {
      const newCache: Record<string, boolean> = {};
      weekPlan.forEach((week) => {
        week.days.forEach((day: any) => {
          newCache[day.date] = day.isImportant;
        });
      });
      setImportanceCache(newCache);
    }
  }, [weekPlan]);

  // В рендере используем кэш
  const updateMonths = async () => {
    // Просто перезагружаем месяцы из недельного плана
    setMonths((prevMonths) => {
      const newMonths = [...prevMonths];
      for (let i = 0; i < newMonths.length; i++) {
        const month = newMonths[i];
        if (month && month.days) {
          const updatedDays = month.days.map((day: any) => {
            // Ищем важность в weekPlan
            let isImportant = false;
            for (const week of weekPlan) {
              const foundDay = week.days.find((d: any) => d.date === day.date);
              if (foundDay && foundDay.isImportant) {
                isImportant = true;
                break;
              }
            }
            return {
              ...day,
              is_important: isImportant,
            };
          });
          newMonths[i] = {
            ...month,
            days: updatedDays,
          };
        }
      }
      return newMonths;
    });
  };

  useEffect(() => {
    if (isAuthenticated && months.length === 0) {
      loadMonthsOnly();
      loadWeekPlanOnly();
      loadGoalsAndNotes();
    }
  }, [isAuthenticated]);
  useEffect(() => {
    if (
      isAuthenticated &&
      (selectedMonth !== undefined || selectedYear !== undefined)
    ) {
      loadWeekPlanOnly();
      loadGoalsAndNotes();
    }
  }, [selectedMonth, selectedYear]);
  // Добавьте этот useEffect в компонент PlannerPage
  useEffect(() => {
    const handleTagsUpdate = () => {
      loadTagNames();
    };
    window.addEventListener("color-tags-updated", handleTagsUpdate);
    return () =>
      window.removeEventListener("color-tags-updated", handleTagsUpdate);
  }, [loadTagNames]);

  // Добавьте эту функцию после других локальных функций обновления
  const toggleDayImportanceLocally = (date: string, newStatus: boolean) => {
    // Обновляем weekPlan
    setWeekPlan((prevWeekPlan) => {
      const newWeekPlan = [...prevWeekPlan];
      for (let week of newWeekPlan) {
        const dayIndex = week.days.findIndex((d: any) => d.date === date);
        if (dayIndex !== -1) {
          week.days[dayIndex].isImportant = newStatus;
          break;
        }
      }
      return newWeekPlan;
    });

    // Обновляем months
    setMonths((prevMonths) => {
      const newMonths = [...prevMonths];
      for (let month of newMonths) {
        const dayIndex = month.days.findIndex((d: any) => d.date === date);
        if (dayIndex !== -1) {
          month.days[dayIndex].is_important = newStatus;
          break;
        }
      }
      return newMonths;
    });
  };

  // Замените существующую функцию toggleDayImportance на эту:
  const toggleDayImportance = async (date: string, currentStatus: boolean) => {
    try {
      const dayResponse = await api.get(`/planner/days/${date}`);
      let plannerDayId = dayResponse.data?.id;

      if (!plannerDayId) {
        const createResponse = await api.post(`/planner/days/${date}`, {});
        plannerDayId = createResponse.data?.id;
      }

      await api.put(`/planner/days/${date}`, {
        is_important: !currentStatus,
      });

      // Локально обновляем состояние без перезагрузки
      toggleDayImportanceLocally(date, !currentStatus);

      showToast(
        !currentStatus ? "День отмечен как важный" : "Важность дня снята",
        "success",
      );
    } catch (error) {
      showToast("Ошибка", "error");
    }
  };
  const loadGoalsAndNotes = async () => {
    try {
      const response = await api.get(
        `/planner/monthly/${selectedYear}/${selectedMonth + 1}`,
      );
      if (response.data) {
        setMonthlyGoal(response.data.monthly_goal || "");
        setWeeklyGoals(response.data.weekly_goals || {});
        setWeeklyNotes(response.data.weekly_notes || {});
      }
    } catch (error) {}
  };

  const saveMonthlyGoal = async () => {
    try {
      await api.post(`/planner/monthly/${selectedYear}/${selectedMonth + 1}`, {
        monthly_goal: monthlyGoal,
        weekly_goals: weeklyGoals,
        weekly_notes: weeklyNotes,
      });
      setEditingMonthlyGoal(false);
      showToast("Цель на месяц сохранена", "success");
    } catch (error) {
      showToast("Ошибка сохранения", "error");
    }
  };

  const saveWeeklyGoal = async (weekNumber: number) => {
    try {
      await api.post(`/planner/monthly/${selectedYear}/${selectedMonth + 1}`, {
        monthly_goal: monthlyGoal,
        weekly_goals: weeklyGoals,
        weekly_notes: weeklyNotes,
      });
      setEditingWeeklyGoal(null);
      showToast("Цель на неделю сохранена", "success");
    } catch (error) {
      showToast("Ошибка сохранения", "error");
    }
  };

  const saveWeeklyNote = async (weekNumber: number) => {
    try {
      await api.post(`/planner/monthly/${selectedYear}/${selectedMonth + 1}`, {
        monthly_goal: monthlyGoal,
        weekly_goals: weeklyGoals,
        weekly_notes: weeklyNotes,
      });
      setEditingWeeklyNote(null);
      showToast("Заметка сохранена", "success");
    } catch (error) {
      showToast("Ошибка сохранения", "error");
    }
  };

  const toggleTaskLocally = (taskId: string) => {
    setWeekPlan((prevWeekPlan) => {
      const newWeekPlan = [...prevWeekPlan];
      for (let week of newWeekPlan) {
        for (let day of week.days) {
          const taskIndex = day.tasks.findIndex((t: any) => t.id === taskId);
          if (taskIndex !== -1) {
            day.tasks[taskIndex].is_completed =
              !day.tasks[taskIndex].is_completed;
            break;
          }
        }
      }
      return newWeekPlan;
    });
  };

  const toggleTaskCompletion = async (taskId: string) => {
    try {
      await api.patch(`/planner/tasks/${taskId}/toggle`);

      toggleTaskLocally(taskId);

      showToast("Задача обновлена", "success");
    } catch (error) {
      showToast("Ошибка", "error");
    }
  };
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [tempTaskDay, setTempTaskDay] = useState("");
  const [tempTaskTitle, setTempTaskTitle] = useState("");
  const [tempTaskColor, setTempTaskColor] = useState("yellow");
  const [tempTaskStart, setTempTaskStart] = useState("09:00");
  const [tempTaskEnd, setTempTaskEnd] = useState("10:00");

  const openAddTaskModal = (dayDate: string) => {
    setTempTaskDay(dayDate);
    setTempTaskTitle("");
    setTempTaskColor("yellow");
    setTempTaskStart("09:00");
    setTempTaskEnd("10:00");
    setShowAddTaskModal(true);
  };
  const addTaskFromModal = async () => {
    if (!tempTaskTitle.trim() || !tempTaskDay) return;

    // Блокируем кнопку, чтобы избежать повторных кликов
    const saveButton = document.querySelector(
      ".save-task-button",
    ) as HTMLButtonElement;
    if (saveButton) saveButton.disabled = true;

    try {
      const dayResponse = await api.get(`/planner/days/${tempTaskDay}`);
      let plannerDayId = dayResponse.data?.id;

      if (!plannerDayId) {
        const createResponse = await api.post(
          `/planner/days/${tempTaskDay}`,
          {},
        );
        plannerDayId = createResponse.data?.id;
      }

      const response = await api.post("/planner/tasks", {
        title: tempTaskTitle,
        description: "",
        start_time: tempTaskStart,
        end_time: tempTaskEnd,
        color: tempTaskColor,
        planner_day_id: plannerDayId,
        position: 0,
      });

      // Проверяем, не существует ли уже такая задача (по заголовку и времени)
      let taskExists = false;
      for (const week of weekPlan) {
        for (const day of week.days) {
          if (day.date === tempTaskDay) {
            taskExists = day.tasks.some(
              (t: any) =>
                t.title === tempTaskTitle &&
                t.start_time === tempTaskStart &&
                t.end_time === tempTaskEnd,
            );
            break;
          }
        }
      }

      if (!taskExists) {
        const newTask = {
          id: response.data.id,
          title: tempTaskTitle,
          description: "",
          start_time: tempTaskStart,
          end_time: tempTaskEnd,
          color: tempTaskColor,
          is_completed: false,
          position: 0,
        };

        addTaskLocally(tempTaskDay, newTask);
        showToast("Задача добавлена", "success");
      } else {
        showToast("Такая задача уже существует", "warning");
      }

      setShowAddTaskModal(false);
      setTempTaskTitle("");
      setTempTaskColor("yellow");
      setTempTaskDay("");
    } catch (error) {
      showToast("Ошибка добавления", "error");
    } finally {
      if (saveButton) saveButton.disabled = false;
    }
  };
  const updateTaskLocally = (taskId: string, updatedTask: any) => {
    setWeekPlan((prevWeekPlan) => {
      const newWeekPlan = [...prevWeekPlan];
      for (let week of newWeekPlan) {
        for (let day of week.days) {
          const taskIndex = day.tasks.findIndex((t: any) => t.id === taskId);
          if (taskIndex !== -1) {
            day.tasks[taskIndex] = { ...day.tasks[taskIndex], ...updatedTask };
            break;
          }
        }
      }
      return newWeekPlan;
    });
  };

  const updateTask = async () => {
    if (!editTaskTitle.trim() || !editingTask) return;

    try {
      await api.put(`/planner/tasks/${editingTask.id}`, {
        title: editTaskTitle,
        description: "",
        start_time: editTaskStart,
        end_time: editTaskEnd,
        color: editTaskColor,
      });

      // Локально обновляем задачу
      updateTaskLocally(editingTask.id, {
        title: editTaskTitle,
        start_time: editTaskStart,
        end_time: editTaskEnd,
        color: editTaskColor,
      });

      setShowEditModal(false);
      setEditingTask(null);
      showToast("Задача обновлена", "success");
    } catch (error) {
      showToast("Ошибка обновления", "error");
    }
  };

  // Функция для локального удаления задачи
  const deleteTaskLocally = (taskId: string, dayDate: string) => {
    setWeekPlan((prevWeekPlan) => {
      const newWeekPlan = [...prevWeekPlan];
      for (let week of newWeekPlan) {
        for (let day of week.days) {
          if (day.date === dayDate) {
            day.tasks = day.tasks.filter((t: any) => t.id !== taskId);
            break;
          }
        }
      }
      return newWeekPlan;
    });
  };

  // Обновите deleteTask
  const deleteTask = async (taskId: string) => {
    const confirmed = await showConfirm(
      "Удалить задачу?",
      "Вы уверены, что хотите удалить эту задачу?",
      "danger",
    );
    if (confirmed) {
      try {
        // Находим день, в котором находится задача
        let taskDay = "";
        for (const week of weekPlan) {
          for (const day of week.days) {
            if (day.tasks.some((t: any) => t.id === taskId)) {
              taskDay = day.date;
              break;
            }
          }
        }

        await api.delete(`/planner/tasks/${taskId}`);

        // Локально удаляем задачу
        deleteTaskLocally(taskId, taskDay);

        showToast("Задача удалена", "success");
      } catch (error) {
        showToast("Ошибка удаления", "error");
      }
    }
  };
  const openEditTaskModal = (task: any) => {
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskColor(task.color);
    setEditTaskStart(task.start_time || "09:00");
    setEditTaskEnd(task.end_time || "10:00");
    setShowEditModal(true);
  };

  const toggleWeekVisibility = (weekNumber: number) => {
    if (hiddenWeeks.includes(weekNumber)) {
      setHiddenWeeks(hiddenWeeks.filter((w) => w !== weekNumber));
    } else {
      setHiddenWeeks([...hiddenWeeks, weekNumber]);
    }
  };

  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const prevMonthPeriod = useCallback(() => {
    const newDate = new Date(calendarDateRef.current);
    newDate.setMonth(calendarDateRef.current.getMonth() - 3);
    calendarDateRef.current = newDate;
    loadMonthsOnly();
  }, [loadMonthsOnly]);

  const nextMonthPeriod = useCallback(() => {
    const newDate = new Date(calendarDateRef.current);
    newDate.setMonth(calendarDateRef.current.getMonth() + 3);
    calendarDateRef.current = newDate;
    loadMonthsOnly();
  }, [loadMonthsOnly]);
  const prevMonthForWeek = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
    loadWeekPlanOnly();
  };

  const nextMonthForWeek = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
    loadWeekPlanOnly();
  };

  const isLoadingMonths = loadingMonths || loading;
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const getTaskDisplayName = (colorName: string) => {
    return (
      tagNames[colorName] ||
      colors.find((c) => c.name === colorName)?.label ||
      colorName
    );
  };

  if (isLoading || loadingMonths) {
    return <Loading></Loading>;
  }

  return (
    <div className="min-h-screen bg-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-pink-950 mb-2">
              Планировщик
            </h1>
            <p className="text-gray-600">Планируй свои дни и задачи</p>
          </div>
          <button
            onClick={() => {
              const today = new Date();
              setCurrentDate(today);
              setSelectedMonth(today.getMonth());
              setSelectedYear(today.getFullYear());
            }}
            className="px-4 py-2 text-pink-900 bg-pink-200 rounded-lg hover:bg-pink-300 transition"
          >
            Сегодня
          </button>
        </div>

        <div className="mb-12">
          <div className="flex justify-end mb-6 gap-3">
            <button
              onClick={prevMonthPeriod}
              className="p-2 bg-pink-500 rounded-lg hover:bg-pink-600 transition"
            >
              <ChevronLeft className="w-5 text-white h-5" />
            </button>
            <button
              onClick={nextMonthPeriod}
              className="p-2 bg-pink-500 rounded-lg hover:bg-pink-600 transition"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {months.map((month, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-lg p-4 relative"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
                  {month.name} {month.year}
                </h2>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDaysShort.map((day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-medium text-gray-500 py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({
                    length:
                      getFirstDayOfMonth(month.year, month.month) === 0
                        ? 6
                        : getFirstDayOfMonth(month.year, month.month) - 1,
                  }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-12" />
                  ))}
                  {month.days.map((day: any) => {
                    const date = new Date(day.date);
                    const dayInfo = weekPlan
                      .find((w) => w.days.some((d: any) => d.date === day.date))
                      ?.days.find((d: any) => d.date === day.date);

                    const isImportant =
                      day.is_important || importanceCache[day.date] || false;
                    const hasTasks = day.has_tasks;
                    const isToday =
                      date.toDateString() === new Date().toDateString();
                    const dayNotes = dayInfo?.notes;

                    return (
                      <div key={day.date} className="relative group">
                        <Link
                          href={`/business/planner/${day.date}`}
                          className={`
                            h-12 rounded-lg flex flex-col items-center justify-center p-1 transition hover:scale-105 block
                            ${isImportant ? "bg-yellow-100 hover:bg-yellow-200" : "bg-gray-50 hover:bg-gray-100"}
                            ${isToday ? "ring-2 ring-pink-300" : ""}
                          `}
                        >
                          <span
                            className={`text-sm font-medium ${isImportant ? "text-yellow-800" : "text-gray-700"}`}
                          >
                            {date.getDate()}
                          </span>
                          {hasTasks && (
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-0.5" />
                          )}
                        </Link>
                        {isImportant && dayNotes && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                            {dayNotes.length > 30
                              ? dayNotes.substring(0, 30) + "..."
                              : dayNotes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className=" rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-5 h-5 text-pink-800" />
            <h3 className="font-semibold text-gray-800">
              Настройка тегов для цветов
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {colors.map((color) => (
              <div key={color.name} className="flex flex-col gap-1">
                <div
                  className={`flex items-center gap-2 p-2 rounded-lg ${color.bg}`}
                >
                  <div
                    className={`min-w-4 min-h-4 rounded-full ${color.base}`}
                  />
                  <span className="text-sm font-medium max-w-[190px] overflow-x-auto">
                    {tagNames[color.name] ? tagNames[color.name] : color.label}
                  </span>
                  <button
                    onClick={() => {
                      setEditingTag(color.name);
                      setNewTagName(tagNames[color.name] || "");
                    }}
                    className="ml-auto text-pink-500 hover:text-pink-700"
                  >
                    <Pen className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {editingTag && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  Редактировать тег для{" "}
                  {colors.find((c) => c.name === editingTag)?.label}
                </h3>
                <button
                  onClick={() => setEditingTag(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Название тега"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      if (newTagName.trim()) {
                        await saveTagName(editingTag, newTagName);
                        setEditingTag(null);
                        setNewTagName("");
                        // Принудительно обновляем отображение
                        loadTagNames();
                      }
                    }}
                    className="flex-1 bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700"
                  >
                    Сохранить
                  </button>

                  <button
                    onClick={() => setEditingTag(null)}
                    className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="mt-12 pt-8 border-t-[1px] border-pink-200">
          <button
            onClick={() => setIsWeekVisible(!isWeekVisible)}
            className="flex items-center gap-2 text-pink-800 hover:text-pink-900 mb-4 transition"
          >
            {isWeekVisible ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
            <span className="font-medium">
              {isWeekVisible
                ? "Скрыть недельный план"
                : "Показать недельный план"}
            </span>
          </button>

          {isWeekVisible && (
            <>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {monthNames[selectedMonth]} {selectedYear}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={prevMonthForWeek}
                      className="p-1.5 bg-pink-200 rounded-lg hover:bg-pink-300 transition"
                    >
                      <ChevronLeft className="w-4 text-pink-800 h-4" />
                    </button>
                    <button
                      onClick={nextMonthForWeek}
                      className="p-1.5 bg-pink-200 rounded-lg hover:bg-pink-300 transition"
                    >
                      <ChevronRight className="w-4 text-pink-900 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Цель на месяц */}
              <div className="bg-pink-100 rounded-lg p-4 mb-6 border border-pink-300">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-pink-950">Цель на месяц</h3>
                </div>
                {editingMonthlyGoal ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={monthlyGoal}
                      onChange={(e) => setMonthlyGoal(e.target.value)}
                      className="flex-1 p-2 outline-none bg-pink-100"
                      rows={2}
                      placeholder="Какая у тебя цель на этот месяц?"
                      autoFocus
                    />
                    <div className="flex flex-row gap-3">
                      <button
                        onClick={saveMonthlyGoal}
                        className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                      >
                        Сохранить
                      </button>
                      <button
                        onClick={() => setEditingMonthlyGoal(false)}
                        className="px-4 py-2 bg-pink-50 border border-pink-300 rounded-lg hover:bg-gray-100"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <p className="text-gray-700 whitespace-pre-wrap flex-1">
                      {monthlyGoal ||
                        'Нет цели. Нажмите "Редактировать", чтобы добавить цель на месяц.'}
                    </p>
                    <button
                      onClick={() => setEditingMonthlyGoal(true)}
                      className="text-pink-600 hover:text-pink-700 ml-2"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-8">
                {weekPlan.map((week) => {
                  const isHidden = hiddenWeeks.includes(week.weekNumber);
                  return (
                    <div key={week.weekNumber} className="">
                      <button
                        onClick={() => toggleWeekVisibility(week.weekNumber)}
                        className="w-full flex justify-between items-center rounded-lg p-4 hover:bg-pink-100 transition"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-pink-500" />
                          <h3 className="text-lg font-semibold text-pink-900">
                            Неделя {week.weekNumber}{" "}
                          </h3>
                          <p className="text-gray-700">
                            {getCorrectWeekRange(new Date(week.startDate))}
                          </p>
                          {isHidden ? (
                            <ChevronDown className="w-4 h-4 text-pink-500" />
                          ) : (
                            <ChevronUp className="w-4 h-4 text-pink-500" />
                          )}
                        </div>
                      </button>

                      {!isHidden && (
                        <div className="p-4 pt-0 border-t">
                          {/* Цель на неделю */}
                          <div className="bg-pink-100 mt-[20px] rounded-lg p-3 mb-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-pink-800">
                                Цель на неделю
                              </span>
                            </div>
                            {editingWeeklyGoal === week.weekNumber ? (
                              <div className="flex flex-col gap-2 mt-2">
                                <input
                                  type="text"
                                  value={weeklyGoals[week.weekNumber] || ""}
                                  onChange={(e) =>
                                    setWeeklyGoals({
                                      ...weeklyGoals,
                                      [week.weekNumber]: e.target.value,
                                    })
                                  }
                                  className="flex-1 p-2 outline-none bg-pink-100"
                                  placeholder="Цель на эту неделю..."
                                  autoFocus
                                />
                                <div className="flex flex-row gap-3">
                                  <button
                                    onClick={() =>
                                      saveWeeklyGoal(week.weekNumber)
                                    }
                                    className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                                  >
                                    Сохранить
                                  </button>
                                  <button
                                    onClick={() => setEditingWeeklyGoal(null)}
                                    className="px-4 py-2 bg-pink-50 rounded-lg hover:bg-gray-50 border-[1px] border-pink-300"
                                  >
                                    Отмена
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-between items-start">
                                <p className="text-sm text-gray-600 flex-1">
                                  {weeklyGoals[week.weekNumber] || "Нет цели"}
                                </p>
                                <button
                                  onClick={() =>
                                    setEditingWeeklyGoal(week.weekNumber)
                                  }
                                  className="text-pink-600 hover:text-blue-700"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Заметка на неделю */}
                          <div className="bg-pink-100 rounded-lg p-3 mb-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-pink-800">
                                Заметка на неделю
                              </span>
                            </div>
                            {editingWeeklyNote === week.weekNumber ? (
                              <div className="flex gap-2 mt-2 flex flex-col">
                                <textarea
                                  value={weeklyNotes[week.weekNumber] || ""}
                                  onChange={(e) =>
                                    setWeeklyNotes({
                                      ...weeklyNotes,
                                      [week.weekNumber]: e.target.value,
                                    })
                                  }
                                  className="flex-1 p-2 outline-none bg-pink-100 text-gray-700"
                                  rows={2}
                                  placeholder="Что важно помнить на этой неделе?"
                                  autoFocus
                                />
                                <div className="flex flex-row gap-3">
                                  <button
                                    onClick={() =>
                                      saveWeeklyNote(week.weekNumber)
                                    }
                                    className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                                  >
                                    Сохранить
                                  </button>
                                  <button
                                    onClick={() => setEditingWeeklyNote(null)}
                                    className="px-4 py-2 bg-pink-50 rounded-lg hover:bg-gray-50 border-[1px] border-pink-300"
                                  >
                                    Отмена
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-between items-start">
                                <p className="text-sm text-gray-600 whitespace-pre-wrap flex-1">
                                  {weeklyNotes[week.weekNumber] ||
                                    "Нет заметок"}
                                </p>
                                <button
                                  onClick={() =>
                                    setEditingWeeklyNote(week.weekNumber)
                                  }
                                  className="text-pink-600 hover:text-pink-700"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Дни недели */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {week.days.map((day: any) => (
                              <div
                                key={day.date}
                                className={`
                                  bg-white rounded-lg text-pink-900 shadow-sm p-4 transition hover:shadow-md flex flex-col min-w-[280px] sm:min-w-[300px] border-[1px] border-pink-200
                                  ${day.isImportant ? "border-yellow-400" : "border-gray-200"}
                                `}
                              >
                                <div className="flex flex-row items-center justify-between w-full mb-3">
                                  <Link
                                    href={`/business/planner/${day.date}`}
                                    className="flex items-baseline gap-2 cursor-pointer flex-1"
                                  >
                                    <p
                                      className={`text-xl font-bold text-pink-950`}
                                    >
                                      {day.dayNumber}
                                    </p>
                                    <p className="text-sm font-medium text-gray-500">
                                      {weekDays[week.days.indexOf(day)]}
                                    </p>
                                  </Link>
                                  <button
                                    onClick={() =>
                                      toggleDayImportance(
                                        day.date,
                                        day.isImportant,
                                      )
                                    }
                                    className="cursor-pointer hover:scale-110 transition"
                                  >
                                    <Star
                                      className={`w-5 h-5 ${
                                        day.isImportant
                                          ? "text-yellow-500 fill-yellow-500"
                                          : "text-gray-300 hover:text-yellow-400"
                                      }`}
                                    />
                                  </button>
                                </div>

                                <div className="space-y-2 flex-1">
                                  {day.tasks.slice(0, 3).map((task: any) => {
                                    const colorInfo = colors.find(
                                      (c) => c.name === task.color,
                                    );
                                    const displayName = getTaskDisplayName(
                                      task.color,
                                    );
                                    return (
                                      <div
                                        key={task.id}
                                        className={`text-md p-2 rounded-lg transition group ${colorInfo?.bg || "bg-gray-50"}`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2 flex-1">
                                            <button
                                              onClick={() =>
                                                toggleTaskCompletion(task.id)
                                              }
                                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                                                task.is_completed
                                                  ? "bg-green-500 border-green-500"
                                                  : "border-gray-300 hover:border-green-400"
                                              }`}
                                            >
                                              {task.is_completed && (
                                                <Check className="w-3 h-3 text-white" />
                                              )}
                                            </button>
                                            <div className="flex-1">
                                              <div className="flex flex-row justify-between w-full">
                                                <p
                                                  className={`font-medium text-sm ${task.is_completed && "line-through text-gray-400"}`}
                                                >
                                                  {task.title}
                                                </p>
                                                <div className="flex flex-row items-center">
                                                  {displayName !==
                                                    colorInfo?.label && (
                                                    <p className="text-xs text-gray-500">
                                                      {displayName}
                                                    </p>
                                                  )}
                                                  <button
                                                    onClick={() =>
                                                      openEditTaskModal(task)
                                                    }
                                                    className="opacity-0 group-hover:opacity-100 mx-[10px] transition text-blue-500 hover:text-blue-700"
                                                  >
                                                    <Edit className="w-4 h-4" />
                                                  </button>
                                                  <button
                                                    onClick={() =>
                                                      deleteTask(task.id)
                                                    }
                                                    className="opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-700"
                                                  >
                                                    <Trash2 className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              </div>
                                              {(task.start_time ||
                                                task.end_time) && (
                                                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                                  <Clock className="w-3 h-3" />
                                                  {task.start_time} -{" "}
                                                  {task.end_time}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {day.tasks.length === 0 && (
                                    <p className="text-xs text-gray-400 text-center py-3">
                                      Нет задач
                                    </p>
                                  )}

                                  {addingTaskForDay === day.date ? (
                                    <div className="mt-2 space-y-2">
                                      <input
                                        type="text"
                                        value={newTaskTitle}
                                        onChange={(e) =>
                                          setNewTaskTitle(e.target.value)
                                        }
                                        onKeyPress={(e) =>
                                          e.key === "Enter" &&
                                          openAddTaskModal(day.date)
                                        }
                                        placeholder="Название задачи..."
                                        className="w-full text-sm p-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-pink-300"
                                        autoFocus
                                      />
                                      <div className="flex gap-2">
                                        <div className="flex-1 flex gap-1">
                                          {colors.slice(0, 12).map((color) => (
                                            <button
                                              key={color.name}
                                              onClick={() =>
                                                setTempTaskColor(color.name)
                                              }
                                              className={`w-8 h-8 rounded-full transition ${color.base} ${
                                                tempTaskColor === color.name
                                                  ? "ring-2 ring-offset-2 ring-gray-400"
                                                  : ""
                                              }`}
                                              title={
                                                tagNames[color.name]
                                                  ? tagNames[color.name]
                                                  : color.label
                                              }
                                            />
                                          ))}
                                        </div>
                                        <button
                                          onClick={() =>
                                            openAddTaskModal(day.date)
                                          }
                                          className="p-1.5 bg-pink-500 text-white rounded hover:bg-pink-600"
                                        >
                                          <Check className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            setAddingTaskForDay(null);
                                            setNewTaskTitle("");
                                            setNewTaskColor("yellow");
                                          }}
                                          className="p-1.5 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => openAddTaskModal(day.date)}
                                      className="w-full mt-2 text-xs text-gray-400 hover:text-pink-600 transition flex items-center justify-center gap-1 py-1"
                                    >
                                      <Plus className="w-3 h-3" /> Добавить
                                      задачу
                                    </button>
                                  )}
                                </div>

                                {day.notes && (
                                  <div className="mt-3 pt-2 border-t border-gray-100">
                                    <p className="text-xs text-gray-400 line-clamp-2">
                                      {day.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
      {/* Модальное окно добавления задачи */}
      {/* Модальное окно добавления задачи */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Добавить задачу
              </h3>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={tempTaskTitle}
                onChange={(e) => setTempTaskTitle(e.target.value)}
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
                    value={tempTaskStart}
                    onChange={(e) => setTempTaskStart(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">
                    Конец
                  </label>
                  <input
                    type="time"
                    value={tempTaskEnd}
                    onChange={(e) => setTempTaskEnd(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Цвет</label>
                <div className="grid grid-cols-6 gap-2 md:flex md:flex-nowrap">
                  {colors.slice(0, 12).map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setTempTaskColor(color.name)}
                      className={`w-8 h-8 rounded-full transition ${color.base} ${
                        tempTaskColor === color.name
                          ? "ring-2 ring-offset-2 ring-gray-400"
                          : ""
                      }`}
                      title={
                        tagNames[color.name]
                          ? tagNames[color.name]
                          : color.label
                      }
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={addTaskFromModal}
                  className="flex-1 bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700"
                >
                  Добавить
                </button>
                <button
                  onClick={() => setShowAddTaskModal(false)}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования задачи */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Редактировать задачу
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={editTaskTitle}
                onChange={(e) => setEditTaskTitle(e.target.value)}
                placeholder="Название задачи"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">
                    Начало
                  </label>
                  <input
                    type="time"
                    value={editTaskStart}
                    onChange={(e) => setEditTaskStart(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">
                    Конец
                  </label>
                  <input
                    type="time"
                    value={editTaskEnd}
                    onChange={(e) => setEditTaskEnd(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Цвет</label>
                <div className="grid grid-cols-6 gap-2 md:flex md:flex-nowrap">
                  {colors.slice(0, 12).map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setTempTaskColor(color.name)}
                      className={`w-8 h-8 rounded-full transition ${color.base} ${
                        tempTaskColor === color.name
                          ? "ring-2 ring-offset-2 ring-gray-400"
                          : ""
                      }`}
                      title={
                        tagNames[color.name]
                          ? tagNames[color.name]
                          : color.label
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={updateTask}
                  className="flex-1 bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700"
                >
                  Сохранить
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
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

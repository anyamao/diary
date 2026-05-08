"use client";

import { useState, useEffect } from "react";
import {
  Download,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import api from "@/lib/axios";
import { showToast } from "@/components/Toast";
import { showConfirm } from "@/components/ConfirmDialog";

const phq9Questions = [
  "Мало интереса или удовольствия от занятий",
  "Подавленное, депрессивное или безнадежное настроение",
  "Проблемы с засыпанием, беспокойный сон или слишком долгий сон",
  "Чувство усталости или недостатка энергии",
  "Плохой аппетит или переедание",
  "Плохое мнение о себе — чувство, что вы неудачник или подвели свою семью",
  "Проблемы с концентрацией внимания, например, при чтении газет или просмотре телевизора",
  "Замедленные движения или речь, что заметно для других, или наоборот, беспокойство и суетливость",
  "Мысли о том, что лучше умереть, или о самоповреждении",
];

// ТАКИЕ ЖЕ кружочки как в тесте личности (7 вариантов, но используем 4)
const options = [
  {
    value: 0,
    label: "Совсем нет",
    color: "border-green-600 hover:bg-green-600",
    bgColor: "bg-green-600",
    size: "w-[45px] h-[45px]",
    iconSize: "w-6 h-6",
  },
  {
    value: 1,
    label: "Несколько дней",
    color: "border-green-600 hover:bg-green-600",
    bgColor: "bg-green-600",
    size: "w-[40px] h-[40px]",
    iconSize: "w-5 h-5",
  },
  {
    value: 2,
    label: "Более чем в половине дней",
    color: "border-gray-400 hover:bg-gray-400",
    bgColor: "bg-gray-400",
    size: "w-[30px] h-[30px]",
    iconSize: "w-3 h-3",
  },
  {
    value: 3,
    label: "Почти каждый день",
    color: "border-purple-600 hover:bg-purple-600",
    bgColor: "bg-purple-600",
    size: "w-[45px] h-[45px]",
    iconSize: "w-6 h-6",
  },
];

const getSeverityColor = (total: number) => {
  if (total <= 4) return "bg-green-100 border-green-300 text-green-800";
  if (total <= 9) return "bg-lime-100 border-lime-300 text-lime-800";
  if (total <= 14) return "bg-yellow-100 border-yellow-300 text-yellow-800";
  if (total <= 19) return "bg-orange-100 border-orange-300 text-orange-800";
  return "bg-red-100 border-red-300 text-red-800";
};

export default function DepressionTest() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<string | null>(null);
  const [totalScore, setTotalScore] = useState<number | null>(null);
  const [severity, setSeverity] = useState<string | null>(null);
  const [hasExistingResult, setHasExistingResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingResult, setSavingResult] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const questionsPerPage = 5;
  const totalPages = Math.ceil(phq9Questions.length / questionsPerPage);

  useEffect(() => {
    loadExistingResult();
  }, []);

  const loadExistingResult = async () => {
    try {
      const response = await api.get("/personality/depression-test/result");
      if (response.data.has_result) {
        setResult(response.data.result);
        setTotalScore(response.data.total_score);
        setSeverity(response.data.severity);
        setHasExistingResult(true);
        setTestStarted(false);
      }
    } catch (error) {
      console.error("Failed to load existing result:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (index: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  const calculateAndSaveResult = async () => {
    const total = Object.values(answers).reduce((sum, val) => sum + val, 0);

    let severityLevel = "";
    let recommendation = "";
    let description = "";

    if (total <= 4) {
      severityLevel = "Минимальная депрессия";
      description = "У вас нет клинически значимых симптомов депрессии.";
      recommendation =
        "Поддерживайте здоровый образ жизни и продолжайте заботиться о своем психическом здоровье.";
    } else if (total <= 9) {
      severityLevel = "Легкая депрессия";
      description = "У вас есть легкие симптомы депрессии.";
      recommendation =
        "Рекомендуется обратить внимание на факторы стресса, обсудить свои чувства с близкими или психологом.";
    } else if (total <= 14) {
      severityLevel = "Умеренная депрессия";
      description = "У вас есть умеренные симптомы депрессии.";
      recommendation =
        "Рекомендуется обратиться к психологу или психотерапевту для профессиональной поддержки.";
    } else if (total <= 19) {
      severityLevel = "Средняя депрессия";
      description = "У вас есть значительные симптомы депрессии.";
      recommendation =
        "Настоятельно рекомендуется обратиться к психотерапевту для получения помощи.";
    } else {
      severityLevel = "Тяжелая депрессия";
      description = "У вас есть тяжелые симптомы депрессии.";
      recommendation =
        "НЕМЕДЛЕННО обратитесь к психиатру или психотерапевту. Вы не одни, помощь доступна.";
    }

    const resultText = `
📊 РЕЗУЛЬТАТЫ ТЕСТА PHQ-9 (ШКАЛА ДЕПРЕССИИ)

Сумма баллов: ${total} из 27
Степень депрессии: ${severityLevel}

${description}

Рекомендация:
${recommendation}

ℹ️ PHQ-9 является клинически валидированным инструментом скрининга депрессии.
Данный тест не заменяет профессиональную диагностику.
Если у вас есть мысли о самоповреждении, немедленно обратитесь к специалисту.

Телефон доверия: 8-800-2000-122
    `;

    setSavingResult(true);
    try {
      await api.post("/personality/depression-test/result", {
        total_score: total,
        severity: severityLevel,
        result: resultText,
      });
      setResult(resultText);
      setTotalScore(total);
      setSeverity(severityLevel);
      setHasExistingResult(true);
      setAnswers({});
      setTestStarted(false);
      showToast("Результат сохранён", "success");
    } catch (error) {
      console.error("Failed to save result:", error);
      showToast("Ошибка сохранения результата", "error");
    } finally {
      setSavingResult(false);
    }
  };

  const resetTest = async () => {
    const confirmed = await showConfirm(
      "Пройти тест заново?",
      "Вы уверены, что хотите пройти тест заново? Текущий результат будет удалён.",
      "warning",
    );
    if (confirmed) {
      setAnswers({});
      setResult(null);
      setTotalScore(null);
      setSeverity(null);
      setHasExistingResult(false);
      setTestStarted(true);
      setCurrentPage(0);
    }
  };

  const saveToFile = () => {
    const blob = new Blob([result || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `depression_test_${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Результат сохранён в файл", "success");
  };

  if (loading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  // Показываем результат, если он есть и тест не был начат заново
  if (hasExistingResult && result && !testStarted) {
    const getPercentage = () => {
      if (totalScore === null) return 0;
      return (totalScore / 27) * 100;
    };

    const percentage = getPercentage();

    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Ваш результат: PHQ-9
        </h2>

        <div
          className={`rounded-xl p-6 mb-6 border ${getSeverityColor(totalScore || 0)}`}
        >
          <div className="text-center mb-6">
            <div className="text-6xl font-bold mb-2">
              {totalScore}
              <span className="text-2xl text-gray-500">/27</span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden max-w-md mx-auto">
              <div
                className="h-full bg-pink-400 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="text-xl font-semibold mt-4">{severity}</div>
          </div>
          <p className="leading-relaxed whitespace-pre-wrap text-sm">
            {result?.split("\n").slice(7, -5).join("\n")}
          </p>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4 mb-6 text-sm text-yellow-800 border border-yellow-200">
          ⚠️ Если у вас есть мысли о самоповреждении, немедленно обратитесь к
          специалисту.
          <br />
          Телефон доверия: <strong>8-800-2000-122</strong>
        </div>

        <div className="flex gap-3">
          <button
            onClick={resetTest}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <RotateCcw className="w-4 h-4" /> Пройти заново
          </button>
          <button
            onClick={saveToFile}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" /> Сохранить результат
          </button>
        </div>
      </div>
    );
  }

  const currentQuestions = phq9Questions.slice(
    currentPage * questionsPerPage,
    (currentPage + 1) * questionsPerPage,
  );

  const startIdx = currentPage * questionsPerPage;
  const answeredCount = Object.keys(answers).length;
  const isPageComplete = currentQuestions.every(
    (_, idx) => answers[startIdx + idx] !== undefined,
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Тест на психологическое состояние (PHQ-9)
      </h2>
      <p className="text-gray-600 mb-6">
        За последние 2 недели, как часто вас беспокоили следующие проблемы?
        <br />
        <span className="text-sm text-purple-600">
          Отвечено вопросов: {answeredCount} из {phq9Questions.length}
        </span>
      </p>

      <div className="space-y-8 mb-8">
        {currentQuestions.map((q, idx) => {
          const globalIdx = startIdx + idx;
          const selectedValue = answers[globalIdx];
          return (
            <div
              key={globalIdx}
              className="border-b flex flex-col  border-gray-200 pb-4"
            >
              <p className="font-medium text-gray-800 mb-4">
                {globalIdx + 1}. {q}
              </p>
              <div className="flex flex-col  px-[100px] ">
                <div className="flex justify-between w-full max-w-[60%] items-center max-w-md mx-auto">
                  {options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswer(globalIdx, opt.value)}
                      className={`${opt.size} flex items-center justify-center border-[2px] ${opt.color} rounded-full transition-all duration-200 hover:scale-110 ${
                        selectedValue === opt.value
                          ? opt.bgColor
                          : "bg-transparent"
                      }`}
                    >
                      {selectedValue === opt.value && (
                        <Check className={`text-white ${opt.iconSize}`} />
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex w-full h-[50px] flex-row items-center justify-between mt-2">
                  <p className="text-green-800">Совсем нет</p>
                  <p className="text-purple-800">Почти каждый день</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-4">
        <button
          onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
          disabled={currentPage === 0}
          className="flex items-center gap-1 px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" /> Назад
        </button>
        <span className="text-sm text-gray-500">
          Страница {currentPage + 1} из {totalPages}
        </span>
        {currentPage === totalPages - 1 ? (
          <button
            onClick={calculateAndSaveResult}
            disabled={answeredCount < phq9Questions.length || savingResult}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {savingResult ? "Сохранение..." : "Получить результат"}
          </button>
        ) : (
          <button
            onClick={() =>
              setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
            }
            disabled={!isPageComplete}
            className="flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50"
          >
            Далее <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg text-sm text-yellow-800 border border-yellow-200">
        ⚠️ Если у вас есть мысли о самоповреждении, немедленно обратитесь к
        специалисту.
        <br />
        Телефон доверия: <strong>8-800-2000-122</strong>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Download, RotateCcw } from "lucide-react";
import api from "@/lib/axios";

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

const options = [
  { value: 0, label: "Совсем нет" },
  { value: 1, label: "Несколько дней" },
  { value: 2, label: "Более чем в половине дней" },
  { value: 3, label: "Почти каждый день" },
];

export default function DepressionTest() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<string | null>(null);
  const [totalScore, setTotalScore] = useState<number | null>(null);
  const [severity, setSeverity] = useState<string | null>(null);
  const [hasExistingResult, setHasExistingResult] = useState(false);
  const [loading, setLoading] = useState(true);

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

    if (total <= 4) {
      severityLevel = "Минимальная депрессия";
      recommendation =
        "У вас нет клинически значимых симптомов депрессии. Поддерживайте здоровый образ жизни и продолжайте заботиться о своем психическом здоровье.";
    } else if (total <= 9) {
      severityLevel = "Легкая депрессия";
      recommendation =
        "У вас есть легкие симптомы депрессии. Рекомендуется обратить внимание на факторы стресса, обсудить свои чувства с близкими или психологом.";
    } else if (total <= 14) {
      severityLevel = "Умеренная депрессия";
      recommendation =
        "У вас есть умеренные симптомы депрессии. Рекомендуется обратиться к психологу или психотерапевту для профессиональной поддержки.";
    } else if (total <= 19) {
      severityLevel = "Средняя депрессия";
      recommendation =
        "У вас есть значительные симптомы депрессии. Настоятельно рекомендуется обратиться к психотерапевту для получения помощи.";
    } else {
      severityLevel = "Тяжелая депрессия";
      recommendation =
        "У вас есть тяжелые симптомы депрессии. НЕМЕДЛЕННО обратитесь к психиатру или психотерапевту. Вы не одни, помощь доступна.";
    }

    const resultText = `
      📊 РЕЗУЛЬТАТЫ ТЕСТА PHQ-9 (ШКАЛА ДЕПРЕССИИ)
      
      Сумма баллов: ${total} из 27
      Степень депрессии: ${severityLevel}
      
      Рекомендация:
      ${recommendation}
      
      ℹ️ PHQ-9 является клинически валидированным инструментом скрининга депрессии.
      Данный тест не заменяет профессиональную диагностику.
      Если у вас есть мысли о самоповреждении, немедленно обратитесь к специалисту.
      
      Телефон доверия: 8-800-2000-122
    `;

    // Сохраняем результат
    try {
      await api.post("/personality/depression-test/result", {
        total_score: total,
        severity: severityLevel,
        result: resultText,
      });
      window.location.reload();
    } catch (error) {
      console.error("Failed to save result:", error);
    }

    setResult(resultText);
    setTotalScore(total);
    setSeverity(severityLevel);
    setHasExistingResult(true);
  };

  const resetTest = () => {
    setAnswers({});
    setResult(null);
    setTotalScore(null);
    setSeverity(null);
    setHasExistingResult(false);
  };

  const saveToFile = () => {
    const blob = new Blob([result || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `depression_test_${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  if (hasExistingResult && result && !Object.keys(answers).length) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Ваш результат</h2>
        <div className="bg-blue-50 rounded-xl p-6 whitespace-pre-wrap font-mono text-sm">
          {result}
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={saveToFile}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" /> Сохранить результат
          </button>
          <button
            onClick={resetTest}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RotateCcw className="w-4 h-4" /> Пройти заново
          </button>
        </div>
      </div>
    );
  }

  if (result && !hasExistingResult) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Ваш результат</h2>
        <div className="bg-blue-50 rounded-xl p-6 whitespace-pre-wrap font-mono text-sm">
          {result}
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={saveToFile}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" /> Сохранить результат
          </button>
          <button
            onClick={resetTest}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RotateCcw className="w-4 h-4" /> Пройти заново
          </button>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;

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

      <div className="space-y-6 mb-8">
        {phq9Questions.map((q, idx) => (
          <div key={idx} className="border-b border-gray-200 pb-4">
            <p className="font-medium text-gray-800 mb-3">
              {idx + 1}. {q}
            </p>
            <div className="flex flex-wrap gap-2">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(idx, opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    answers[idx] === opt.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={calculateAndSaveResult}
          disabled={answeredCount < phq9Questions.length}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Получить результат
        </button>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg text-sm text-yellow-800">
        ⚠️ Если у вас есть мысли о самоповреждении, немедленно обратитесь к
        специалисту. Телефон доверия: 8-800-2000-122
      </div>
    </div>
  );
}

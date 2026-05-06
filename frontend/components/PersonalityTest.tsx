"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Download, RotateCcw } from "lucide-react";
import api from "@/lib/axios";

const questions = [
  { text: "Я люблю знакомиться с новыми людьми", trait: "E", reverse: false },
  {
    text: "Я часто беспокоюсь о том, что может случиться",
    trait: "N",
    reverse: false,
  },
  { text: "Я всегда выполняю свои обещания", trait: "C", reverse: false },
  { text: "Я предпочитаю простую работу сложной", trait: "O", reverse: true },
  { text: "Я ценю искусство и красоту", trait: "O", reverse: false },
  { text: "Я чувствителен к критике", trait: "N", reverse: false },
  {
    text: "Я предпочитаю работать в команде, а не один",
    trait: "E",
    reverse: false,
  },
  { text: "Я легко принимаю решения", trait: "C", reverse: false },
  { text: "Я люблю пробовать новую еду", trait: "O", reverse: false },
  { text: "Я часто чувствую себя подавленным", trait: "N", reverse: false },
  { text: "Я люблю быть в центре внимания", trait: "E", reverse: false },
  { text: "Я всегда готов помочь другим", trait: "A", reverse: false },
  { text: "Я часто откладываю дела на потом", trait: "C", reverse: true },
  { text: "Я доверяю людям", trait: "A", reverse: false },
  { text: "Я люблю читать книги", trait: "O", reverse: false },
  { text: "Я быстро устаю от общения", trait: "E", reverse: true },
  { text: "Я часто злюсь по пустякам", trait: "N", reverse: false },
  { text: "Я аккуратен и организован", trait: "C", reverse: false },
  { text: "Я люблю путешествовать", trait: "O", reverse: false },
  { text: "Я считаю себя спокойным человеком", trait: "N", reverse: true },
  { text: "Я легко завожу друзей", trait: "E", reverse: false },
  { text: "Я часто спорю с другими", trait: "A", reverse: true },
  { text: "Я делаю свою работу хорошо", trait: "C", reverse: false },
  { text: "Я люблю узнавать новое", trait: "O", reverse: false },
  { text: "Я часто чувствую себя одиноким", trait: "N", reverse: false },
  { text: "Я энергичный человек", trait: "E", reverse: false },
  { text: "Я стремлюсь к справедливости", trait: "A", reverse: false },
  { text: "Я следую плану", trait: "C", reverse: false },
  { text: "Я люблю разгадывать головоломки", trait: "O", reverse: false },
  { text: "Я часто испытываю стресс", trait: "N", reverse: false },
  { text: "Я инициативен в компании", trait: "E", reverse: false },
  { text: "Я прощаю обиды", trait: "A", reverse: false },
  { text: "Я всегда прихожу вовремя", trait: "C", reverse: false },
  { text: "Я интересуюсь наукой", trait: "O", reverse: false },
  { text: "Я часто меняю настроение", trait: "N", reverse: false },
  {
    text: "Я чувствую себя уверенно в новом месте",
    trait: "E",
    reverse: false,
  },
  { text: "Я поддерживаю людей в трудную минуту", trait: "A", reverse: false },
  { text: "Я выполняю свою работу до конца", trait: "C", reverse: false },
  { text: "Я люблю творить", trait: "O", reverse: false },
  { text: "Я тревожусь по поводу здоровья", trait: "N", reverse: false },
];

const options = [
  { value: 1, label: "Совсем не согласен" },
  { value: 2, label: "Не согласен" },
  { value: 3, label: "Нейтрально" },
  { value: 4, label: "Согласен" },
  { value: 5, label: "Полностью согласен" },
];

export default function PersonalityTest() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [scores, setScores] = useState<any>(null);
  const [hasExistingResult, setHasExistingResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const questionsPerPage = 10;
  const totalPages = Math.ceil(questions.length / questionsPerPage);

  useEffect(() => {
    loadExistingResult();
  }, []);

  const loadExistingResult = async () => {
    try {
      const response = await api.get("/personality/personality-test/result");
      if (response.data.has_result) {
        setResult(response.data.result);
        setScores(response.data.scores);
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
    const scores = {
      E: 0,
      N: 0,
      C: 0,
      A: 0,
      O: 0,
      count: { E: 0, N: 0, C: 0, A: 0, O: 0 },
    };

    questions.forEach((q, idx) => {
      const answer = answers[idx];
      if (answer) {
        let score = answer;
        if (q.reverse) score = 6 - score;
        scores[q.trait] += score;
        scores.count[q.trait]++;
      }
    });

    const getPercentile = (score: number, trait: string) => {
      const maxScore = scores.count[trait] * 5;
      return (score / maxScore) * 100;
    };

    const ePercent = getPercentile(scores.E, "E");
    const nPercent = getPercentile(scores.N, "N");
    const cPercent = getPercentile(scores.C, "C");
    const aPercent = getPercentile(scores.A, "A");
    const oPercent = getPercentile(scores.O, "O");

    const traits = {
      extraversion:
        ePercent > 60 ? "Высокая" : ePercent < 40 ? "Низкая" : "Средняя",
      neuroticism:
        nPercent > 60 ? "Высокая" : nPercent < 40 ? "Низкая" : "Средняя",
      conscientiousness:
        cPercent > 60 ? "Высокая" : cPercent < 40 ? "Низкая" : "Средняя",
      agreeableness:
        aPercent > 60 ? "Высокая" : aPercent < 40 ? "Низкая" : "Средняя",
      openness:
        oPercent > 60 ? "Высокая" : oPercent < 40 ? "Низкая" : "Средняя",
    };

    const descriptions = {
      extraversion:
        traits.extraversion === "Высокая"
          ? "Вы энергичны, общительны и любите быть в компании людей."
          : traits.extraversion === "Низкая"
            ? "Вы интроверт, предпочитаете спокойное общение и время наедине с собой."
            : "Вы балансируете между общительностью и потребностью в личном пространстве.",
      neuroticism:
        traits.neuroticism === "Высокая"
          ? "Вы эмоционально чувствительны, что делает вас эмпатичным, но может вызывать стресс."
          : traits.neuroticism === "Низкая"
            ? "Вы эмоционально стабильны, спокойно переживаете трудности и быстро восстанавливаетесь."
            : "У вас хороший эмоциональный баланс, вы чувствуете перепады настроения, но справляетесь с ними.",
      conscientiousness:
        traits.conscientiousness === "Высокая"
          ? "Вы организованны, ответственны и всегда доводите дела до конца."
          : traits.conscientiousness === "Низкая"
            ? "Вы гибки и спонтанны, но иногда вам не хватает самодисциплины."
            : "Вы сочетаете организованность с гибкостью, находите баланс между планами и спонтанностью.",
      agreeableness:
        traits.agreeableness === "Высокая"
          ? "Вы дружелюбны, доверчивы и стремитесь к гармонии в отношениях."
          : traits.agreeableness === "Низкая"
            ? "Вы независимы и критичны, но можете быть более требовательны к другим."
            : "Вы умеете находить баланс между своими интересами и потребностями других.",
      openness:
        traits.openness === "Высокая"
          ? "Вы любопытны, креативны и открыты к новому опыту и идеям."
          : traits.openness === "Низкая"
            ? "Вы практичны и консервативны, предпочитаете проверенные пути."
            : "Вы гибки в мышлении, открыты к новому, но цените и проверенные подходы.",
    };

    const resultText = `
      📊 РЕЗУЛЬТАТЫ ТЕСТА "БОЛЬШАЯ ПЯТЕРКА"
      
      🗣️ Экстраверсия: ${traits.extraversion}
      ${descriptions.extraversion}
      
      😟 Нейротизм: ${traits.neuroticism}
      ${descriptions.neuroticism}
      
      📋 Добросовестность: ${traits.conscientiousness}
      ${descriptions.conscientiousness}
      
      🤝 Доброжелательность: ${traits.agreeableness}
      ${descriptions.agreeableness}
      
      🎨 Открытость опыту: ${traits.openness}
      ${descriptions.openness}
      
      💡 Этот тест основан на модели "Большой пятерки" (Big Five) — одной из наиболее научно обоснованных моделей личности в психологии.
    `;

    // Сохраняем результат
    try {
      await api.post("/personality/personality-test/result", {
        result: resultText,
        scores: traits,
      });
      window.location.reload();
    } catch (error) {
      console.error("Failed to save result:", error);
    }

    setResult(resultText);
    setScores(traits);
    setHasExistingResult(true);
  };

  const resetTest = () => {
    setAnswers({});
    setCurrentPage(0);
    setResult(null);
    setScores(null);
    setHasExistingResult(false);
  };

  const saveToFile = () => {
    const blob = new Blob([result || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `personality_test_${new Date().toISOString().split("T")[0]}.txt`;
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
        <div className="bg-purple-50 rounded-xl p-6 whitespace-pre-wrap font-mono text-sm">
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
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
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
        <div className="bg-purple-50 rounded-xl p-6 whitespace-pre-wrap font-mono text-sm">
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
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <RotateCcw className="w-4 h-4" /> Пройти заново
          </button>
        </div>
      </div>
    );
  }

  const currentQuestions = questions.slice(
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
        Тест на тип личности
      </h2>
      <p className="text-gray-600 mb-6">
        Ответьте на 40 вопросов, чтобы узнать свой психологический профиль.
        Отвечайте честно, выбирая степень согласия с каждым утверждением.
        <br />
        <span className="text-sm text-purple-600">
          Отвечено вопросов: {answeredCount} из {questions.length}
        </span>
      </p>

      <div className="space-y-6 mb-8">
        {currentQuestions.map((q, idx) => {
          const globalIdx = startIdx + idx;
          return (
            <div key={globalIdx} className="border-b border-gray-200 pb-4">
              <p className="font-medium text-gray-800 mb-3">
                {globalIdx + 1}. {q.text}
              </p>
              <div className="flex flex-wrap gap-2">
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleAnswer(globalIdx, opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${
                      answers[globalIdx] === opt.value
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
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
            disabled={answeredCount < questions.length}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            Получить результат
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
    </div>
  );
}

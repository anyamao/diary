"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
  Check,
} from "lucide-react";
import api from "@/lib/axios";
import { showToast } from "@/components/Toast";
import { showConfirm } from "@/components/ConfirmDialog";

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

// Типы для результатов
interface BigFiveResult {
  traits: {
    extraversion: number;
    neuroticism: number;
    conscientiousness: number;
    agreeableness: number;
    openness: number;
  };
  descriptions: {
    extraversion: string;
    neuroticism: string;
    conscientiousness: string;
    agreeableness: string;
    openness: string;
  };
}

interface SimpleResult {
  percentage: number;
  level: string;
  description: string;
  totalScore: number;
  maxScore: number;
}

type TestResult = BigFiveResult | SimpleResult | null;

const additionalTests = [
  {
    id: "emotional_intelligence",
    name: "Тест на эмоциональный интеллект",
    questions: [
      { text: "Я легко распознаю свои эмоции", reverse: false },
      { text: "Мне трудно контролировать гнев", reverse: true },
      { text: "Я понимаю чувства других людей", reverse: false },
      {
        text: "Я умею успокаивать себя в стрессовых ситуациях",
        reverse: false,
      },
      { text: "Мне сложно выражать свои чувства словами", reverse: true },
      { text: "Я замечаю, когда кто-то нуждается в поддержке", reverse: false },
      { text: "Я часто действую импульсивно", reverse: true },
      { text: "Я могу вдохновлять других", reverse: false },
      { text: "Мне трудно принимать критику", reverse: true },
      { text: "Я умею находить компромиссы", reverse: false },
    ],
  },
  {
    id: "motivation",
    name: "Тест на мотивацию",
    questions: [
      { text: "Я ставлю перед собой чёткие цели", reverse: false },
      { text: "Мне трудно начинать новые проекты", reverse: true },
      { text: "Я получаю удовольствие от процесса обучения", reverse: false },
      { text: "Я быстро сдаюсь при первых трудностях", reverse: true },
      { text: "Меня вдохновляют успехи других", reverse: false },
      { text: "Я часто откладываю важные дела", reverse: true },
      { text: "Я верю в свои силы", reverse: false },
      { text: "Мне нужны внешние поощрения для работы", reverse: true },
      { text: "Я люблю преодолевать препятствия", reverse: false },
      { text: "Я знаю своё предназначение", reverse: false },
    ],
  },
];

// 7 вариантов ответов
const options = [
  {
    value: 1,
    color: "border-green-600 hover:bg-green-600",
    bgColor: "bg-green-600",
    size: "w-[45px] h-[45px]",
    iconSize: "w-6 h-6",
  },
  {
    value: 2,
    color: "border-green-600 hover:bg-green-600",
    bgColor: "bg-green-600",
    size: "w-[40px] h-[40px]",
    iconSize: "w-5 h-5",
  },
  {
    value: 3,
    color: "border-green-600 hover:bg-green-600",
    bgColor: "bg-green-600",
    size: "w-[35px] h-[35px]",
    iconSize: "w-4 h-4",
  },
  {
    value: 4,
    color: "border-gray-400 hover:bg-gray-400",
    bgColor: "bg-gray-400",
    size: "w-[30px] h-[30px]",
    iconSize: "w-3 h-3",
  },
  {
    value: 5,
    color: "border-purple-600 hover:bg-purple-600",
    bgColor: "bg-purple-600",
    size: "w-[35px] h-[35px]",
    iconSize: "w-4 h-4",
  },
  {
    value: 6,
    color: "border-purple-600 hover:bg-purple-600",
    bgColor: "bg-purple-600",
    size: "w-[40px] h-[40px]",
    iconSize: "w-5 h-5",
  },
  {
    value: 7,
    color: "border-purple-600 hover:bg-purple-600",
    bgColor: "bg-purple-600",
    size: "w-[45px] h-[45px]",
    iconSize: "w-6 h-6",
  },
];

const getBarColor = (percentage: number) => {
  return "bg-pink-400";
};

export default function PersonalityTest() {
  const [activeTest, setActiveTest] = useState<
    "big5" | "emotional_intelligence" | "motivation"
  >("big5");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [result, setResult] = useState<TestResult>(null);
  const [hasExistingResult, setHasExistingResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingResult, setSavingResult] = useState(false);
  const [testStarted, setTestStarted] = useState(false);

  const currentQuestions =
    activeTest === "big5"
      ? questions
      : additionalTests.find((t) => t.id === activeTest)?.questions || [];
  const questionsPerPage = 10;
  const totalPages = Math.ceil(currentQuestions.length / questionsPerPage);

  const loadExistingResult = async () => {
    setLoading(true);
    try {
      const timestamp = Date.now();
      const url = `/personality/personality-test/result`;
      const params = { test: activeTest, _t: timestamp };

      const response = await api.get(url, { params });

      if (response.data.has_result && response.data.result) {
        let resultData;
        if (typeof response.data.result === "string") {
          try {
            resultData = JSON.parse(response.data.result);
          } catch (e) {
            console.error("Failed to parse result:", e);
            resultData = response.data.result;
          }
        } else {
          resultData = response.data.result;
        }

        if (resultData && typeof resultData === "object") {
          setResult(resultData);
          setHasExistingResult(true);
          setTestStarted(false);
        } else {
          setHasExistingResult(false);
          setResult(null);
        }
      } else {
        setHasExistingResult(false);
        setResult(null);
      }
    } catch (error) {
      console.error("Failed to load existing result:", error);
      setHasExistingResult(false);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Загружаем результат при монтировании и при смене теста
  useEffect(() => {
    loadExistingResult();
  }, [activeTest]);

  const handleAnswer = (index: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  const calculateBigFiveResult = async () => {
    const scoresData = {
      E: 0,
      N: 0,
      C: 0,
      A: 0,
      O: 0,
      count: { E: 0, N: 0, C: 0, A: 0, O: 0 },
    };

    currentQuestions.forEach((q, idx) => {
      const answer = answers[idx];
      if (answer && "trait" in q) {
        let score = answer;
        if (q.reverse) score = 8 - score;
        const trait = q.trait as "E" | "N" | "C" | "A" | "O";
        scoresData[trait] = (scoresData[trait] || 0) + score;
        scoresData.count[trait] = (scoresData.count[trait] || 0) + 1;
      }
    });

    const getPercentile = (score: number, trait: string) => {
      const maxScore =
        scoresData.count[trait as "E" | "N" | "C" | "A" | "O"] * 7;
      return (score / maxScore) * 100;
    };

    const traits = {
      extraversion: getPercentile(scoresData.E, "E"),
      neuroticism: getPercentile(scoresData.N, "N"),
      conscientiousness: getPercentile(scoresData.C, "C"),
      agreeableness: getPercentile(scoresData.A, "A"),
      openness: getPercentile(scoresData.O, "O"),
    };
    const descriptions = {
      extraversion:
        traits.extraversion > 60
          ? "Вы энергичны, общительны и любите быть в компании людей."
          : traits.extraversion < 40
            ? "Вы интроверт, предпочитаете спокойное общение и время наедине с собой."
            : "Вы балансируете между общительностью и потребностью в личном пространстве.",
      neuroticism:
        traits.neuroticism > 60
          ? "Вы эмоционально чувствительны, что делает вас эмпатичным, но может вызывать стресс."
          : traits.neuroticism < 40
            ? "Вы эмоционально стабильны, спокойно переживаете трудности и быстро восстанавливаетесь."
            : "У вас хороший эмоциональный баланс, вы чувствуете перепады настроения, но справляетесь с ними.",
      conscientiousness:
        traits.conscientiousness > 60
          ? "Вы организованны, ответственны и всегда доводите дела до конца."
          : traits.conscientiousness < 40
            ? "Вы гибки и спонтанны, но иногда вам не хватает самодисциплины."
            : "Вы сочетаете организованность с гибкостью, находите баланс между планами и спонтанностью.",
      agreeableness:
        traits.agreeableness > 60
          ? "Вы дружелюбны, доверчивы и стремитесь к гармонии в отношениях."
          : traits.agreeableness < 40
            ? "Вы независимы и критичны, но можете быть более требовательны к другим."
            : "Вы умеете находить баланс между своими интересами и потребностями других.",
      openness:
        traits.openness > 60
          ? "Вы любопытны, креативны и открыты к новому опыту и идеям."
          : traits.openness < 40
            ? "Вы практичны и консервативны, предпочитаете проверенные пути."
            : "Вы гибки в мышлении, открыты к новому, но цените и проверенные подходы.",
    };

    const resultData: BigFiveResult = { traits, descriptions };
    try {
      await api.post("/personality/personality-test/result", {
        result: JSON.stringify(resultData),
        scores: JSON.stringify(traits),
        test_type: activeTest,
      });
      setResult(resultData);
      setHasExistingResult(true);
      setAnswers({});
      showToast("Результат сохранён", "success");
    } catch (error) {
      console.error("Failed to save result:", error);
      showToast("Ошибка сохранения результата", "error");
    }
  };

  const calculateSimpleResult = async () => {
    let totalScore = 0;
    currentQuestions.forEach((q, idx) => {
      const answer = answers[idx];
      if (answer) {
        let score = answer;
        if (q.reverse) score = 8 - score;
        totalScore += score;
      }
    });

    const maxScore = currentQuestions.length * 7;
    const percentage = (totalScore / maxScore) * 100;
    let level = "";
    let description = "";

    if (percentage >= 80) {
      level = "Высокий";
      description =
        activeTest === "emotional_intelligence"
          ? "У вас отличный эмоциональный интеллект! Вы хорошо понимаете свои и чужие эмоции, умеете управлять ими и эффективно общаться с окружающими."
          : "У вас отличная самомотивация! Вы знаете свои цели и уверенно идёте к ним.";
    } else if (percentage >= 60) {
      level = "Выше среднего";
      description =
        activeTest === "emotional_intelligence"
          ? "У вас хороший эмоциональный интеллект. Вы в целом понимаете эмоции, но есть куда расти."
          : "У вас хороший уровень мотивации, но иногда могут возникать сомнения.";
    } else if (percentage >= 40) {
      level = "Средний";
      description =
        activeTest === "emotional_intelligence"
          ? "У вас средний уровень эмоционального интеллекта. Работа над распознаванием и управлением эмоциями поможет вам."
          : "Ваша мотивация нестабильна. Попробуйте найти то, что действительно вас вдохновляет.";
    } else {
      level = "Низкий";
      description =
        activeTest === "emotional_intelligence"
          ? "Возможно, вам стоит больше внимания уделять эмоциональной сфере."
          : "Вам трудно себя мотивировать. Начните с маленьких побед.";
    }

    const resultData: SimpleResult = {
      percentage,
      level,
      description,
      totalScore,
      maxScore,
    };
    try {
      await api.post("/personality/personality-test/result", {
        result: JSON.stringify(resultData),
        scores: JSON.stringify({ level, percentage }),
        test_type: activeTest,
      });
      setResult(resultData);
      setHasExistingResult(true);
      setAnswers({});
      setTestStarted(false);
      showToast("Результат сохранён", "success");
    } catch (error) {
      console.error("Failed to save result:", error);
      showToast("Ошибка сохранения результата", "error");
    }
  };

  const calculateAndSaveResult = async () => {
    setSavingResult(true);
    try {
      if (activeTest === "big5") {
        await calculateBigFiveResult();
      } else {
        await calculateSimpleResult();
      }
    } catch (error) {
      console.error("Error calculating result:", error);
      showToast("Ошибка при расчете результата", "error");
    } finally {
      setSavingResult(false);
    }
  };

  const switchToTest = async (
    test: "big5" | "emotional_intelligence" | "motivation",
  ) => {
    if (test === activeTest) return;

    // Если есть несохраненные ответы ИЛИ мы не в режиме просмотра результата
    if (Object.keys(answers).length > 0 && !hasExistingResult) {
      const confirmed = await showConfirm(
        "Сменить тест?",
        "Вы уверены, что хотите сменить тест? Весь прогресс будет потерян.",
        "warning",
      );
      if (!confirmed) {
        return;
      }
    }

    setActiveTest(test);
    setAnswers({});
    setCurrentPage(0);
    setTestStarted(false);
    setResult(null);
    setHasExistingResult(false);
  };

  const startNewTest = () => {
    setAnswers({});
    setCurrentPage(0);
    setResult(null);
    setHasExistingResult(false);
    setTestStarted(true);
  };

  const saveToFile = () => {
    const textResult = JSON.stringify(result, null, 2);
    const blob = new Blob([textResult], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTest}_result_${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Результат сохранён в файл", "success");
  };

  const isBigFiveResult = (res: TestResult): res is BigFiveResult => {
    return res !== null && typeof res === "object" && "traits" in res;
  };

  const isSimpleResult = (res: TestResult): res is SimpleResult => {
    return res !== null && typeof res === "object" && "percentage" in res;
  };

  if (loading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  // Показываем результат, если он есть и тест не был начат заново
  if (hasExistingResult && result && !testStarted) {
    if (isBigFiveResult(result)) {
      return (
        <div>
          <div className="flex gap-3 mb-6">
            {["big5", "emotional_intelligence", "motivation"].map((test) => (
              <button
                key={test}
                onClick={() => switchToTest(test as any)}
                className={`px-4 py-2 text-xs rounded-lg transition ${activeTest === test ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                {test === "big5"
                  ? "Большая пятёрка"
                  : test === "emotional_intelligence"
                    ? "Эмоциональный интеллект"
                    : "Мотивация"}
              </button>
            ))}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Ваш результат: Большая пятёрка
          </h2>
          <div className="space-y-6 mb-8">
            {Object.entries(result.traits).map(([trait, value]) => {
              const percent = value as number;
              const traitNames: Record<string, string> = {
                extraversion: "Экстраверсия",
                neuroticism: "Нейротизм",
                conscientiousness: "Добросовестность",
                agreeableness: "Доброжелательность",
                openness: "Открытость опыту",
              };
              return (
                <div key={trait}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-gray-700">
                      {traitNames[trait]}
                    </span>
                    <span className="text-sm text-gray-500">
                      {Math.round(percent)}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getBarColor(percent)} rounded-full`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {
                      result.descriptions[
                        trait as keyof typeof result.descriptions
                      ]
                    }
                  </p>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3">
            <button
              onClick={startNewTest}
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

    if (isSimpleResult(result)) {
      return (
        <div>
          <div className="flex gap-3 mb-6">
            {["big5", "emotional_intelligence", "motivation"].map((test) => (
              <button
                key={test}
                onClick={() => switchToTest(test as any)}
                className={`px-4 py-2 rounded-lg transition ${activeTest === test ? "bg-purple-500 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                {test === "big5"
                  ? "Большая пятёрка"
                  : test === "emotional_intelligence"
                    ? "Эмоциональный интеллект"
                    : "Мотивация"}
              </button>
            ))}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Ваш результат:{" "}
            {activeTest === "emotional_intelligence"
              ? "Эмоциональный интеллект"
              : "Мотивация"}
          </h2>
          <div className="bg-purple-50 rounded-xl p-6 mb-6">
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-purple-600 mb-2">
                {Math.round(result.percentage)}%
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden max-w-md mx-auto">
                <div
                  className={`h-full ${getBarColor(result.percentage)} rounded-full`}
                  style={{ width: `${result.percentage}%` }}
                />
              </div>
              <div className="text-xl font-semibold text-gray-800 mt-4">
                {result.level} уровень
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed">
              {result.description}
            </p>
            <div className="mt-4 text-sm text-gray-500">
              {result.totalScore} из {result.maxScore} баллов
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={startNewTest}
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
  }

  const currentQuestionsList = currentQuestions.slice(
    currentPage * questionsPerPage,
    (currentPage + 1) * questionsPerPage,
  );

  const startIdx = currentPage * questionsPerPage;
  const answeredCount = Object.keys(answers).length;
  const isPageComplete = currentQuestionsList.every(
    (_, idx) => answers[startIdx + idx] !== undefined,
  );

  return (
    <div>
      <div className="flex text-xs flex-col md:flex-row md:text-sm gap-3 mb-6">
        <div className="flex flex-row">
          <button
            onClick={() => switchToTest("big5")}
            className={`px-4 py-2 rounded-lg transition ${activeTest === "big5" ? "bg-purple-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`}
          >
            Большая пятёрка
          </button>
          <button
            onClick={() => switchToTest("emotional_intelligence")}
            className={`px-4 ml-[10px] py-2 rounded-lg transition ${activeTest === "emotional_intelligence" ? "bg-purple-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`}
          >
            Эмоциональный интеллект
          </button>
        </div>
        <button
          onClick={() => switchToTest("motivation")}
          className={`px-4 py-2 rounded-lg w-[120px] transition ${activeTest === "motivation" ? "bg-purple-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`}
        >
          Мотивация
        </button>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {activeTest === "big5" && "Тест на тип личности (Большая пятёрка)"}
        {activeTest === "emotional_intelligence" &&
          "Тест на эмоциональный интеллект"}
        {activeTest === "motivation" && "Тест на мотивацию"}
      </h2>
      <p className="text-gray-600 mb-6">
        {activeTest === "big5" &&
          "Ответьте на 40 вопросов, чтобы узнать свой психологический профиль."}
        {activeTest === "emotional_intelligence" &&
          "Оцените свой эмоциональный интеллект."}
        {activeTest === "motivation" && "Узнайте уровень своей мотивации."}
        <br />
        <span className="text-sm text-purple-600">
          Отвечено вопросов: {answeredCount} из {currentQuestions.length}
        </span>
      </p>

      <div className="space-y-8 mb-8">
        {currentQuestionsList.map((q, idx) => {
          const globalIdx = startIdx + idx;
          const selectedValue = answers[globalIdx];
          return (
            <div key={globalIdx} className="border-b border-gray-200 pb-4">
              <p className="font-medium text-gray-800 mb-4">
                {globalIdx + 1}. {q.text}
              </p>
              <div className="flex justify-between items-center max-w-md mx-auto">
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
                <p className="text-green-800">Согласен</p>
                <p className="text-purple-800">Не согласен</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-4">
        <button
          onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
          disabled={currentPage === 0}
          className="flex items-center gap-1 text-xs px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" /> Назад
        </button>
        <span className="text-sm text-gray-500 text-xs">
          Страница {currentPage + 1} из {totalPages}
        </span>
        {currentPage === totalPages - 1 ? (
          <button
            onClick={calculateAndSaveResult}
            disabled={answeredCount < currentQuestions.length || savingResult}
            className="px-6 py-2 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {savingResult ? "Сохранение..." : "Получить результат"}
          </button>
        ) : (
          <button
            onClick={() =>
              setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
            }
            disabled={!isPageComplete}
            className="flex items-center gap-1 px-4 text-xs py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50"
          >
            Далее <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

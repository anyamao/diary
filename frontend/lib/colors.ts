export const colors = [
  {
    name: "yellow",
    label: "Желтый",
    bg: "bg-yellow-100",
    border: "border-yellow-400",
    text: "text-yellow-800",
    tagBg: "bg-yellow-200",
    base: "bg-yellow-500",
    hex: "#eab308",
  },
  {
    name: "blue",
    label: "Синий",
    bg: "bg-blue-100",
    border: "border-blue-400",
    text: "text-blue-800",
    tagBg: "bg-blue-200",
    base: "bg-blue-500",
    hex: "#3b82f6",
  },
  {
    name: "green",
    label: "Зеленый",
    bg: "bg-green-100",
    border: "border-green-400",
    text: "text-green-800",
    tagBg: "bg-green-200",
    base: "bg-green-500",
    hex: "#22c55e",
  },
  {
    name: "purple",
    label: "Фиолетовый",
    bg: "bg-purple-100",
    border: "border-purple-400",
    text: "text-purple-800",
    tagBg: "bg-purple-200",
    base: "bg-purple-500",
    hex: "#a855f7",
  },
  {
    name: "pink",
    label: "Розовый",
    bg: "bg-pink-100",
    border: "border-pink-400",
    text: "text-pink-800",
    tagBg: "bg-pink-200",
    base: "bg-pink-500",
    hex: "#ec4899",
  },
  {
    name: "dark-pink",
    label: "Темно-розовый",
    bg: "bg-pink-200",
    border: "border-pink-400",
    text: "text-pink-800",
    tagBg: "bg-pink-300",
    base: "bg-pink-600",
    hex: "#db2777",
  },
  {
    name: "teal",
    label: "Бирюзовый",
    bg: "bg-teal-100",
    border: "border-teal-400",
    text: "text-teal-800",
    tagBg: "bg-teal-200",
    base: "bg-teal-500",
    hex: "#14b8a6",
  },
  {
    name: "indigo",
    label: "Индиго",
    bg: "bg-indigo-200",
    border: "border-indigo-400",
    text: "text-indigo-800",
    tagBg: "bg-indigo-200",
    base: "bg-indigo-600",
    hex: "#6366f1",
  },
  {
    name: "fuchsia",
    label: "Фукция",
    bg: "bg-fuchsia-200",
    border: "border-fuchsia-400",
    text: "text-fuchsia-800",
    tagBg: "bg-fuchsia-200",
    base: "bg-fuchsia-600",
    hex: "#d946ef",
  },
  {
    name: "orange",
    label: "Оранжевый",
    bg: "bg-orange-100",
    border: "border-orange-400",
    text: "text-orange-800",
    tagBg: "bg-orange-200",
    base: "bg-orange-500",
    hex: "#f97316",
  },
];
export const chartColors = [
  { name: "pink", hex: "#ec4899", tailwind: "pink-300" },
  { name: "blue", hex: "#3b82f6", tailwind: "blue-300" },
  { name: "green", hex: "#22c55e", tailwind: "green-500" },
  { name: "yellow", hex: "#eab308", tailwind: "yellow-300" },
  { name: "purple", hex: "#a855f7", tailwind: "purple-300" },
  { name: "orange", hex: "#f97316", tailwind: "orange-400" },
  { name: "teal", hex: "#14b8a6", tailwind: "teal-300" },
  { name: "rose", hex: "#f43f5e", tailwind: "rose-400" },
  { name: "red", hex: "#ef4444", tailwind: "red-400" },
];
export const moodColorMap: { [key: string]: string } = {
  Счастлив: chartColors[2].hex, // зеленый
  Грустный: chartColors[1].hex, // синий
  "Очень грустный": chartColors[7].hex, // rose
  Злой: chartColors[6].hex, // teal
  Напряженный: chartColors[4].hex, // фиолетовый
  "Очень напряженный": chartColors[5].hex, // оранжевый
  Спокойный: chartColors[0].hex, // розовый
  "Без эмоций": "#9ca3af", // серый
};
export const getMoodColorByName = (moodName: string): string => {
  return moodColorMap[moodName] || chartColors[0].hex;
};
export const getMoodColor = (moodKey: string): string => {
  const moodKeyToColor: { [key: string]: string } = {
    happy: chartColors[0].hex, // pink-200
    sad: chartColors[1].hex, // blue-200
    verysad: chartColors[1].hex, // blue-300 (тот же синий)
    angry: chartColors[8].hex, // red-200 (красный)
    stressed: chartColors[3].hex, // yellow-200
    verystressed: chartColors[3].hex, // yellow-300 (тот же желтый)
    calm: chartColors[0].hex, // pink-100 (тот же розовый)
    noemotions: "#9ca3af", // серый
  };
  return moodKeyToColor[moodKey] || chartColors[0].hex;
};
export const getChartColor = (index: number): string => {
  return chartColors[index % chartColors.length].hex;
};

export const getColorByName = (name: string) => {
  return colors.find((c) => c.name === name) || colors[0];
};

export const getColorHex = (name: string) => {
  return getColorByName(name).hex;
};

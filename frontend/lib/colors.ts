export const colors = [
  {
    name: "yellow",
    label: "Желтый",
    bg: "bg-yellow-100",
    border: "border-yellow-400",
    text: "text-yellow-800",
    tagBg: "bg-yellow-200",
    base: "bg-yellow-500",
    hex: "#fbbf24",
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
    hex: "#10b981",
  },
  {
    name: "purple",
    label: "Фиолетовый",
    bg: "bg-purple-100",
    border: "border-purple-400",
    text: "text-purple-800",
    tagBg: "bg-purple-200",
    base: "bg-purple-500",
    hex: "#8b5cf6",
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
    name: "orange",
    label: "Оранжевый",
    bg: "bg-orange-100",
    border: "border-orange-400",
    text: "text-orange-800",
    tagBg: "bg-orange-200",
    base: "bg-orange-500",
    hex: "#fb923c",
  },
  {
    name: "dark-purple",
    label: "Темно-фиолетовый",
    bg: "bg-purple-200",
    border: "border-purple-500",
    text: "text-purple-800",
    tagBg: "bg-purple-300",
    base: "bg-purple-700",
    hex: "#7e22ce",
  },
];

export const getColorByName = (name: string) => {
  return colors.find((c) => c.name === name) || colors[0];
};

export const getColorHex = (name: string) => {
  return getColorByName(name).hex;
};

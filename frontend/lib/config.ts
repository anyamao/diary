// Используем переменную окружения
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8011";
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3011";

console.log("📍 API_URL:", API_URL);
console.log("📍 APP_URL:", APP_URL);
console.log(
  "📍 Hostname:",
  typeof window !== "undefined" ? window.location.hostname : "server",
);

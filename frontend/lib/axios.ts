import axios from "axios";

// Используем переменную окружения
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8011";

console.log("🔍 Axios initialized with API_URL:", API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Добавляем токен если есть
api.interceptors.request.use(
  (config) => {
    console.log("📤 Request:", config.method?.toUpperCase(), config.url);
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  },
);

// Логируем ответы
api.interceptors.response.use(
  (response) => {
    console.log("✅ Response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error(
      "❌ Response error:",
      error.response?.status,
      error.response?.data,
    );
    return Promise.reject(error);
  },
);

export default api;

import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8011";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 15000,
});

// Флаг для предотвращения множественных запросов на обновление
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log("📤 Request:", config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor для обновления токена
api.interceptors.response.use(
  (response) => {
    console.log("✅ Response:", response.status, response.config.url);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Если ошибка 401 и это не запрос на обновление токена
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Ждем завершения обновления токена
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Пробуем обновить токен
        await api.post("/auth/refresh");
        console.log("🔄 Token refreshed successfully");

        // Обрабатываем очередь запросов
        processQueue();

        // Повторяем оригинальный запрос
        return api(originalRequest);
      } catch (refreshError) {
        console.error("❌ Token refresh failed");
        processQueue(refreshError);

        // Перенаправляем на логин
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    console.error(
      "❌ Response error:",
      error.response?.status,
      error.response?.data,
    );
    return Promise.reject(error);
  },
);

export default api;

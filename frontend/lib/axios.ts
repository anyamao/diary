import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8011";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Обязательно для отправки кук
  timeout: 15000,
});

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

// Response interceptor
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

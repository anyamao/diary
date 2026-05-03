import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8011",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for CORS
  timeout: 10000, // 10 second timeout
});

// Add request interceptor for logging (development only)
api.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`,
      );
    }
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

// Response interceptor with better error handling
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    if (error.response) {
      // Server responded with error status
      console.error("API Error Response:", {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
      });

      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        const originalRequest = error.config;
        if (!originalRequest._retry) {
          originalRequest._retry = true;
          const refreshToken = localStorage.getItem("refresh_token");

          if (refreshToken) {
            try {
              const response = await axios.post(
                "http://localhost:8011/auth/refresh",
                {
                  refresh_token: refreshToken,
                },
              );
              const { access_token, refresh_token } = response.data;
              localStorage.setItem("access_token", access_token);
              localStorage.setItem("refresh_token", refresh_token);
              originalRequest.headers.Authorization = `Bearer ${access_token}`;
              return api(originalRequest);
            } catch (refreshError) {
              localStorage.removeItem("access_token");
              localStorage.removeItem("refresh_token");
              window.location.href = "/login";
            }
          } else {
            window.location.href = "/login";
          }
        }
      }
    } else if (error.request) {
      // Request made but no response received
      console.error("Network Error - No response received:", error.request);
      return Promise.reject(
        new Error("Network error - Please check if backend is running"),
      );
    } else {
      // Something else happened
      console.error("Unknown API Error:", error.message);
    }

    return Promise.reject(error);
  },
);

export default api;

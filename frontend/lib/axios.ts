import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.vibenote.ru';
console.log('🔍 Axios using API_URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use((config) => {
  // Skip adding auth header for OPTIONS requests
  if (config.method === 'options') {
    return config;
  }
  
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Safe logging with null check
  const baseURL = config.baseURL || API_URL;
  console.log('📤 Making request to:', baseURL + config.url);
  return config;
}, (error) => {
  console.error('Request error:', error);
  return Promise.reject(error);
});

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url
      });
      
      if (error.response.status === 401) {
        const originalRequest = error.config;
        if (!originalRequest._retry) {
          originalRequest._retry = true;
          const refreshToken = localStorage.getItem('refresh_token');
          
          if (refreshToken) {
            try {
              const response = await axios.post(`${API_URL}/auth/refresh`, {
                refresh_token: refreshToken,
              });
              const { access_token, refresh_token } = response.data;
              localStorage.setItem('access_token', access_token);
              localStorage.setItem('refresh_token', refresh_token);
              originalRequest.headers.Authorization = `Bearer ${access_token}`;
              return api(originalRequest);
            } catch (refreshError) {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              window.location.href = '/login';
            }
          } else {
            window.location.href = '/login';
          }
        }
      }
    } else if (error.request) {
      console.error('Network Error - No response received:', error.request);
    } else {
      console.error('Unknown API Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;

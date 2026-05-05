// Определяем API URL в зависимости от окружения
export const API_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:8011'
  : process.env.NEXT_PUBLIC_API_URL || 'https://api.vibenote.ru';

console.log('🌐 API_URL:', API_URL);

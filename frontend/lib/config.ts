// Явно задаем URL для продакшена
export const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? 'https://api.vibenote.ru'
  : (process.env.NEXT_PUBLIC_API_URL || 'https://api.vibenote.ru');

export const APP_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? 'https://vibenote.ru'
  : (process.env.NEXT_PUBLIC_APP_URL || 'https://vibenote.ru');

console.log('📍 API_URL:', API_URL);
console.log('📍 APP_URL:', APP_URL);
console.log('📍 Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'server');

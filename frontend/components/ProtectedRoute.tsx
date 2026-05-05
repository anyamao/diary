'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Не делаем редирект сразу, даем время на проверку
    if (!isLoading) {
      if (!isAuthenticated) {
        // Сохраняем текущий путь для редиректа после логина
        sessionStorage.setItem('redirectAfterLogin', pathname);
        setShouldRedirect(true);
      } else {
        setShouldRedirect(false);
      }
    }
  }, [isAuthenticated, isLoading, pathname]);

  useEffect(() => {
    if (shouldRedirect) {
      router.push('/login');
    }
  }, [shouldRedirect, router]);

  // Показываем заглушку, пока проверяем авторизацию
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  // Если не авторизован, не показываем контент (редирект уже запущен)
  if (!isAuthenticated) {
    return null;
  }

  // Авторизован - показываем контент
  return <>{children}</>;
}

'use client';

import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/personal/diary');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Добро пожаловать в VibeNote
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Твой личный дневник для мыслей и эмоций
          </p>
          
          <div className="space-x-4">
            <Link
              href="/login"
              className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition inline-block"
            >
              Войти
            </Link>
            <Link
              href="/register"
              className="bg-pink-200 text-pink-800 px-6 py-2 rounded-lg hover:bg-pink-300 transition inline-block"
            >
              Регистрация
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

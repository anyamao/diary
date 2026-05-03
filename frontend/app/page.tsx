'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

export default function Home() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.push('/diary');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return null; // Will redirect
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Welcome to VibeNote
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your personal digital diary
          </p>
          
          <div className="space-x-4">
            <Link
              href="/login"
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition inline-block"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition inline-block"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

'use client';

import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

export default function Home() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">VibeNote</h1>
        <p className="text-xl text-gray-600 mb-8">Your personal space for thoughts and ideas</p>
        {isAuthenticated ? (
          <Link
            href="/personal/diary"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
          >
            Go to My Diary
          </Link>
        ) : (
          <div className="space-x-4">
            <Link
              href="/login"
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition inline-block"
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
        )}
      </div>
    </div>
  );
}

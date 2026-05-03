"use client";

import { useAuthStore } from "@/store/authStore";
import Link from "next/link";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Welcome to CalmNote
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your secure digital diary
          </p>

          {isAuthenticated && user ? (
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
                <h2 className="text-2xl font-semibold mb-4">
                  Welcome back, {user.full_name || user.username}!
                </h2>
                <p className="text-gray-600">Email: {user.email}</p>
                <p className="text-gray-600">
                  Member since: {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={logout}
                className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition"
              >
                Logout
              </button>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LogIn,
  LogOut,
  Sparkles,
  Star,
  User,
  UserPenIcon,
  Settings,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useState } from "react";

function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsProfileMenuOpen(false);
    router.push("/login");
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  return (
    <div className="w-full flex flex-col">
      <div className="w-full bg-white shadow-xs border-b-[1px] border-pink-200 fixed p-[20px] top-0 left-0 min-h-[60px] max-h-[60px] flex items-center justify-between z-10">
        <Link
          href="/"
          className="text-lg text-pink-950 font-bold cursor-pointer hover:text-pink-700"
        >
          VibeNote
        </Link>

        <div className="flex flex-row justify-center w-full ml-[-30px] font-semibold bg-pink-200 h-[30px] rounded-lg max-w-[400px] text-xs text-pink-950 items-center">
          <Link
            href="/personal"
            className={`flex-1 cursor-pointer hover:text-pink-700 duration-300 flex items-center h-full rounded-l-lg justify-center ${
              pathname.startsWith("/personal")
                ? "bg-pink-300 text-pink-700"
                : ""
            }`}
          >
            Личное
          </Link>

          <Link
            href="/business"
            className={`flex-1 hover:bg-pink-300 hover:text-pink-700 duration-300 flex cursor-pointer h-full items-center justify-center ${
              pathname.startsWith("/business")
                ? "bg-pink-300 text-pink-700"
                : ""
            }`}
          >
            Проекты
          </Link>

          <Link
            href="/about-us"
            className={`flex-1 flex items-center hover:text-pink-700 duration-300 h-full cursor-pointer rounded-r-lg justify-center hover:bg-pink-300 ${
              pathname === "/about-us" ? "bg-pink-300 text-pink-700" : ""
            }`}
          >
            О нас
          </Link>
        </div>

        <div className="flex items-center gap-3 relative">
          {isAuthenticated ? (
            <>
              <button
                onClick={toggleProfileMenu}
                className="focus:outline-none"
              >
                <img
                  src="/diaryicon.png"
                  className="w-[30px] border-[1px] duration-300 cursor-pointer border-pink-300 p-[1px] rounded-full hover:scale-105 transition"
                  alt="Avatar"
                />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1 text-xs text-pink-600 hover:text-pink-800"
            >
              <LogIn className="w-4 h-4" />
              Войти
            </Link>
          )}
        </div>
      </div>

      {/* Profile dropdown menu */}
      {isProfileMenuOpen && isAuthenticated && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setIsProfileMenuOpen(false)}
          />
          <div className="fixed top-[60px] right-0 z-30 w-[280px] bg-white border-[1px] border-pink-200 rounded-lg shadow-lg mx-4 mt-2 overflow-hidden">
            <div className="px-4 py-3 border-b border-pink-100">
              <p className="text-sm font-semibold text-pink-900">
                {user?.full_name || user?.username}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>

            <div className="py-2">
              <Link
                href="/profile"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 transition"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                <User className="w-4 h-4 text-pink-500" />
                Мой аккаунт
              </Link>

              <Link
                href="/settings"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 transition"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                <Settings className="w-4 h-4 text-pink-500" />
                Настройки
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
              >
                <LogOut className="w-4 h-4" />
                Выйти
              </button>
            </div>
          </div>
        </>
      )}

      {/* Only show the second navigation bar on /personal routes */}
      {pathname.startsWith("/personal") && (
        <div className="w-full bg-white border-b-[1px] border-pink-300 shadow-sm bg-white mt-[60px] fixed py-[20px] top-0 left-0 min-h-[40px] max-h-[40px] flex items-center justify-center z-9">
          <div className="flex flex-row font-semibold text-pink-950 text-xs items-center justify-between">
            <Star className="text-yellow-600 h-4 w-4 -rotate-90" />
            <div className="flex items-center flex-row mx-[10px] justify-center">
              <Link
                href="/personal/diary"
                className={`pr-[10px] hover:underline hover:text-pink-600 duration-300 cursor-pointer ${
                  pathname === "/personal/diary"
                    ? "text-pink-600 underline"
                    : ""
                }`}
              >
                Дневник
              </Link>
              <Link
                href="/personal/mood-tracker"
                className={`pr-[10px] hover:underline hover:text-pink-600 duration-300 cursor-pointer ${
                  pathname === "/personal/mood-tracker"
                    ? "text-pink-600 underline"
                    : ""
                }`}
              >
                Трекер настроения
              </Link>
              <Link
                href="/personal/sleep"
                className="px-[10px] hover:underline hover:text-pink-600 duration-300 cursor-pointer"
              >
                Мой сон
              </Link>
              <Link
                href="/personal/personality"
                className="px-[10px] hover:underline hover:text-pink-600 duration-300 cursor-pointer"
              >
                Моя личность
              </Link>
            </div>
            <Star className="text-yellow-600 h-4 w-4 rotate-90" />
          </div>
        </div>
      )}

      {pathname.startsWith("/business") && (
        <div className="w-full bg-white border-b-[1px] border-pink-300 shadow-sm bg-white mt-[60px] fixed py-[20px] top-0 left-0 min-h-[40px] max-h-[40px] flex items-center justify-center z-9">
          <div className="flex flex-row font-semibold text-pink-950 text-xs items-center justify-between">
            <Star className="text-yellow-600 h-4 w-4 -rotate-90" />
            <div className="flex items-center flex-row mx-[10px] justify-center">
              <Link
                href="/business/planner"
                className={`pr-[10px] hover:underline hover:text-pink-600 duration-300 cursor-pointer ${
                  pathname === "/personal/diary"
                    ? "text-pink-600 underline"
                    : ""
                }`}
              >
                Планер
              </Link>
              <Link
                href="/business/notes"
                className={`pr-[10px] hover:underline hover:text-pink-600 duration-300 cursor-pointer ${
                  pathname === "/personal/mood-tracker"
                    ? "text-pink-600 underline"
                    : ""
                }`}
              >
                Заметки
              </Link>
              <Link
                href="/business/study-timer"
                className={`pr-[10px] hover:underline hover:text-pink-600 duration-300 cursor-pointer ${
                  pathname === "/personal/mood-tracker"
                    ? "text-pink-600 underline"
                    : ""
                }`}
              >
                Таймер
              </Link>
            </div>
            <Star className="text-yellow-600 h-4 w-4 rotate-90" />
          </div>
        </div>
      )}
    </div>
  );
}

export default Header;

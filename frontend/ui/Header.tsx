"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { usePathname, useRouter } from "next/navigation";
import { LogIn, LogOut, Star, User, Settings, Bell } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import ProfileModal from "@/components/ProfileModal";

function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState("icon1.jpg");
  const [currentUsername, setCurrentUsername] = useState("");
  const handleLogout = async () => {
    await logout();
    setIsProfileMenuOpen(false);
    router.push("/login");
  };
  const fetchCurrentUser = async () => {
    try {
      const response = await api.get("/auth/me");
      setCurrentUsername(response.data.username);
    } catch (error) {}
  };
  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrentUser();
    }
  }, [isAuthenticated]);
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchCurrentAvatar();
    }
  }, [isAuthenticated, user]);
  useEffect(() => {
    const handleUserUpdate = () => {
      fetchCurrentUser();
    };
    window.addEventListener("user-updated", handleUserUpdate);
    return () => window.removeEventListener("user-updated", handleUserUpdate);
  }, []);
  const fetchCurrentAvatar = async () => {
    try {
      const response = await api.get("/auth/avatar");
      setCurrentAvatar(response.data.avatar);
    } catch (error) {}
  };

  const handleAvatarUpdate = (newAvatar: string) => {
    setCurrentAvatar(newAvatar);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const openProfileModal = () => {
    setIsProfileMenuOpen(false);
    setIsProfileModalOpen(true);
  };

  return (
    <div className="w-full flex flex-col">
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onAvatarUpdate={handleAvatarUpdate}
      />

      <div className="w-full bg-white shadow-xs border-b-[1px] border-pink-200 fixed p-[20px] top-0 left-0 min-h-[60px] max-h-[60px] flex items-center justify-between z-40">
        <Link
          href="/"
          className="text-sm md:text-lg text-pink-950 font-bold cursor-pointer hover:text-pink-700"
        >
          VibeNote
        </Link>

        <div className="flex flex-row justify-center w-full md:ml-[-30px] font-semibold bg-pink-200 md:h-[30px] h-[25px] rounded-lg max-w-[230px] md:max-w-[400px] text-xs text-pink-950 items-center">
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
            className={`flex-1  hover:text-pink-700 duration-300 flex cursor-pointer h-full items-center justify-center ${
              pathname.startsWith("/business")
                ? "bg-pink-300 text-pink-700 rounded-r-lg"
                : ""
            }`}
          >
            Проекты
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
                  src={`/${currentAvatar}`}
                  className="w-[30px] border-[1px] duration-300 cursor-pointer border-pink-300 p-[1px] rounded-full hover:scale-105 transition object-cover"
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

      {isProfileMenuOpen && isAuthenticated && (
        <>
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setIsProfileMenuOpen(false)}
          />
          <div className="fixed top-[60px] right-4 z-[101] w-[280px] bg-white border-[1px] border-pink-200 rounded-lg shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-pink-100">
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={`/${currentAvatar}`}
                  className="w-12 h-12 border-[1px] border-pink-300 p-[2px] rounded-full object-cover"
                  alt="Avatar"
                />
                <div>
                  <p className="text-sm font-semibold text-pink-900">
                    {currentUsername || user?.full_name || user?.username}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>
            <div className="py-2">
              <button
                onClick={openProfileModal}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 transition"
              >
                <User className="w-4 h-4 text-pink-500" />
                Мой профиль
              </button>

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

      {pathname.startsWith("/personal") && (
        <div className="w-full border-b-[1px] border-pink-300 shadow-sm bg-white mt-[60px] fixed  top-0 left-0 min-h-[40px] max-h-[60px] sm:max-h-[40px] flex items-center justify-center z-30">
          <div className="flex flex-row whitespace-nowrap pb-[10px] sm:pb-[0px]  max-w-[340px] sm:max-w-[1200px] overflow-x-auto font-semibold text-pink-950 text-xs items-center justify-between">
            <Star className="text-yellow-600 h-4 w-4 -rotate-90" />
            <div className="flex items-center flex-row mx-[10px] justify-center">
              <Link
                href="/personal/diary"
                className={`pr-[10px] hover:underline hover:text-pink-600 duration-300 cursor-pointer ${
                  pathname.startsWith("/personal/diary")
                    ? "text-pink-600 underline"
                    : ""
                }`}
              >
                Дневник
              </Link>
              <Link
                href="/personal/mood-tracker"
                className={`pr-[10px] hover:underline hover:text-pink-600 duration-300 cursor-pointer ${
                  pathname.startsWith("/personal/mood-tracker")
                    ? "text-pink-600 underline"
                    : ""
                }`}
              >
                Трекер настроения
              </Link>
            </div>
            <Link
              href="/personal/sleep"
              className={`pr-[10px] hover:underline hover:text-pink-600 duration-300 cursor-pointer ${
                pathname.startsWith("/personal/sleep")
                  ? "text-pink-600 underline"
                  : ""
              }`}
            >
              Мой сон
            </Link>
            <Link
              href="/personal/personality"
              className={`pr-[10px] hover:underline hover:text-pink-600 duration-300 cursor-pointer ${
                pathname.startsWith("/personal/personality")
                  ? "text-pink-600 underline"
                  : ""
              }`}
            >
              Моя личность
            </Link>
            <Star className="text-yellow-600 h-4 w-4 rotate-90" />
          </div>
        </div>
      )}

      {pathname.startsWith("/business") && (
        <div className="w-full bg-white border-b-[1px] border-pink-300 shadow-sm mt-[60px] fixed py-[20px] top-0 left-0 min-h-[40px] max-h-[40px] flex items-center justify-center z-30">
          <div className="flex flex-row font-semibold whitespace-nowrap text-pink-950 text-xs items-center justify-between">
            <Star className="text-yellow-600 h-4 w-4 -rotate-90" />
            <div className="flex items-center whitespace-nowrap flex-row mx-[10px] justify-center">
              <Link
                href="/business/planner"
                className={`pr-[10px] hover:underline hover:text-pink-600 duration-300 cursor-pointer ${
                  pathname.startsWith("/business/planner")
                    ? "text-pink-600 underline"
                    : ""
                }`}
              >
                Планер
              </Link>
              <Link
                href="/business/notes"
                className={`pr-[10px] hover:underline whitespace-nowrap hover:text-pink-600 duration-300 cursor-pointer ${
                  pathname.startsWith("/business/notes")
                    ? "text-pink-600 underline"
                    : ""
                }`}
              >
                Заметки
              </Link>
              <Link
                href="/business/study-timer"
                className={`pr-[10px] hover:underline hover:text-pink-600 duration-300 cursor-pointer ${
                  pathname.startsWith("/business/study-timer")
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

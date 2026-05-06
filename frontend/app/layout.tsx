"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/ui/Header";
import Sidepanel from "@/components/Sidepanel";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import MiniTimer from "@/components/MiniTimer";
const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Не показываем хедер на страницах авторизации
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Показываем сайдпанель только на /personal/diary и его дочерних страницах
  const showSidepanel =
    isAuthenticated && pathname?.startsWith("/personal/diary");

  return (
    <html lang="ru">
      <body className={inter.className}>
        {!isAuthPage && <Header />}
        {!isAuthPage && <MiniTimer />}
        <div className={!isAuthPage ? "mt-[100px]" : ""}>
          {showSidepanel ? (
            <div className="flex">
              <Sidepanel />
              <div className="flex-1 ">{children}</div>
            </div>
          ) : (
            children
          )}
        </div>
      </body>
    </html>
  );
}

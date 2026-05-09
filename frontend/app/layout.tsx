"use client";
import { useSidepanelStore } from "@/store/sidepanelStore";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/ui/Header";
import Sidepanel from "@/components/Sidepanel";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import MiniTimer from "@/components/MiniTimer";
import ToastContainer from "@/components/Toast";
import Footer from "@/ui/Footer";
import { ConfirmDialogContainer } from "@/components/ConfirmDialog";
const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { toggle, isOpen } = useSidepanelStore();

  const isAuthPage =
    pathname === "/login" || pathname === "/register" || pathname === "/";
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const showSidepanel = pathname?.startsWith("/personal/diary");
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <html lang="ru">
      <body className={`${inter.className} relative`}>
        {!isAuthPage && <Header />}
        {!isAuthPage && <Footer />}
        {!isAuthPage && <MiniTimer />}
        {!isAuthPage && <ToastContainer />}
        {!isAuthPage && <ConfirmDialogContainer />}
        <div className={!isAuthPage ? "mt-[100px]  pb-[260px]" : ""}>
          {showSidepanel ? (
            <div className="flex  flex-row  ">
              <div
                className={`flex ${isOpen ? "  w-[280px]" : "  w-[10px]"} hidden sm:flex bg-pink-50 min-h-full`}
              >
                <Sidepanel />
              </div>
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

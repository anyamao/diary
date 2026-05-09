import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";

function Loading() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const [showLoginButton, setShowLoginButton] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoading && !isAuthenticated) {
        setShowLoginButton(true);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading]);

  if (!showLoginButton) {
    return (
      <div className="flex w-[105%] ml-[-10px] justify-center fixed z-40 bg-pink-50 min-h-[1200px]">
        <div className="relative w-[220px] mt-[200px] ml-[-20px] h-[220px]">
          <div
            className="absolute inset-[5px] rounded-full border-4 border-transparent border-t-pink-300"
            style={{
              animation: "spin-cw 1.5s linear infinite",
            }}
          />
          <div
            className="absolute inset-[25px] rounded-full border-4 border-transparent border-t-pink-300"
            style={{
              animation: "spin-cw 2s linear infinite",
            }}
          />
          <div
            className="absolute inset-[15px] rounded-full border-4 border-transparent border-r-pink-300"
            style={{
              animation: "spin-ccw 2s linear infinite",
            }}
          />
          <div
            className="absolute inset-[25px] rounded-full border-4 border-transparent border-b-pink-300"
            style={{
              animation: "spin-cw 3s linear infinite",
            }}
          />
          <div
            className="absolute inset-[5px] rounded-full border-4 border-transparent border-b-pink-300"
            style={{
              animation: "spin-ccw 3s linear infinite",
            }}
          />
          <div className="flex flex-col items-center justify-center h-full">
            <img
              src="/diary_like.png"
              className="w-[180px] hover:scale-105 duration-300 transition-all hover:rotate-3 h-[180px] mt-[120px] mb-[-20px]"
              alt="Loading"
            />
            <TypingText />
          </div>
          <Link
            href="/login"
            className="inline-block bg-pink-500 text-white px-6 py-3 mt-[35px] ml-[20px] rounded-lg hover:bg-pink-600 transition"
          >
            Войти в аккаунт
          </Link>
        </div>
      </div>
    );
  }
}

const TypingText = () => {
  const [displayedText, setDisplayedText] = React.useState("");
  const [messageIndex, setMessageIndex] = React.useState(0);
  const [isTyping, setIsTyping] = React.useState(true);

  const messages = [
    "Загрузка...",
    "Страница скоро загрузится...",
    "Грузим страницу...",
    "Совсем чуть-чуть...",
  ];

  const currentMessage = messages[messageIndex];

  React.useEffect(() => {
    let timeout;

    if (isTyping) {
      if (displayedText.length < currentMessage.length) {
        timeout = setTimeout(() => {
          setDisplayedText(currentMessage.slice(0, displayedText.length + 1));
        }, 150);
      } else {
        timeout = setTimeout(() => {
          setIsTyping(false);
        }, 1300);
      }
    } else {
      if (displayedText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayedText(displayedText.slice(0, -1));
        }, 100);
      } else {
        setIsTyping(true);
        setMessageIndex((prev) => (prev + 1) % messages.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayedText, isTyping, currentMessage]);

  return (
    <p className="mt-4 text-md font-medium text-pink-800 w-full min-h-[80px] text-center">
      {displayedText}
    </p>
  );
};

export default Loading;

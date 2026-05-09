import React, { useState, useEffect } from "react";

function Loading() {
  return (
    <div className="flex w-[105%] ml-[-10px] justify-center fixed z-40 bg-pink-50 min-h-[1200px]">
      {/* Круговой контейнер */}
      <div className="relative w-[220px] mt-[200px] ml-[-20px] h-[220px]">
        {/* Линия 1 - верхняя граница, вращается ПО часовой */}
        <div
          className="absolute inset-[5px] rounded-full border-4 border-transparent border-t-pink-300"
          style={{
            animation: "spin-cw 1.5s linear infinite",
            WebkitMask: "",
          }}
        />
        <div
          className="absolute inset-[25px] rounded-full border-4 border-transparent border-t-pink-300"
          style={{
            animation: "spin-cw 2s linear infinite",
            WebkitMask: "",
          }}
        />

        {/* Линия 2 - правая граница, вращается ПРОТИВ часовой */}
        <div
          className="absolute inset-[15px] rounded-full border-4 border-transparent border-r-pink-300"
          style={{
            animation: "spin-ccw 2s linear infinite",
            WebkitMask: "",
          }}
        />

        {/* Линия 3 - нижняя граница, вращается ПО часовой (медленно) */}
        <div
          className="absolute inset-[25px] rounded-full border-4 border-transparent border-b-pink-300"
          style={{
            animation: "spin-cw 3s linear infinite",
            WebkitMask: "",
          }}
        />
        <div
          className="absolute inset-[5px] rounded-full border-4 border-transparent border-b-pink-300"
          style={{
            animation: "spin-ccw 3s linear infinite",
            WebkitMask: "",
          }}
        />

        {/* Линия 4 - левая граница, вращается ПРОТИВ часовой (быстро) */}

        {/* Центральное изображение */}
        <div className="flex flex-col items-center justify-center h-full">
          <img
            src="/diary_like.png"
            className="w-[180px] hover:scale-105 duration-300 transition-all hover:rotate-3 h-[180px] mt-[120px] mb-[-20px]"
            alt="Loading"
          />
          <TypingText />
        </div>
      </div>
    </div>
  );
}

// Компонент для печатающегося текста
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

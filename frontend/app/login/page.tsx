"use client";

import { useState } from "react";
import { API_URL } from "@/lib/api-url";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Важно для cookie
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        // Токены автоматически сохраняются в cookie
        window.location.href = "/personal/diary";
      } else {
        const data = await res.json();
        setError(data.detail || "Неверный email или пароль");
        setLoading(false);
      }
    } catch (err) {
      setError("Ошибка соединения с сервером");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fce7f3",
      }}
    >
      <div className="bg-white shadow-md rounded-lg  w-[400px] py-[40px] px-[40px]">
        <p className="font-semibold text-xl  text-center text-pink-800 mb-[5px] ">
          Привет! Я по тебе скучал
        </p>
        <p className="font-normal text-sm  text-center text-gray-500 mb-[20px]">
          Войди в свой аккаунт
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #f9a8d4",
                borderRadius: "4px",
              }}
            />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #f9a8d4",
                borderRadius: "4px",
              }}
            />
          </div>
          {error && (
            <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-pink-600 w-full rounded-md py-[15px] transition-all hover:bg-pink-700 duration-300  mt-[10px] text-white"
          >
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>
        <p className="text-gray-600 text-sm text-center mt-[15px] mr-[5px]">
          Впервые здесь?
          <a
            href="/register"
            className="text-pink-700 ml-[5px] hover:underline"
          >
            Создать аккаунт
          </a>
        </p>
      </div>
      <img
        src="/diary_idle.png"
        className=" hidden md:block w-[400px] ml-[-30px]"
      />
    </div>
  );
}

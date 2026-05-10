"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { API_URL } from "@/lib/api-url";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          username,
          password,
          full_name: fullName,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Регистрация успешна! Перенаправление...");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        setMessage("❌ Ошибка: " + (data.detail || "Что-то пошло не так"));
        setLoading(false);
      }
    } catch (err) {
      setMessage("❌ Ошибка соединения с сервером");
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
        backgroundColor: "#fce7f3",
        padding: "1rem",
      }}
    >
      <div className="bg-white shadow-md rounded-lg  w-[400px] py-[40px] px-[40px]">
        <p className="font-semibold text-xl  text-center text-pink-800 mb-[5px] ">
          Здравствуй! Рад встрече
        </p>
        <p className="font-normal text-sm  text-center text-gray-500 mb-[20px]">
          Создай свой аккаунт
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: "8px",
              border: "1px solid #f9a8d4",
              borderRadius: "4px",
            }}
          />
          <input
            type="text"
            placeholder="Имя пользователя"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{
              padding: "8px",
              border: "1px solid #f9a8d4",
              borderRadius: "4px",
            }}
          />
          <input
            type="text"
            placeholder="Полное имя (опционально)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={{
              padding: "8px",
              border: "1px solid #f9a8d4",
              borderRadius: "4px",
            }}
          />
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Пароль (минимум 8 символов)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "8px",
                paddingRight: "35px",
                border: "1px solid #f9a8d4",
                borderRadius: "4px",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#9ca3af",
              }}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {message && (
            <div
              style={{
                padding: "8px",
                backgroundColor: message.includes("✅") ? "#dcfce7" : "#fee2e2",
                color: message.includes("✅") ? "#166534" : "#991b1b",
                borderRadius: "4px",
                textAlign: "center",
                fontSize: "14px",
              }}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-pink-600 w-full rounded-md py-[15px] hover:bg-pink-700 transition-all duration-300 mt-[10px] text-white"
          >
            {loading ? "Регистрируем..." : "Зарегистрироваться"}
          </button>
        </form>
        <p className="text-gray-600 text-sm text-center mt-[15px] mr-[5px]">
          Есть аккаунт?
          <a href="/login" className="text-pink-700 ml-[5px] hover:underline">
            Войти
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

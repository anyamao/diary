'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Схема валидации для регистрации
const registerSchema = z.object({
  email: z.string().email("Введите корректный email"),
  username: z.string()
    .min(3, "Имя пользователя должно содержать минимум 3 символа")
    .max(50, "Имя пользователя не может быть длиннее 50 символов"),
  full_name: z.string().optional(),
  password: z.string()
    .min(8, "Пароль должен содержать минимум 8 символов")
    .regex(/[A-Z]/, "Пароль должен содержать хотя бы одну заглавную букву")
    .regex(/[a-z]/, "Пароль должен содержать хотя бы одну строчную букву")
    .regex(/\d/, "Пароль должен содержать хотя бы одну цифру"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type RegisterInput = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [error, setError] = useState("");
  const router = useRouter();
  const { register: registerUser, isLoading, isAuthenticated } = useAuthStore();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      username: "",
      full_name: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/personal/diary");
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: RegisterInput) => {
    setError("");
    try {
      await registerUser(data);
      router.push("/login?registered=true");
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Не удалось зарегистрироваться. Попробуйте снова.",
      );
    }
  };

  return (
    <div className="h-full w-full min-h-[950px] flex items-center justify-center bg-pink-200">
      <div className="w-full max-w-[450px] fixed mr-[300px] flex items-center justify-between">
        {/* Форма регистрации */}
        <Card className="w-full shadow-md border-pink-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-pink-900">
              Добро пожаловать!
            </CardTitle>
            <CardDescription className="text-center mt-1 text-pink-700">
              Создайте новый аккаунт
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-pink-900">Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="you@example.com"
                          {...field}
                          className="border-pink-200 focus:border-pink-500 focus:ring-pink-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-pink-900">Имя пользователя</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="username"
                          {...field}
                          className="border-pink-200 focus:border-pink-500 focus:ring-pink-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-pink-900">Полное имя (опционально)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Иван Иванов"
                          {...field}
                          className="border-pink-200 focus:border-pink-500 focus:ring-pink-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-pink-900">Пароль</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          className="border-pink-200 focus:border-pink-500 focus:ring-pink-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-pink-900">Подтвердите пароль</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          className="border-pink-200 focus:border-pink-500 focus:ring-pink-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <Alert variant="destructive" className="bg-red-50 border-red-200">
                    <AlertDescription className="text-red-700">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white transition-all duration-200"
                >
                  {isLoading ? "Регистрация..." : "Зарегистрироваться"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600">
              Уже есть аккаунт?{" "}
              <Link
                href="/login"
                className="text-pink-600 hover:text-pink-700 font-semibold"
              >
                Войти
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
      
      {/* Иллюстрация */}
      <img
        src="/diary_idle.png"
        alt="Diary illustration"
        className="hidden md:block w-[500px] ml-[520px]"
      />
    </div>
  );
}

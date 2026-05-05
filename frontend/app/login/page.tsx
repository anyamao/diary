"use client";

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

const loginSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState("");
  const router = useRouter();
  const { login, isLoading, isAuthenticated, user } = useAuthStore();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push("/personal/diary");
    }
  }, [isAuthenticated, user, router]);

  const onSubmit = async (data: LoginInput) => {
    setError("");
    try {
      await login(data.email, data.password);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Не удалось войти. Попробуйте снова.",
      );
    }
  };

  return (
    <div className="h-full w-full min-h-[950px] flex items-center justify-center bg-pink-200">
      <div className=" w-full max-w-[450px] fixed mr-[300px] flex items-center justify-between ">
        {/* Форма входа */}
        <Card className="w-full shadow-md border-pink-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-pink-900">
              Привет! Я по тебе скучала
            </CardTitle>
            <CardDescription className="text-center mt-1 text-pink-700">
              Войдите в свой аккаунт
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
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

                {error && (
                  <Alert
                    variant="destructive"
                    className="bg-red-50 border-red-200"
                  >
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
                  {isLoading ? "Вход..." : "Войти"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600">
              Впервые здесь?{" "}
              <Link
                href="/register"
                className="text-pink-600 hover:text-pink-700 font-semibold"
              >
                Создать аккаунт
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Иллюстрация */}
      </div>
      <img
        src="/diary_idle.png "
        className=" hidden md:block w-[500px] ml-[520px] "
      />
    </div>
  );
}

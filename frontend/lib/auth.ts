import api from "./axios";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50),
    full_name: z.string().optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/\d/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login: string | null;
}

export const authService = {
  async login(data: LoginInput) {
    const response = await api.post("/auth/login", data);
    return response.data;
  },

  async register(data: RegisterInput) {
    const { confirmPassword, ...registerData } = data;
    const response = await api.post("/auth/register", registerData);
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get("/auth/me");
    return response.data;
  },

  async logout() {
    await api.post("/auth/logout");
  },
};

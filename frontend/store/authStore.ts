import { create } from "zustand";
import { User, authService } from "@/lib/auth";
import api from "@/lib/axios";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      await authService.login({ email, password });
      const user = await authService.getCurrentUser();
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error("Login error:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data: any) => {
    set({ isLoading: true });
    try {
      await authService.register(data);
      set({ isLoading: false });
    } catch (error) {
      console.error("Register error:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
      set({ user: null, isAuthenticated: false, isLoading: false });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const user = await authService.getCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error("Check auth error:", error);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user });
  },
}));

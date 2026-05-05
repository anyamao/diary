import { create } from "zustand";
import { persist } from "zustand/middleware";
import { API_URL } from "@/lib/config";

interface User {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setAuthenticated: (value: boolean) => void;
  checkAuth: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setLoading: (isLoading) => set({ isLoading }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

      checkAuth: async () => {
        const token = localStorage.getItem("access_token");

        if (!token) {
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }

        set({ isLoading: true });

        try {
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const user = await response.json();
            set({ user, isAuthenticated: true, isLoading: false });
          } else {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } catch (error) {
          console.error("Check auth error:", error);
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      logout: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        set({ user: null, isAuthenticated: false, isLoading: false });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

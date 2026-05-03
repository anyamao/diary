import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, authService } from '@/lib/auth';

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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authService.login({ email, password });
          console.log('Login response:', response);
          
          // Fetch user data after successful login
          const user = await authService.getCurrentUser();
          console.log('User data:', user);
          
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
          
          return;
        } catch (error) {
          console.error('Login error:', error);
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
          console.error('Register error:', error);
          set({ isLoading: false });
          throw error;
        }
      },
      
      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
          set({ user: null, isAuthenticated: false, isLoading: false });
        } catch (error) {
          console.error('Logout error:', error);
          set({ isLoading: false });
          throw error;
        }
      },
      
      checkAuth: async () => {
        const token = localStorage.getItem('access_token');
        console.log('Checking auth, token exists:', !!token);
        
        if (!token) {
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }
        
        set({ isLoading: true });
        try {
          const user = await authService.getCurrentUser();
          console.log('checkAuth user:', user);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          console.error('checkAuth error:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },
      
      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

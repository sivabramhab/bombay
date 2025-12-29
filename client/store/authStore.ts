import { create } from 'zustand';
import { authService, User } from '@/lib/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; mobile: string }) => Promise<void>;
  verifyOTP: (mobile: string, otp: string) => Promise<void>;
  resendOTP: (mobile: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      const data = await authService.login({ email, password });
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    try {
      await authService.register(data);
    } catch (error) {
      throw error;
    }
  },

  verifyOTP: async (mobile: string, otp: string) => {
    try {
      const data = await authService.verifyOTP({ mobile, otp });
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      return data; // Return data for redirect logic
    } catch (error) {
      throw error;
    }
  },

  resendOTP: async (mobile: string) => {
    try {
      await authService.resendOTP(mobile);
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const user = await authService.getCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    }
  },
}));


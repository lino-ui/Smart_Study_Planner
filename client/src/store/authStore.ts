import { create } from 'zustand';
import Cookies from 'js-cookie';
import api from '../lib/axios';

export interface User {
  id: number;
  email: string;
  full_name: string;
  branch?: string;
  semester?: number;
  daily_study_hours: number;
  is_active: boolean;
  avatar_url?: string;
  bio?: string;
  preferred_study_time: string;
  break_duration_minutes: number;
  pomodoro_length_minutes: number;
  long_break_after: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: Cookies.get('token') || null,
  isAuthenticated: !!Cookies.get('token'),
  isLoading: true, // Start true until initial fetch
  login: (token: string, user: User) => {
    Cookies.set('token', token, { expires: 7 }); // 7 days
    set({ token, user, isAuthenticated: true });
  },
  logout: () => {
    Cookies.remove('token');
    set({ token: null, user: null, isAuthenticated: false });
  },
  fetchCurrentUser: async () => {
    const token = Cookies.get('token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, user: null });
      return;
    }
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      Cookies.remove('token');
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

// Listen for the unauthorized event from axios
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    useAuthStore.getState().logout();
  });
}

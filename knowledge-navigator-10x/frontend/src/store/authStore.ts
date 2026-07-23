import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import apiClient from '../api/client';

// ── Local demo users (work without backend) ─────────────────────────────────
const DEMO_USERS: Record<string, { password: string; name: string; role: string; id: string }> = {
  'admin@deutschebank.com':      { password: 'demo123', name: 'Admin User',        role: 'admin',             id: 'user-1' },
  'analyst@deutschebank.com':    { password: 'demo123', name: 'John Smith',         role: 'analyst',           id: 'user-2' },
  'manager@deutschebank.com':    { password: 'demo123', name: 'Sarah Johnson',      role: 'manager',           id: 'user-3' },
  'auditor@deutschebank.com':    { password: 'demo123', name: 'Michael Chen',       role: 'auditor',           id: 'user-4' },
  'compliance@deutschebank.com': { password: 'demo123', name: 'Emma Wilson',        role: 'compliance',        id: 'user-5' },
  'demo@demo.com':               { password: 'demo',    name: 'Demo User',          role: 'analyst',           id: 'user-6' },
  'demo@deutschebank.com':       { password: 'demo',    name: 'Demo User',          role: 'analyst',           id: 'user-7' },
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        // ── 1. Try local demo login first (always works, no backend needed) ──
        const normalizedEmail = email.trim().toLowerCase();
        const demoUser = DEMO_USERS[normalizedEmail];

        if (demoUser && demoUser.password === password.trim()) {
          const user: User = {
            id: demoUser.id,
            email: normalizedEmail,
            name: demoUser.name,
            role: demoUser.role,
            token: `demo-token-${demoUser.id}-${Date.now()}`,
          };
          localStorage.setItem('kn10x_token', user.token);
          set({ user, isAuthenticated: true, isLoading: false, error: null });
          return;
        }

        // ── 2. Try backend API login (if backend is running) ──────────────────
        try {
          const { data } = await apiClient.post('/api/auth/login', { email: normalizedEmail, password });
          const user: User = data;
          localStorage.setItem('kn10x_token', user.token);
          set({ user, isAuthenticated: true, isLoading: false, error: null });
        } catch (err: unknown) {
          const anyErr = err as { response?: { data?: { detail?: string } }; code?: string };

          // If backend is offline, give a helpful message
          if (anyErr?.code === 'ERR_NETWORK' || anyErr?.code === 'ECONNREFUSED') {
            set({
              isLoading: false,
              error: 'Invalid credentials. Use a demo account (e.g. demo@demo.com / demo)',
            });
          } else {
            set({
              isLoading: false,
              error: anyErr?.response?.data?.detail || 'Invalid email or password. Please try again.',
            });
          }
        }
      },

      logout: () => {
        localStorage.removeItem('kn10x_token');
        localStorage.removeItem('kn10x_user');
        set({ user: null, isAuthenticated: false, error: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'kn10x_auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

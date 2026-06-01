import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  masterPasswordVerified: boolean;
  masterPasswordVerifiedAt: number | null;

  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  updateUser: (user: Partial<User>) => void;
  setMasterPasswordVerified: (verified: boolean) => void;
  logout: () => void;
}

const MASTER_PASSWORD_SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      masterPasswordVerified: false,
      masterPasswordVerifiedAt: null,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),

      setMasterPasswordVerified: (verified) =>
        set({
          masterPasswordVerified: verified,
          masterPasswordVerifiedAt: verified ? Date.now() : null,
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          masterPasswordVerified: false,
          masterPasswordVerifiedAt: null,
        }),
    }),
    {
      name: 'svp-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

// Check if master password session is still valid
export function isMasterPasswordSessionValid(): boolean {
  const { masterPasswordVerified, masterPasswordVerifiedAt } = useAuthStore.getState();
  if (!masterPasswordVerified || !masterPasswordVerifiedAt) return false;
  return Date.now() - masterPasswordVerifiedAt < MASTER_PASSWORD_SESSION_DURATION;
}

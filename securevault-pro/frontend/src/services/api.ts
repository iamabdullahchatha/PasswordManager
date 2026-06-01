import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

// In dev: VITE_API_URL is unset → '/api/v1' is handled by the Vite proxy.
// In production (Vercel): set VITE_API_URL=https://your-backend.com in Vercel env vars.
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<{ resolve: (value: string) => void; reject: (reason: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else if (token) resolve(token);
  });
  refreshQueue = [];
}

// Auth routes that should NEVER trigger a refresh attempt
const PUBLIC_AUTH_URLS = ['/auth/login', '/auth/refresh', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];

// Auto-refresh access token on 401 — only when a refresh token actually exists
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const isPublicRoute = PUBLIC_AUTH_URLS.some((u) => originalRequest.url?.includes(u));
    const hasRefreshToken = !!useAuthStore.getState().refreshToken;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isPublicRoute &&
      hasRefreshToken                        // only attempt refresh when we actually have a token
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken!;
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const newAccessToken: string = data.data.accessToken;
        const newRefreshToken: string = data.data.refreshToken;

        useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For all other errors (public routes, no refresh token, non-401) — pass through as-is
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    // Strictly only accept strings — Vercel/proxies can return {code,message} objects
    // which would throw React Error #31 if rendered directly in JSX.
    const fromData =
      (typeof data?.message === 'string' ? data.message : null) ??
      (typeof data?.error   === 'string' ? data.error   : null) ??
      (typeof data?.detail  === 'string' ? data.detail  : null);

    return fromData ?? error.message ?? 'An unexpected error occurred';
  }
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

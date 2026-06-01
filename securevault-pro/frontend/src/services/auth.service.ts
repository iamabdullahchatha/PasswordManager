import { api } from './api';
import type { ApiResponse, AuthTokens } from '../types';

export interface RegisterDto {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const authService = {
  register: (dto: RegisterDto) =>
    api.post<ApiResponse<{ id: string; email: string; username: string }>>('/auth/register', dto).then((r) => r.data),

  login: (email: string, password: string, rememberMe = false) =>
    api.post<ApiResponse<AuthTokens>>('/auth/login', { email, password, rememberMe }).then((r) => r.data),

  logout: (refreshToken: string) =>
    api.post<ApiResponse>('/auth/logout', { refreshToken }).then((r) => r.data),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<AuthTokens>>('/auth/refresh', { refreshToken }).then((r) => r.data),

  me: () =>
    api.get<ApiResponse>('/auth/me').then((r) => r.data),

  forgotPassword: (email: string) =>
    api.post<ApiResponse>('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (token: string, password: string, confirmPassword: string) =>
    api.post<ApiResponse>('/auth/reset-password', { token, password, confirmPassword }).then((r) => r.data),

  setMasterPassword: (masterPassword: string, confirmMasterPassword: string) =>
    api.post<ApiResponse>('/auth/master-password/set', { masterPassword, confirmMasterPassword }).then((r) => r.data),

  verifyMasterPassword: (masterPassword: string) =>
    api.post<ApiResponse<{ verified: boolean }>>('/auth/master-password/verify', { masterPassword }).then((r) => r.data),
};

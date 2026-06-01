import { api } from './api';
import type { ApiResponse, User, Role } from '../types';

export interface CreateUserDto {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  role?: Role;
}

export interface UpdateUserDto {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
  role?: Role;
}

export const usersService = {
  list: (params?: Record<string, string>) =>
    api.get<ApiResponse<User[]>>('/users', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<ApiResponse<User>>(`/users/${id}`).then((r) => r.data),

  create: (dto: CreateUserDto) =>
    api.post<ApiResponse<User>>('/users', dto).then((r) => r.data),

  update: (id: string, dto: UpdateUserDto) =>
    api.put<ApiResponse<User>>(`/users/${id}`, dto).then((r) => r.data),

  toggleStatus: (id: string) =>
    api.patch<ApiResponse<User>>(`/users/${id}/toggle-status`).then((r) => r.data),

  delete: (id: string) =>
    api.delete<ApiResponse>(`/users/${id}`).then((r) => r.data),

  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) =>
    api.post<ApiResponse>('/users/me/change-password', { currentPassword, newPassword, confirmPassword }).then((r) => r.data),
};

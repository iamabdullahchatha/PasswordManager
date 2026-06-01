import { api } from './api';
import type { ApiResponse, DashboardStats, ExpenseTrend } from '../types';

export const dashboardService = {
  getStats: () =>
    api.get<ApiResponse<DashboardStats>>('/dashboard/stats').then((r) => r.data),

  getExpenseTrend: (months = 6) =>
    api.get<ApiResponse<ExpenseTrend[]>>('/dashboard/expense-trend', { params: { months } }).then((r) => r.data),
};

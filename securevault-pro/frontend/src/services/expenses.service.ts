import { api } from './api';
import type { ApiResponse, Expense, ExpenseCategory, PaymentMethod, ExpenseStatus, Budget } from '../types';

export interface CreateExpenseDto {
  title: string;
  amount: number;
  currency?: string;
  category?: ExpenseCategory;
  customCategory?: string | null;
  paymentMethod?: PaymentMethod;
  status?: ExpenseStatus;
  date: string;
  vendor?: string | null;
  description?: string | null;
  notes?: string | null;
  isRecurring?: boolean;
  recurringPeriod?: string | null;
  tags?: string[];
}

export interface ListExpensesParams {
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
  paymentMethod?: string;
  status?: string;
  month?: string;
  year?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: string;
  maxAmount?: string;
  sortBy?: string;
  sortOrder?: string;
  isRecurring?: string;
}

export interface BudgetDto {
  category?: ExpenseCategory | null;
  amount: number;
  currency?: string;
  month: number;
  year: number;
}

export const expensesService = {
  // ── CRUD ──────────────────────────────────────────────────────────────────
  list: (params?: ListExpensesParams) =>
    api.get<ApiResponse<Expense[]>>('/expenses', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<ApiResponse<Expense>>(`/expenses/${id}`).then((r) => r.data),

  create: (dto: CreateExpenseDto) =>
    api.post<ApiResponse<Expense>>('/expenses', dto).then((r) => r.data),

  update: (id: string, dto: Partial<CreateExpenseDto>) =>
    api.patch<ApiResponse<Expense>>(`/expenses/${id}`, dto).then((r) => r.data),

  delete: (id: string) =>
    api.delete<ApiResponse>(`/expenses/${id}`).then((r) => r.data),

  // ── Reports ───────────────────────────────────────────────────────────────
  getMonthly: (year: number, month: number) =>
    api.get<ApiResponse>(`/expenses/monthly/${year}/${month}`).then((r) => r.data),

  getYearly: (year: number) =>
    api.get<ApiResponse>(`/expenses/yearly/${year}`).then((r) => r.data),

  getSummary: () =>
    api.get<ApiResponse>('/expenses/summary').then((r) => r.data),

  compareMonths: (y1: number, m1: number, y2: number, m2: number) =>
    api.get<ApiResponse>('/expenses/compare/months', { params: { y1, m1, y2, m2 } }).then((r) => r.data),

  compareYears: (year1: number, year2: number) =>
    api.get<ApiResponse>('/expenses/compare/years', { params: { year1, year2 } }).then((r) => r.data),

  // ── Budget ────────────────────────────────────────────────────────────────
  getBudgets: (month?: number, year?: number) =>
    api.get<ApiResponse<Budget[]>>('/expenses/budgets', { params: { month, year } }).then((r) => r.data),

  setBudget: (dto: BudgetDto) =>
    api.post<ApiResponse<Budget>>('/expenses/budgets', dto).then((r) => r.data),

  deleteBudget: (id: string) =>
    api.delete<ApiResponse>(`/expenses/budgets/${id}`).then((r) => r.data),

  // ── Export / Import ───────────────────────────────────────────────────────
  exportCsv: (params?: Record<string, string>) =>
    api.get('/expenses/export/csv', { params, responseType: 'blob' }).then((r) => r.data as Blob),

  importExpenses: (expenses: Partial<CreateExpenseDto>[]) =>
    api.post<ApiResponse<{ imported: number }>>('/expenses/import', { expenses }).then((r) => r.data),
};

// ── Reports service ───────────────────────────────────────────────────────────

export const reportsService = {
  monthly: (year: number, month: number) =>
    api.get<ApiResponse>(`/reports/monthly/${year}/${month}`).then((r) => r.data),

  yearly: (year: number) =>
    api.get<ApiResponse>(`/reports/yearly/${year}`).then((r) => r.data),

  category: (year?: number) =>
    api.get<ApiResponse>('/reports/category', { params: { year } }).then((r) => r.data),

  paymentMethod: (year?: number) =>
    api.get<ApiResponse>('/reports/payment-method', { params: { year } }).then((r) => r.data),

  budget: (month?: number, year?: number) =>
    api.get<ApiResponse>('/reports/budget', { params: { month, year } }).then((r) => r.data),

  compareMonths: (y1: number, m1: number, y2: number, m2: number) =>
    api.get<ApiResponse>('/reports/compare/months', { params: { y1, m1, y2, m2 } }).then((r) => r.data),

  compareYears: (year1: number, year2: number) =>
    api.get<ApiResponse>('/reports/compare/years', { params: { year1, year2 } }).then((r) => r.data),
};

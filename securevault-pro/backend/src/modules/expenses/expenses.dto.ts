import { z } from 'zod';
import { ExpenseCategory, PaymentMethod, ExpenseStatus } from '@prisma/client';

export const createExpenseSchema = z.object({
  title:           z.string().min(1).max(200).trim(),
  amount:          z.number().positive('Amount must be positive').multipleOf(0.01),
  currency:        z.string().length(3).optional().default('USD'),
  category:        z.nativeEnum(ExpenseCategory).default(ExpenseCategory.OTHER),
  customCategory:  z.string().max(100).optional().nullable(),
  paymentMethod:   z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
  status:          z.nativeEnum(ExpenseStatus).default(ExpenseStatus.PAID),
  date:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  vendor:          z.string().max(200).optional().nullable(),
  description:     z.string().max(1000).optional().nullable(),
  notes:           z.string().max(2000).optional().nullable(),
  receiptPath:     z.string().optional().nullable(),
  isRecurring:     z.boolean().optional().default(false),
  recurringPeriod: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional().nullable(),
  tags:            z.array(z.string().max(30)).max(10).optional().default([]),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const listExpensesQuerySchema = z.object({
  page:          z.string().optional().default('1'),
  limit:         z.string().optional().default('20'),
  search:        z.string().optional(),
  category:      z.nativeEnum(ExpenseCategory).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  status:        z.nativeEnum(ExpenseStatus).optional(),
  startDate:     z.string().optional(),
  endDate:       z.string().optional(),
  month:         z.string().optional(),
  year:          z.string().optional(),
  minAmount:     z.string().optional(),
  maxAmount:     z.string().optional(),
  sortBy:        z.enum(['date', 'amount', 'title', 'createdAt']).optional().default('date'),
  sortOrder:     z.enum(['asc', 'desc']).optional().default('desc'),
  isRecurring:   z.string().optional(),
});

export const budgetSchema = z.object({
  category: z.nativeEnum(ExpenseCategory).optional().nullable(),
  amount:   z.number().positive(),
  currency: z.string().length(3).optional().default('USD'),
  month:    z.number().int().min(1).max(12),
  year:     z.number().int().min(2000).max(2100),
});

export const importExpensesSchema = z.object({
  expenses: z.array(z.object({
    title:           z.string().min(1).max(200),
    amount:          z.number().positive(),
    currency:        z.string().length(3).optional().default('USD'),
    category:        z.nativeEnum(ExpenseCategory).optional().default(ExpenseCategory.OTHER),
    paymentMethod:   z.nativeEnum(PaymentMethod).optional().default(PaymentMethod.CASH),
    status:          z.nativeEnum(ExpenseStatus).optional().default(ExpenseStatus.PAID),
    date:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    vendor:          z.string().optional().nullable(),
    description:     z.string().optional().nullable(),
    notes:           z.string().optional().nullable(),
    isRecurring:     z.boolean().optional().default(false),
    recurringPeriod: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional().nullable(),
    tags:            z.array(z.string()).optional().default([]),
  })).min(1).max(500),
});

export type CreateExpenseDto     = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseDto     = z.infer<typeof updateExpenseSchema>;
export type ListExpensesQuery    = z.infer<typeof listExpensesQuerySchema>;
export type BudgetDto            = z.infer<typeof budgetSchema>;
export type ImportExpensesDto    = z.infer<typeof importExpensesSchema>;

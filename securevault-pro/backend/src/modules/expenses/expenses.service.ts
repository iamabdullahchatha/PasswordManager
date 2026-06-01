import { prisma } from '../../config/database';
import { AppError } from '../../utils/AppError';
import { buildPaginationMeta } from '../../utils/response';
import { createActivityLog } from '../../middleware/activityLogger.middleware';
import type { CreateExpenseDto, UpdateExpenseDto, ListExpensesQuery, BudgetDto, ImportExpensesDto } from './expenses.dto';
import { Prisma, ExpenseCategory, PaymentMethod, ExpenseStatus } from '@prisma/client';

function extractMonthYear(dateStr: string): { month: number; year: number } {
  const d = new Date(dateStr);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

export class ExpensesService {
  // ─── CRUD ──────────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateExpenseDto) {
    const { month, year } = extractMonthYear(dto.date);

    const expense = await prisma.expense.create({
      data: {
        userId,
        title:           dto.title,
        amount:          dto.amount,
        currency:        dto.currency ?? 'USD',
        category:        dto.category,
        customCategory:  dto.customCategory,
        paymentMethod:   dto.paymentMethod,
        status:          dto.status,
        date:            new Date(dto.date),
        month,
        year,
        vendor:          dto.vendor,
        description:     dto.description,
        notes:           dto.notes,
        receiptPath:     dto.receiptPath,
        isRecurring:     dto.isRecurring ?? false,
        recurringPeriod: dto.recurringPeriod,
        tags:            dto.tags ?? [],
      },
    });

    await createActivityLog({ userId, action: 'EXPENSE_CREATE', resource: 'Expense', resourceId: expense.id });
    return expense;
  }

  async list(userId: string, query: ListExpensesQuery) {
    const page  = parseInt(query.page, 10);
    const limit = parseInt(query.limit, 10);
    const skip  = (page - 1) * limit;

    const where: Prisma.ExpenseWhereInput = { userId };

    if (query.search) {
      where.OR = [
        { title:       { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { vendor:      { contains: query.search, mode: 'insensitive' } },
        { notes:       { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.category)      where.category      = query.category as ExpenseCategory;
    if (query.paymentMethod) where.paymentMethod = query.paymentMethod as PaymentMethod;
    if (query.status)        where.status        = query.status as ExpenseStatus;
    if (query.isRecurring !== undefined) where.isRecurring = query.isRecurring === 'true';

    if (query.month) where.month = parseInt(query.month, 10);
    if (query.year)  where.year  = parseInt(query.year, 10);

    if (query.startDate || query.endDate) {
      where.date = {
        ...(query.startDate && { gte: new Date(query.startDate) }),
        ...(query.endDate   && { lte: new Date(query.endDate) }),
      };
    }

    if (query.minAmount || query.maxAmount) {
      where.amount = {
        ...(query.minAmount && { gte: parseFloat(query.minAmount) }),
        ...(query.maxAmount && { lte: parseFloat(query.maxAmount) }),
      };
    }

    const [expenses, total] = await prisma.$transaction([
      prisma.expense.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { [query.sortBy]: query.sortOrder },
      }),
      prisma.expense.count({ where }),
    ]);

    return { expenses, meta: buildPaginationMeta(total, page, limit) };
  }

  async getById(id: string, userId: string) {
    const expense = await prisma.expense.findFirst({ where: { id, userId } });
    if (!expense) throw new AppError('Expense not found', 404, 'EXPENSE_NOT_FOUND');
    return expense;
  }

  async update(id: string, userId: string, dto: UpdateExpenseDto) {
    await this.getById(id, userId);

    const extra: Record<string, unknown> = {};
    if (dto.date) {
      const { month, year } = extractMonthYear(dto.date);
      extra.month = month;
      extra.year  = year;
      extra.date  = new Date(dto.date);
    }

    const updated = await prisma.expense.update({
      where: { id },
      data:  { ...dto, ...extra },
    });

    await createActivityLog({ userId, action: 'EXPENSE_UPDATE', resource: 'Expense', resourceId: id });
    return updated;
  }

  async delete(id: string, userId: string) {
    await this.getById(id, userId);
    await prisma.expense.delete({ where: { id } });
    await createActivityLog({ userId, action: 'EXPENSE_DELETE', resource: 'Expense', resourceId: id });
  }

  // ─── Monthly / Yearly ─────────────────────────────────────────────────────

  async getMonthly(userId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 0, 23, 59, 59);

    const expenses = await prisma.expense.findMany({
      where:   { userId, date: { gte: start, lte: end } },
      orderBy: { date: 'desc' },
    });

    const total   = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const paid    = expenses.filter((e) => e.status === 'PAID').reduce((s, e) => s + Number(e.amount), 0);
    const pending = expenses.filter((e) => e.status === 'PENDING').reduce((s, e) => s + Number(e.amount), 0);

    const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount);
      return acc;
    }, {});

    const byPaymentMethod = expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.paymentMethod] = (acc[e.paymentMethod] ?? 0) + Number(e.amount);
      return acc;
    }, {});

    const byDay = expenses.reduce<Record<number, number>>((acc, e) => {
      const day = new Date(e.date).getDate();
      acc[day] = (acc[day] ?? 0) + Number(e.amount);
      return acc;
    }, {});

    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyAvg    = total / daysInMonth;

    const highest = expenses.reduce((max, e) => Number(e.amount) > Number(max?.amount ?? 0) ? e : max, expenses[0] ?? null);
    const lowest  = expenses.length > 0
      ? expenses.reduce((min, e) => Number(e.amount) < Number(min?.amount ?? Infinity) ? e : min, expenses[0])
      : null;

    return { expenses, total, paid, pending, byCategory, byPaymentMethod, byDay, dailyAvg, year, month, highest, lowest };
  }

  async getYearly(userId: string, year: number) {
    const start = new Date(year, 0, 1);
    const end   = new Date(year, 11, 31, 23, 59, 59);

    const expenses = await prisma.expense.findMany({
      where:   { userId, date: { gte: start, lte: end } },
      orderBy: { date: 'asc' },
    });

    const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

    const byMonth = Array.from({ length: 12 }, (_, i) => {
      const monthExpenses = expenses.filter((e) => new Date(e.date).getMonth() === i);
      return {
        month: i + 1,
        total: monthExpenses.reduce((s, e) => s + Number(e.amount), 0),
        count: monthExpenses.length,
      };
    });

    const byCategory = expenses.reduce<Record<string, { total: number; count: number; percentage: number }>>((acc, e) => {
      if (!acc[e.category]) acc[e.category] = { total: 0, count: 0, percentage: 0 };
      acc[e.category].total += Number(e.amount);
      acc[e.category].count++;
      return acc;
    }, {});

    if (total > 0) {
      Object.values(byCategory).forEach((c) => {
        c.percentage = Math.round((c.total / total) * 10000) / 100;
      });
    }

    const byPaymentMethod = expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.paymentMethod] = (acc[e.paymentMethod] ?? 0) + Number(e.amount);
      return acc;
    }, {});

    const highestMonth = byMonth.reduce((m, c) => (c.total > m.total ? c : m), byMonth[0]);
    const lowestMonth  = byMonth.filter((m) => m.count > 0).reduce((m, c) => (c.total < m.total ? c : m), byMonth.find((m) => m.count > 0) ?? byMonth[0]);

    return { expenses, total, byMonth, byCategory, byPaymentMethod, highestMonth, lowestMonth, year };
  }

  // ─── Summary / Dashboard ──────────────────────────────────────────────────

  async getSummary(userId: string) {
    const now           = new Date();
    const curMonth      = now.getMonth() + 1;
    const curYear       = now.getFullYear();
    const startOfMonth  = new Date(curYear, curMonth - 1, 1);
    const startOfYear   = new Date(curYear, 0, 1);
    const prevMonthStart = curMonth === 1
      ? new Date(curYear - 1, 11, 1)
      : new Date(curYear, curMonth - 2, 1);
    const prevMonthEnd  = new Date(curYear, curMonth - 1, 0, 23, 59, 59);

    const [
      monthlyAgg,
      yearlyAgg,
      prevMonthAgg,
      pendingAgg,
      recurringCount,
      recentExpenses,
      highestThisMonth,
      categoryThisMonth,
    ] = await prisma.$transaction([
      prisma.expense.aggregate({
        where:  { userId, date: { gte: startOfMonth } },
        _sum:   { amount: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where:  { userId, date: { gte: startOfYear } },
        _sum:   { amount: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where:  { userId, date: { gte: prevMonthStart, lte: prevMonthEnd } },
        _sum:   { amount: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where:  { userId, status: 'PENDING' },
        _sum:   { amount: true },
        _count: true,
      }),
      prisma.expense.count({
        where: { userId, isRecurring: true },
      }),
      prisma.expense.findMany({
        where:   { userId },
        orderBy: { date: 'desc' },
        take:    5,
      }),
      prisma.expense.findFirst({
        where:   { userId, date: { gte: startOfMonth } },
        orderBy: { amount: 'desc' },
      }),
      prisma.expense.groupBy({
        by:     ['category'],
        where:  { userId, date: { gte: startOfMonth } },
        _sum:   { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take:   1,
      }),
    ]);

    const monthlyTotal   = Number(monthlyAgg._sum.amount ?? 0);
    const yearlyTotal    = Number(yearlyAgg._sum.amount  ?? 0);
    const prevMonthTotal = Number(prevMonthAgg._sum.amount ?? 0);
    const growthPct      = prevMonthTotal > 0
      ? Math.round(((monthlyTotal - prevMonthTotal) / prevMonthTotal) * 10000) / 100
      : 0;

    const daysElapsed = now.getDate();
    const dailyAvg    = daysElapsed > 0 ? monthlyTotal / daysElapsed : 0;

    const budgets = await prisma.budget.findMany({
      where: { userId, month: curMonth, year: curYear },
    });
    const overallBudget = budgets.find((b) => b.category === null);
    const remaining     = overallBudget ? Number(overallBudget.amount) - monthlyTotal : null;

    return {
      monthly:     { total: monthlyTotal,   count: monthlyAgg._count },
      yearly:      { total: yearlyTotal,    count: yearlyAgg._count },
      prevMonth:   { total: prevMonthTotal, count: prevMonthAgg._count },
      pending:     { total: Number(pendingAgg._sum.amount ?? 0), count: pendingAgg._count },
      growthPct,
      dailyAvg,
      recurringCount,
      recentExpenses,
      highestThisMonth,
      topCategoryThisMonth: categoryThisMonth[0]?.category ?? null,
      budgets,
      remaining,
    };
  }

  // ─── Compare ──────────────────────────────────────────────────────────────

  async compareMonths(userId: string, y1: number, m1: number, y2: number, m2: number) {
    const [a, b] = await Promise.all([
      this.getMonthly(userId, y1, m1),
      this.getMonthly(userId, y2, m2),
    ]);
    const change = b.total > 0 ? ((a.total - b.total) / b.total) * 100 : 0;
    return { current: a, previous: b, changePercent: Math.round(change * 100) / 100 };
  }

  async compareYears(userId: string, year1: number, year2: number) {
    const [a, b] = await Promise.all([
      this.getYearly(userId, year1),
      this.getYearly(userId, year2),
    ]);
    const change = b.total > 0 ? ((a.total - b.total) / b.total) * 100 : 0;
    return { year1: a, year2: b, changePercent: Math.round(change * 100) / 100 };
  }

  // ─── Budget ───────────────────────────────────────────────────────────────

  async getBudgets(userId: string, month: number, year: number) {
    const budgets = await prisma.budget.findMany({
      where: { userId, month, year },
    });

    const expenses = await prisma.expense.findMany({
      where: { userId, month, year, status: { not: 'CANCELLED' } },
    });

    const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0);

    const result = budgets.map((b) => {
      const spent = b.category
        ? expenses.filter((e) => e.category === b.category).reduce((s, e) => s + Number(e.amount), 0)
        : totalSpent;
      const budgetAmount = Number(b.amount);
      const remaining    = budgetAmount - spent;
      const usedPct      = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 10000) / 100 : 0;
      return { ...b, spent, remaining, usedPct };
    });

    return result;
  }

  async setBudget(userId: string, dto: BudgetDto) {
    const category = dto.category ?? null;
    const existing = await prisma.budget.findFirst({
      where: { userId, category, month: dto.month, year: dto.year },
    });

    const budget = existing
      ? await prisma.budget.update({
          where:  { id: existing.id },
          data:   { amount: dto.amount, currency: dto.currency ?? 'USD' },
        })
      : await prisma.budget.create({
          data: { userId, category, amount: dto.amount, currency: dto.currency ?? 'USD', month: dto.month, year: dto.year },
        });

    await createActivityLog({ userId, action: 'BUDGET_CREATE', resource: 'Budget', resourceId: budget.id });
    return budget;
  }

  async deleteBudget(id: string, userId: string) {
    const b = await prisma.budget.findFirst({ where: { id, userId } });
    if (!b) throw new AppError('Budget not found', 404, 'BUDGET_NOT_FOUND');
    await prisma.budget.delete({ where: { id } });
    await createActivityLog({ userId, action: 'BUDGET_DELETE', resource: 'Budget', resourceId: id });
  }

  // ─── Export / Import ──────────────────────────────────────────────────────

  async exportCsv(userId: string, query: Partial<ListExpensesQuery>): Promise<string> {
    const where: Prisma.ExpenseWhereInput = { userId };
    if (query.year)     where.year  = parseInt(query.year, 10);
    if (query.month)    where.month = parseInt(query.month, 10);
    if (query.category) where.category = query.category as ExpenseCategory;
    if (query.status)   where.status   = query.status   as ExpenseStatus;

    const expenses = await prisma.expense.findMany({ where, orderBy: { date: 'desc' } });

    const headers = [
      'title', 'amount', 'currency', 'category', 'customCategory',
      'paymentMethod', 'status', 'date', 'vendor', 'description', 'notes',
      'isRecurring', 'recurringPeriod', 'tags',
    ];

    const escape = (v: unknown) => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const rows = expenses.map((e) => [
      escape(e.title),
      escape(Number(e.amount).toFixed(2)),
      escape(e.currency),
      escape(e.category),
      escape(e.customCategory ?? ''),
      escape(e.paymentMethod),
      escape(e.status),
      escape(new Date(e.date).toISOString().split('T')[0]),
      escape(e.vendor ?? ''),
      escape(e.description ?? ''),
      escape(e.notes ?? ''),
      escape(e.isRecurring),
      escape(e.recurringPeriod ?? ''),
      escape(e.tags.join(';')),
    ].join(','));

    await createActivityLog({ userId, action: 'EXPENSE_EXPORT', resource: 'Expense' });
    return [headers.join(','), ...rows].join('\n');
  }

  async importCsv(userId: string, dto: ImportExpensesDto) {
    const data = dto.expenses.map((e) => {
      const { month, year } = extractMonthYear(e.date);
      return {
        userId,
        title:           e.title,
        amount:          e.amount,
        currency:        e.currency ?? 'USD',
        category:        e.category ?? 'OTHER' as ExpenseCategory,
        paymentMethod:   e.paymentMethod ?? 'CASH' as PaymentMethod,
        status:          e.status ?? 'PAID' as ExpenseStatus,
        date:            new Date(e.date),
        month,
        year,
        vendor:          e.vendor,
        description:     e.description,
        notes:           e.notes,
        isRecurring:     e.isRecurring ?? false,
        recurringPeriod: e.recurringPeriod,
        tags:            e.tags ?? [],
      };
    });

    const result = await prisma.expense.createMany({ data });
    await createActivityLog({ userId, action: 'EXPENSE_IMPORT', resource: 'Expense' });
    return { imported: result.count };
  }
}

export const expensesService = new ExpensesService();

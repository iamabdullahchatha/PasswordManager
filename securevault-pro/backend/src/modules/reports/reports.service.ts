import { prisma } from '../../config/database';
import { Role, ExpenseCategory, PaymentMethod } from '@prisma/client';
import { Prisma } from '@prisma/client';

export class ReportsService {
  private buildWhere(userId: string, role: Role, extra: Prisma.ExpenseWhereInput = {}): Prisma.ExpenseWhereInput {
    return role === Role.USER ? { userId, ...extra } : extra;
  }

  async getMonthlyReport(userId: string, year: number, month: number, role: Role) {
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 0, 23, 59, 59);
    const where = this.buildWhere(userId, role, { date: { gte: start, lte: end } });

    const expenses = await prisma.expense.findMany({ where, orderBy: { date: 'asc' } });

    const total   = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const count   = expenses.length;
    const average = count > 0 ? total / count : 0;
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyAvg    = total / daysInMonth;

    const byCategory = expenses.reduce<Record<string, { total: number; count: number; percentage: number }>>((acc, e) => {
      if (!acc[e.category]) acc[e.category] = { total: 0, count: 0, percentage: 0 };
      acc[e.category].total += Number(e.amount);
      acc[e.category].count++;
      return acc;
    }, {});

    if (total > 0) {
      Object.values(byCategory).forEach((c) => { c.percentage = (c.total / total) * 100; });
    }

    const byPaymentMethod = expenses.reduce<Record<string, { total: number; count: number }>>((acc, e) => {
      if (!acc[e.paymentMethod]) acc[e.paymentMethod] = { total: 0, count: 0 };
      acc[e.paymentMethod].total += Number(e.amount);
      acc[e.paymentMethod].count++;
      return acc;
    }, {});

    const byDay = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const amt = expenses.filter((e) => new Date(e.date).getDate() === day).reduce((s, e) => s + Number(e.amount), 0);
      return { day, amount: amt };
    });

    const byStatus = expenses.reduce<Record<string, { total: number; count: number }>>((acc, e) => {
      if (!acc[e.status]) acc[e.status] = { total: 0, count: 0 };
      acc[e.status].total += Number(e.amount);
      acc[e.status].count++;
      return acc;
    }, {});

    const topExpenses = [...expenses]
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 10);

    const highest = expenses.length > 0 ? expenses.reduce((m, e) => Number(e.amount) > Number(m.amount) ? e : m, expenses[0]) : null;
    const lowest  = expenses.length > 0 ? expenses.reduce((m, e) => Number(e.amount) < Number(m.amount) ? e : m, expenses[0]) : null;

    const topCategory    = Object.entries(byCategory).sort(([, a], [, b]) => b.total - a.total)[0];
    const bottomCategory = Object.entries(byCategory).sort(([, a], [, b]) => a.total - b.total)[0];

    return {
      year, month, total, count, average, dailyAvg,
      byCategory, byPaymentMethod, byDay, byStatus,
      topExpenses, highest, lowest, topCategory, bottomCategory,
    };
  }

  async getYearlyReport(userId: string, year: number, role: Role) {
    const start = new Date(year, 0, 1);
    const end   = new Date(year, 11, 31, 23, 59, 59);
    const where = this.buildWhere(userId, role, { date: { gte: start, lte: end } });

    const expenses = await prisma.expense.findMany({ where, orderBy: { date: 'asc' } });

    const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

    const byMonth = Array.from({ length: 12 }, (_, i) => {
      const me = expenses.filter((e) => new Date(e.date).getMonth() === i);
      return { month: i + 1, total: me.reduce((s, e) => s + Number(e.amount), 0), count: me.length };
    });

    const byCategory = expenses.reduce<Record<string, { total: number; count: number; percentage: number }>>((acc, e) => {
      if (!acc[e.category]) acc[e.category] = { total: 0, count: 0, percentage: 0 };
      acc[e.category].total += Number(e.amount);
      acc[e.category].count++;
      return acc;
    }, {});

    if (total > 0) {
      Object.values(byCategory).forEach((c) => { c.percentage = Math.round((c.total / total) * 10000) / 100; });
    }

    const byPaymentMethod = expenses.reduce<Record<string, { total: number; count: number }>>((acc, e) => {
      if (!acc[e.paymentMethod]) acc[e.paymentMethod] = { total: 0, count: 0 };
      acc[e.paymentMethod].total += Number(e.amount);
      acc[e.paymentMethod].count++;
      return acc;
    }, {});

    const highestMonth = byMonth.reduce((m, c) => (c.total > m.total ? c : m), byMonth[0]);
    const lowestMonth  = byMonth.filter((m) => m.count > 0).reduce((m, c) => (c.total < m.total ? c : m), byMonth.find((m) => m.count > 0) ?? byMonth[0]);
    const monthlyAvg   = total / 12;

    return { year, total, byMonth, byCategory, byPaymentMethod, highestMonth, lowestMonth, monthlyAvg };
  }

  async getCategoryReport(userId: string, year: number, role: Role) {
    const start = new Date(year, 0, 1);
    const end   = new Date(year, 11, 31, 23, 59, 59);
    const where = this.buildWhere(userId, role, { date: { gte: start, lte: end } });

    const expenses = await prisma.expense.findMany({ where });
    const total    = expenses.reduce((s, e) => s + Number(e.amount), 0);

    const byCategory = expenses.reduce<Record<string, { total: number; count: number; percentage: number; months: Record<number, number> }>>((acc, e) => {
      if (!acc[e.category]) acc[e.category] = { total: 0, count: 0, percentage: 0, months: {} };
      acc[e.category].total += Number(e.amount);
      acc[e.category].count++;
      const m = new Date(e.date).getMonth() + 1;
      acc[e.category].months[m] = (acc[e.category].months[m] ?? 0) + Number(e.amount);
      return acc;
    }, {});

    if (total > 0) {
      Object.values(byCategory).forEach((c) => { c.percentage = Math.round((c.total / total) * 10000) / 100; });
    }

    return { year, total, byCategory };
  }

  async getPaymentMethodReport(userId: string, year: number, role: Role) {
    const start = new Date(year, 0, 1);
    const end   = new Date(year, 11, 31, 23, 59, 59);
    const where = this.buildWhere(userId, role, { date: { gte: start, lte: end } });

    const expenses = await prisma.expense.findMany({ where });
    const total    = expenses.reduce((s, e) => s + Number(e.amount), 0);

    const byMethod = expenses.reduce<Record<string, { total: number; count: number; percentage: number }>>((acc, e) => {
      if (!acc[e.paymentMethod]) acc[e.paymentMethod] = { total: 0, count: 0, percentage: 0 };
      acc[e.paymentMethod].total += Number(e.amount);
      acc[e.paymentMethod].count++;
      return acc;
    }, {});

    if (total > 0) {
      Object.values(byMethod).forEach((m) => { m.percentage = Math.round((m.total / total) * 10000) / 100; });
    }

    return { year, total, byMethod };
  }

  async getBudgetReport(userId: string, month: number, year: number) {
    const budgets = await prisma.budget.findMany({ where: { userId, month, year } });

    const expenses = await prisma.expense.findMany({
      where: { userId, month, year, status: { not: 'CANCELLED' } },
    });

    const totalSpent  = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const totalBudget = budgets.reduce((s, b) => s + Number(b.amount), 0);

    const categories = budgets.map((b) => {
      const spent = b.category
        ? expenses.filter((e) => e.category === b.category).reduce((s, e) => s + Number(e.amount), 0)
        : totalSpent;
      const budgetAmt = Number(b.amount);
      return {
        ...b,
        spent,
        remaining: budgetAmt - spent,
        usedPct:   budgetAmt > 0 ? (spent / budgetAmt) * 100 : 0,
        isOver:    spent > budgetAmt,
      };
    });

    return { month, year, totalBudget, totalSpent, remaining: totalBudget - totalSpent, categories };
  }

  async compareMonths(userId: string, y1: number, m1: number, y2: number, m2: number, role: Role) {
    const [a, b] = await Promise.all([
      this.getMonthlyReport(userId, y1, m1, role),
      this.getMonthlyReport(userId, y2, m2, role),
    ]);
    const change = b.total > 0 ? ((a.total - b.total) / b.total) * 100 : 0;
    return { current: a, previous: b, changePercent: Math.round(change * 100) / 100 };
  }

  async compareYears(userId: string, year1: number, year2: number, role: Role) {
    const [r1, r2] = await Promise.all([
      this.getYearlyReport(userId, year1, role),
      this.getYearlyReport(userId, year2, role),
    ]);
    const change = r2.total > 0 ? ((r1.total - r2.total) / r2.total) * 100 : 0;
    return { year1: r1, year2: r2, changePercent: Math.round(change * 100) / 100 };
  }
}

export const reportsService = new ReportsService();

import { prisma } from '../../config/database';
import { Role } from '@prisma/client';

export class DashboardService {
  async getStats(userId: string, role: Role) {
    const isAdmin = role !== Role.USER;
    const expenseWhere = isAdmin ? {} : { userId };
    const vaultWhere = isAdmin ? {} : { userId };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      totalUsers,
      activeUsers,
      totalVaultEntries,
      totalExpenses,
      monthlyExpenseSum,
      lastMonthExpenseSum,
      yearlyExpenseSum,
      recentLogs,
      weakPasswords,
      expiringSoon,
    ] = await prisma.$transaction([
      prisma.user.count(isAdmin ? undefined : { where: { id: userId } }),
      prisma.user.count({ where: isAdmin ? { isActive: true } : { id: userId } }),
      prisma.vaultEntry.count({ where: vaultWhere }),
      prisma.expense.count({ where: expenseWhere }),
      prisma.expense.aggregate({
        where: { ...expenseWhere, date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { ...expenseWhere, date: { gte: lastMonth, lte: endOfLastMonth } },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { ...expenseWhere, date: { gte: startOfYear } },
        _sum: { amount: true },
      }),
      prisma.activityLog.findMany({
        where: isAdmin ? {} : { userId },
        include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.vaultEntry.count({
        where: { ...vaultWhere, passwordStrength: { lt: 40 } },
      }),
      prisma.vaultEntry.count({
        where: {
          ...vaultWhere,
          expiresAt: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), gt: new Date() },
        },
      }),
    ]);

    const currentMonthTotal = Number(monthlyExpenseSum._sum.amount ?? 0);
    const lastMonthTotal = Number(lastMonthExpenseSum._sum.amount ?? 0);
    const monthOverMonthChange =
      lastMonthTotal > 0
        ? Math.round(((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 10000) / 100
        : 0;

    return {
      users: { total: totalUsers, active: activeUsers },
      vault: {
        total: totalVaultEntries,
        weakPasswords,
        expiringSoon,
      },
      expenses: {
        total: totalExpenses,
        currentMonth: currentMonthTotal,
        lastMonth: lastMonthTotal,
        yearToDate: Number(yearlyExpenseSum._sum.amount ?? 0),
        monthOverMonthChange,
      },
      recentActivity: recentLogs,
    };
  }

  async getExpenseTrend(userId: string, role: Role, months = 6) {
    const isAdmin = role !== Role.USER;
    const now = new Date();
    const result = [];

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const agg = await prisma.expense.aggregate({
        where: {
          ...(isAdmin ? {} : { userId }),
          date: { gte: start, lte: end },
        },
        _sum: { amount: true },
        _count: true,
      });

      result.push({
        month: start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        total: Number(agg._sum.amount ?? 0),
        count: agg._count,
      });
    }

    return result;
  }
}

export const dashboardService = new DashboardService();

import { prisma } from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/password';
import { AppError } from '../../utils/AppError';
import { buildPaginationMeta } from '../../utils/response';
import { createActivityLog } from '../../middleware/activityLogger.middleware';
import type { CreateUserDto, UpdateUserDto, ChangePasswordDto, ListUsersQuery } from './users.dto';
import { Role, Prisma } from '@prisma/client';

const USER_SELECT = {
  id: true,
  email: true,
  username: true,
  firstName: true,
  lastName: true,
  role: true,
  avatar: true,
  isActive: true,
  isEmailVerified: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, firstName: true, lastName: true } },
} as const;

export class UsersService {
  async createUser(dto: CreateUserDto, creatorId: string, creatorRole: Role) {
    if (dto.role === Role.SUPER_ADMIN && creatorRole !== Role.SUPER_ADMIN) {
      throw new AppError('Only super admins can create super admin accounts', 403, 'FORBIDDEN');
    }
    if (dto.role === Role.ADMIN && creatorRole === Role.USER) {
      throw new AppError('Users cannot create admin accounts', 403, 'FORBIDDEN');
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
      select: { email: true, username: true },
    });

    if (existing) {
      const field = existing.email === dto.email ? 'email' : 'username';
      throw new AppError(`A user with this ${field} already exists`, 409, 'DUPLICATE_USER');
    }

    const hashed = await hashPassword(dto.password);

    const user = await prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        firstName: dto.firstName,
        lastName: dto.lastName,
        password: hashed,
        role: dto.role ?? Role.USER,
        createdById: creatorId,
      },
      select: USER_SELECT,
    });

    await createActivityLog({
      userId: creatorId,
      action: 'USER_CREATE',
      resource: 'User',
      resourceId: user.id,
    });

    return user;
  }

  async listUsers(query: ListUsersQuery) {
    const page = parseInt(query.page, 10);
    const limit = parseInt(query.limit, 10);
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { username: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.role) where.role = query.role;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: USER_SELECT,
        skip,
        take: limit,
        orderBy: { [query.sortBy]: query.sortOrder },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, meta: buildPaginationMeta(total, page, limit) };
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ...USER_SELECT,
        _count: { select: { vaultEntries: true, expenses: true } },
      },
    });

    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto, requesterId: string, requesterRole: Role) {
    await this.getUserById(id);

    // Only super admin can change roles
    if (dto.role && requesterRole !== Role.SUPER_ADMIN) {
      throw new AppError('Only super admins can change user roles', 403, 'FORBIDDEN');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dto,
      select: USER_SELECT,
    });

    await createActivityLog({
      userId: requesterId,
      action: 'USER_UPDATE',
      resource: 'User',
      resourceId: id,
    });

    return updated;
  }

  async toggleUserStatus(id: string, requesterId: string) {
    const user = await this.getUserById(id);

    if (id === requesterId) {
      throw new AppError('You cannot deactivate your own account', 400, 'SELF_DEACTIVATE');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: USER_SELECT,
    });

    await createActivityLog({
      userId: requesterId,
      action: 'USER_TOGGLE_STATUS',
      resource: 'User',
      resourceId: id,
      metadata: { newStatus: updated.isActive },
    });

    return updated;
  }

  async deleteUser(id: string, requesterId: string) {
    await this.getUserById(id);

    if (id === requesterId) {
      throw new AppError('You cannot delete your own account', 400, 'SELF_DELETE');
    }

    await prisma.user.delete({ where: { id } });

    await createActivityLog({
      userId: requesterId,
      action: 'USER_DELETE',
      resource: 'User',
      resourceId: id,
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    const isValid = await comparePassword(dto.currentPassword, user.password);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 401, 'INVALID_PASSWORD');
    }

    const hashed = await hashPassword(dto.newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed, passwordChangedAt: new Date() },
    });

    // Revoke all refresh tokens to force re-login
    await prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });
  }

  async getDashboardStats(userId: string, role: Role) {
    const where = role === Role.USER ? { userId } : {};

    const [totalUsers, totalVaultEntries, totalExpenses] = await prisma.$transaction([
      prisma.user.count(role !== Role.USER ? undefined : { where: { id: userId } }),
      prisma.vaultEntry.count({ where }),
      prisma.expense.count({ where }),
    ]);

    return { totalUsers, totalVaultEntries, totalExpenses };
  }
}

export const usersService = new UsersService();

import { z } from 'zod';
import { Role } from '@prisma/client';

export const createUserSchema = z.object({
  email: z.string().email().toLowerCase(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores'),
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special char'),
  role: z.nativeEnum(Role).optional().default(Role.USER),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).trim().optional(),
  lastName: z.string().min(1).max(50).trim().optional(),
  email: z.string().email().toLowerCase().optional(),
  username: z.string().min(3).max(30).optional(),
  avatar: z.string().max(2_500_000).nullable().optional(),
  role: z.nativeEnum(Role).optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password required'),
    newPassword: z
      .string()
      .min(8)
      .regex(/[A-Z]/, 'Must contain uppercase')
      .regex(/[a-z]/, 'Must contain lowercase')
      .regex(/[0-9]/, 'Must contain number')
      .regex(/[^A-Za-z0-9]/, 'Must contain special char'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const listUsersQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  search: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['createdAt', 'firstName', 'email', 'lastLoginAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

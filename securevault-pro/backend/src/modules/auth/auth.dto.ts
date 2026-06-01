import { z } from 'zod';

export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50).trim(),
  lastName:  z.string().min(1, 'Last name is required').max(50).trim(),
  username:  z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers and underscores only'),
  email:    z.string().email('Invalid email address').toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'One uppercase letter required')
    .regex(/[a-z]/, 'One lowercase letter required')
    .regex(/[0-9]/, 'One number required')
    .regex(/[^A-Za-z0-9]/, 'One special character required'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const setMasterPasswordSchema = z.object({
  masterPassword: z
    .string()
    .min(8, 'Master password must be at least 8 characters'),
  confirmMasterPassword: z.string(),
}).refine((d) => d.masterPassword === d.confirmMasterPassword, {
  message: 'Master passwords do not match',
  path: ['confirmMasterPassword'],
});

export const verifyMasterPasswordSchema = z.object({
  masterPassword: z.string().min(1, 'Master password is required'),
});

export type RegisterDto   = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
export type SetMasterPasswordDto = z.infer<typeof setMasterPasswordSchema>;
export type VerifyMasterPasswordDto = z.infer<typeof verifyMasterPasswordSchema>;

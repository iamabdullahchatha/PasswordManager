import { z } from 'zod';

const PROVIDERS  = [
  // Email
  'GMAIL','OUTLOOK','YAHOO','ZOHO','ICLOUD','PROTONMAIL','FASTMAIL','BUSINESS',
  // Social media
  'FACEBOOK','INSTAGRAM','WHATSAPP','SNAPCHAT','TWITTER','TIKTOK','YOUTUBE',
  'LINKEDIN','DISCORD','TELEGRAM','REDDIT','PINTEREST','TWITCH',
  // Finance & crypto
  'BINANCE','PAYPAL','COINBASE',
  // Tech & services
  'GITHUB','GOOGLE','APPLE','MICROSOFT','AMAZON','NETFLIX','SPOTIFY','SHOPIFY','STEAM',
  // Other
  'CUSTOM',
] as const;
const IMPORTANCE = ['LOW','MEDIUM','HIGH','CRITICAL'] as const;

/* ── List / filter ───────────────────────────────────────────────────────── */

export const listVaultQuerySchema = z.object({
  search:     z.string().optional(),
  provider:   z.enum(PROVIDERS).optional(),
  category:   z.string().optional(),
  importance: z.enum(IMPORTANCE).optional(),
  isFavorite: z.coerce.boolean().optional(),
  archived:   z.coerce.boolean().optional(),
  health:     z.enum(['weak', 'old', 'expiring']).optional(),
  sortBy:     z.enum(['createdAt','updatedAt','importanceLevel','title','lastAccessedAt']).optional(),
  sortOrder:  z.enum(['asc','desc']).optional(),
  page:       z.coerce.number().min(1).optional(),
  limit:      z.coerce.number().min(1).max(100).optional(),
});

/* ── Create ──────────────────────────────────────────────────────────────── */

export const createVaultEntrySchema = z.object({
  title:                  z.string().min(1, 'Title is required').max(100).trim(),
  platformName:           z.string().min(1).max(100).trim(),
  provider:               z.enum(PROVIDERS).optional().default('CUSTOM'),
  platformUrl:            z.string().url('Invalid URL').optional().or(z.literal('')),
  emailAddress:           z.string().min(1, 'Email / username is required').max(200).trim(),
  username:               z.string().max(100).trim().optional(),
  password:               z.string().min(1, 'Password is required'),

  notes:                  z.string().max(10_000).optional(),
  recoveryEmail:          z.string().email('Invalid recovery email').optional().or(z.literal('')),
  recoveryPhone:          z.string().max(30).optional(),

  twoFactorEnabled:       z.boolean().optional().default(false),
  authenticatorApp:       z.string().max(100).optional(),

  backupCodes:            z.string().max(5_000).optional(),
  appPasswords:           z.string().max(5_000).optional(),
  securityQuestions:      z.string().max(5_000).optional(),

  category:               z.string().max(50).optional(),
  importanceLevel:        z.enum(IMPORTANCE).optional().default('MEDIUM'),
  isFavorite:             z.boolean().optional().default(false),
  tags:                   z.array(z.string().max(30)).max(10).optional(),

  lastPasswordChangedAt:  z.string().datetime().optional(),
  nextPasswordReminderAt: z.string().datetime().optional(),
});

/* ── Update ──────────────────────────────────────────────────────────────── */

export const updateVaultEntrySchema = createVaultEntrySchema.partial().extend({
  archivedAt: z.string().datetime().nullable().optional(),
});

/* ── Reveal (single encrypted field) ────────────────────────────────────── */

export const revealPasswordSchema = z.object({
  masterPassword: z.string().min(1, 'Master password required'),
  field: z
    .enum(['password', 'backupCodes', 'appPasswords', 'securityQuestions', 'notes'])
    .optional()
    .default('password'),
});

/* ── Delete (requires master password confirmation) ─────────────────────── */

export const deleteVaultEntrySchema = z.object({
  masterPassword: z.string().min(1, 'Master password required'),
});

/* ── Export / Import ─────────────────────────────────────────────────────── */

export const exportVaultSchema = z.object({
  exportPassword: z.string().min(8, 'Export password must be at least 8 characters'),
  masterPassword: z.string().min(1, 'Master password required'),
});

export const importVaultSchema = z.object({
  payload:        z.string().min(1),
  exportPassword: z.string().min(8),
  masterPassword: z.string().min(1, 'Master password required'),
});

export type CreateVaultEntryInput = z.infer<typeof createVaultEntrySchema>;
export type UpdateVaultEntryInput = z.infer<typeof updateVaultEntrySchema>;
export type ListVaultQuery         = z.infer<typeof listVaultQuerySchema>;
export type RevealInput            = z.infer<typeof revealPasswordSchema>;
export type DeleteVaultEntryInput  = z.infer<typeof deleteVaultEntrySchema>;

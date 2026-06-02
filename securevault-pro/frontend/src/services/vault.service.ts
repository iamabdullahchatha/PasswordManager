import { api } from './api';
import type {
  ApiResponse, VaultEntry, VaultRevealResponse,
  SecurityReport, VaultActivity, EmailProvider, ImportanceLevel,
} from '../types';

export interface CreateVaultDto {
  title: string;
  platformName: string;
  provider?: EmailProvider;
  platformUrl?: string;
  emailAddress: string;
  username?: string;
  password: string;

  notes?: string;
  recoveryEmail?: string;
  recoveryPhone?: string;

  twoFactorEnabled?: boolean;
  authenticatorApp?: string;
  backupCodes?: string;
  appPasswords?: string;
  securityQuestions?: string;

  category?: string;
  importanceLevel?: ImportanceLevel;
  isFavorite?: boolean;
  tags?: string[];

  lastPasswordChangedAt?: string;
  nextPasswordReminderAt?: string;
}

export type UpdateVaultDto = Partial<CreateVaultDto> & { archivedAt?: string | null };

export interface VaultListParams {
  search?: string;
  provider?: EmailProvider;
  category?: string;
  importance?: ImportanceLevel;
  isFavorite?: boolean;
  archived?: boolean;
  health?: 'weak' | 'old' | 'expiring';
  sortBy?: 'createdAt' | 'updatedAt' | 'importanceLevel' | 'title' | 'lastAccessedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const vaultService = {
  /* ── CRUD ────────────────────────────────────────────────────────────── */
  list: (params?: VaultListParams) =>
    api.get<ApiResponse<VaultEntry[]>>('/vault', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<ApiResponse<VaultEntry>>(`/vault/${id}`).then((r) => r.data),

  create: (dto: CreateVaultDto) =>
    api.post<ApiResponse<VaultEntry>>('/vault', dto).then((r) => r.data),

  update: (id: string, dto: UpdateVaultDto) =>
    api.patch<ApiResponse<VaultEntry>>(`/vault/${id}`, dto).then((r) => r.data),

  delete: (id: string, masterPassword: string) =>
    api.delete<ApiResponse>(`/vault/${id}`, { data: { masterPassword } }).then((r) => r.data),

  /* ── Actions ─────────────────────────────────────────────────────────── */
  reveal: (id: string, masterPassword: string, field: 'password' | 'backupCodes' | 'appPasswords' | 'securityQuestions' | 'notes' = 'password') =>
    api.post<ApiResponse<VaultRevealResponse>>(`/vault/${id}/reveal`, { masterPassword, field }).then((r) => r.data),

  toggleFavorite: (id: string) =>
    api.patch<ApiResponse<{ id: string; isFavorite: boolean }>>(`/vault/${id}/favorite`).then((r) => r.data),

  toggleArchive: (id: string) =>
    api.patch<ApiResponse<{ id: string; archivedAt: string | null }>>(`/vault/${id}/archive`).then((r) => r.data),

  logCopy: (id: string) =>
    api.post<ApiResponse>(`/vault/${id}/copy-log`).then((r) => r.data),

  /* ── Security / reports ──────────────────────────────────────────────── */
  getSecurityReport: () =>
    api.get<ApiResponse<SecurityReport>>('/vault/security-report').then((r) => r.data),

  getActivity: () =>
    api.get<ApiResponse<VaultActivity[]>>('/vault/activity').then((r) => r.data),

  getEntryActivity: (id: string) =>
    api.get<ApiResponse<VaultActivity[]>>(`/vault/${id}/activity`).then((r) => r.data),

  getCategories: () =>
    api.get<ApiResponse<string[]>>('/vault/categories').then((r) => r.data),

  /* ── Password generator ──────────────────────────────────────────────── */
  generatePassword: (opts?: {
    length?: number;
    uppercase?: boolean;
    lowercase?: boolean;
    numbers?: boolean;
    symbols?: boolean;
    excludeAmbiguous?: boolean;
  }) =>
    api.post<ApiResponse<{ password: string; strength: { score: number; label: string } }>>('/vault/generate-password', opts ?? {}).then((r) => r.data),

  /* ── Export / Import ─────────────────────────────────────────────────── */
  exportVault: (masterPassword: string, exportPassword: string) =>
    api.post<ApiResponse<{ payload: string; count: number }>>('/vault/export', { masterPassword, exportPassword }).then((r) => r.data),

  importVault: (payload: string, exportPassword: string, masterPassword: string) =>
    api.post<ApiResponse<{ imported: number; total: number }>>('/vault/import', { payload, exportPassword, masterPassword }).then((r) => r.data),
};

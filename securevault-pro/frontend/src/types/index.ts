// ─── Auth ─────────────────────────────────────────────────────────────────────

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'USER';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: Role;
  avatar: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  hasMasterPassword: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

// ─── Vault ────────────────────────────────────────────────────────────────────

export type EmailProvider =
  | 'GMAIL' | 'OUTLOOK' | 'YAHOO' | 'ZOHO'
  | 'ICLOUD' | 'PROTONMAIL' | 'FASTMAIL'
  | 'BUSINESS' | 'CUSTOM';

export type ImportanceLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface VaultEntry {
  id: string;
  userId: string;

  title: string;
  platformName: string;
  provider: EmailProvider;
  platformUrl: string | null;

  emailAddress: string;
  username: string | null;

  category: string | null;
  importanceLevel: ImportanceLevel;
  isFavorite: boolean;
  archivedAt: string | null;

  passwordStrength: number | null;
  lastPasswordChangedAt: string | null;
  nextPasswordReminderAt: string | null;
  lastAccessedAt: string | null;
  expiresAt: string | null;

  twoFactorEnabled: boolean;
  authenticatorApp: string | null;

  recoveryEmail: string | null;
  recoveryPhone: string | null;

  hasBackupCodes: boolean;
  hasAppPasswords: boolean;
  hasSecurityQuestions: boolean;
  hasNotes: boolean;

  tags: { name: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface VaultRevealResponse {
  field: string;
  value: string | null;
}

export interface SecurityReport {
  score: number;
  total: number;
  issues: { weak: number; reused: number; old: number; expiring: number; no2fa: number };
  entries: {
    weak: SecurityReportEntry[];
    reused: SecurityReportEntry[];
    old: SecurityReportEntry[];
    expiring: SecurityReportEntry[];
    no2fa: SecurityReportEntry[];
  };
  criticalWithoutTwoFA: SecurityReportEntry[];
}

export interface SecurityReportEntry {
  id: string;
  title: string;
  platformName: string;
  provider: EmailProvider;
  emailAddress: string;
  passwordStrength: number | null;
  twoFactorEnabled: boolean;
  importanceLevel: ImportanceLevel;
  lastPasswordChangedAt: string | null;
  tags: { name: string }[];
}

export interface VaultActivity {
  id: string;
  action: string;
  resource: string | null;
  resourceId: string | null;
  success: boolean;
  ipAddress: string | null;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export type ExpenseCategory =
  | 'FOOD_DINING' | 'RENT' | 'BILLS' | 'TRANSPORT' | 'UTILITIES' | 'ENTERTAINMENT'
  | 'HEALTHCARE' | 'EDUCATION' | 'SHOPPING' | 'HOUSING' | 'INSURANCE' | 'TRAVEL'
  | 'SUBSCRIPTIONS' | 'PERSONAL_CARE' | 'GIFTS_DONATIONS' | 'SAVINGS_INVESTMENTS'
  | 'BUSINESS' | 'FAMILY' | 'INTERNET' | 'MOBILE' | 'MAINTENANCE' | 'OTHER';

export type PaymentMethod =
  | 'CASH' | 'BANK_TRANSFER' | 'DEBIT_CARD' | 'CREDIT_CARD'
  | 'EASYPAISA' | 'JAZZCASH' | 'PAYPAL' | 'OTHER';

export type ExpenseStatus = 'PAID' | 'PENDING' | 'CANCELLED';

export interface Expense {
  id: string;
  userId: string;
  title: string;
  amount: string;
  currency: string;
  category: ExpenseCategory;
  customCategory: string | null;
  paymentMethod: PaymentMethod;
  status: ExpenseStatus;
  date: string;
  month: number;
  year: number;
  vendor: string | null;
  description: string | null;
  notes: string | null;
  receiptPath: string | null;
  isRecurring: boolean;
  recurringPeriod: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: ExpenseCategory | null;
  amount: string;
  currency: string;
  month: number;
  year: number;
  spent?: number;
  remaining?: number;
  usedPct?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Activity Logs ────────────────────────────────────────────────────────────

export type LogAction =
  | 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN' | 'TOKEN_REFRESH'
  | 'PASSWORD_VIEW' | 'PASSWORD_COPY'
  | 'VAULT_CREATE' | 'VAULT_UPDATE' | 'VAULT_DELETE' | 'VAULT_ARCHIVE' | 'VAULT_EXPORT' | 'VAULT_IMPORT'
  | 'BACKUP_CODES_VIEW' | 'APP_PASSWORDS_VIEW' | 'SECURITY_QUESTIONS_VIEW'
  | 'EXPENSE_CREATE' | 'EXPENSE_UPDATE' | 'EXPENSE_DELETE' | 'EXPENSE_IMPORT' | 'EXPENSE_EXPORT'
  | 'BUDGET_CREATE' | 'BUDGET_UPDATE' | 'BUDGET_DELETE'
  | 'USER_CREATE' | 'USER_UPDATE' | 'USER_DELETE' | 'USER_TOGGLE_STATUS'
  | 'SETTINGS_UPDATE' | 'MASTER_PASSWORD_SET' | 'MASTER_PASSWORD_VERIFY'
  | 'EXPORT_DATA' | 'REPORT_GENERATE'
  | 'PASSWORD_RESET_REQUEST' | 'PASSWORD_RESET_COMPLETE';

export interface ActivityLog {
  id: string;
  userId: string;
  action: LogAction;
  resource: string | null;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  errorMessage: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
}

// ─── API ──────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  code?: string;
  errors?: { field: string; message: string }[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  users: { total: number; active: number };
  vault: { total: number; weakPasswords: number; expiringSoon: number };
  expenses: {
    total: number;
    currentMonth: number;
    lastMonth: number;
    yearToDate: number;
    monthOverMonthChange: number;
  };
  recentActivity: ActivityLog[];
}

export interface ExpenseTrend {
  month: string;
  total: number;
  count: number;
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export interface CategoryReportData {
  total: number;
  count: number;
  percentage: number;
  months?: Record<number, number>;
}

export interface MonthlyReportData {
  year: number;
  month: number;
  total: number;
  count: number;
  average: number;
  dailyAvg: number;
  byCategory: Record<string, CategoryReportData>;
  byPaymentMethod: Record<string, { total: number; count: number }>;
  byDay: Array<{ day: number; amount: number }>;
  byStatus: Record<string, { total: number; count: number }>;
  topExpenses: Expense[];
  highest: Expense | null;
  lowest: Expense | null;
}

export interface YearlyReportData {
  year: number;
  total: number;
  byMonth: Array<{ month: number; total: number; count: number }>;
  byCategory: Record<string, CategoryReportData>;
  byPaymentMethod: Record<string, { total: number; count: number }>;
  highestMonth: { month: number; total: number; count: number };
  lowestMonth: { month: number; total: number; count: number };
  monthlyAvg: number;
}

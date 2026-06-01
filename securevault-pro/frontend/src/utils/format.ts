export function formatCurrency(amount: number | string, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    ...options,
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now  = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24)   return `${hours}h ago`;
  if (days < 7)     return `${days}d ago`;
  return formatDate(date);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ─── Expense Category ────────────────────────────────────────────────────────

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  FOOD_DINING:         'Food & Dining',
  RENT:                'Rent',
  BILLS:               'Bills',
  TRANSPORT:           'Transport',
  UTILITIES:           'Utilities',
  ENTERTAINMENT:       'Entertainment',
  HEALTHCARE:          'Healthcare',
  EDUCATION:           'Education',
  SHOPPING:            'Shopping',
  HOUSING:             'Housing',
  INSURANCE:           'Insurance',
  TRAVEL:              'Travel',
  SUBSCRIPTIONS:       'Subscriptions',
  PERSONAL_CARE:       'Personal Care',
  GIFTS_DONATIONS:     'Gifts & Donations',
  SAVINGS_INVESTMENTS: 'Savings & Investments',
  BUSINESS:            'Business',
  FAMILY:              'Family',
  INTERNET:            'Internet',
  MOBILE:              'Mobile',
  MAINTENANCE:         'Maintenance',
  OTHER:               'Other',
};

export const EXPENSE_CATEGORY_COLORS: Record<string, string> = {
  FOOD_DINING:         '#f97316',
  RENT:                '#dc2626',
  BILLS:               '#7c3aed',
  TRANSPORT:           '#3b82f6',
  UTILITIES:           '#8b5cf6',
  ENTERTAINMENT:       '#ec4899',
  HEALTHCARE:          '#ef4444',
  EDUCATION:           '#06b6d4',
  SHOPPING:            '#f59e0b',
  HOUSING:             '#10b981',
  INSURANCE:           '#6366f1',
  TRAVEL:              '#0ea5e9',
  SUBSCRIPTIONS:       '#a855f7',
  PERSONAL_CARE:       '#14b8a6',
  GIFTS_DONATIONS:     '#f43f5e',
  SAVINGS_INVESTMENTS: '#22c55e',
  BUSINESS:            '#0891b2',
  FAMILY:              '#d97706',
  INTERNET:            '#2563eb',
  MOBILE:              '#7c3aed',
  MAINTENANCE:         '#64748b',
  OTHER:               '#6b7280',
};

// ─── Payment Method ───────────────────────────────────────────────────────────

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH:          'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  DEBIT_CARD:    'Debit Card',
  CREDIT_CARD:   'Credit Card',
  EASYPAISA:     'Easypaisa',
  JAZZCASH:      'JazzCash',
  PAYPAL:        'PayPal',
  OTHER:         'Other',
};

export const PAYMENT_METHOD_COLORS: Record<string, string> = {
  CASH:          '#22c55e',
  BANK_TRANSFER: '#3b82f6',
  DEBIT_CARD:    '#f97316',
  CREDIT_CARD:   '#a855f7',
  EASYPAISA:     '#10b981',
  JAZZCASH:      '#ef4444',
  PAYPAL:        '#0ea5e9',
  OTHER:         '#6b7280',
};

// ─── Status ───────────────────────────────────────────────────────────────────

export const EXPENSE_STATUS_LABELS: Record<string, string> = {
  PAID:      'Paid',
  PENDING:   'Pending',
  CANCELLED: 'Cancelled',
};

export const EXPENSE_STATUS_COLORS: Record<string, string> = {
  PAID:      '#22c55e',
  PENDING:   '#f59e0b',
  CANCELLED: '#ef4444',
};

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

import {
  formatCurrency, formatDate,
  EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_COLORS,
  PAYMENT_METHOD_LABELS, PAYMENT_METHOD_COLORS,
  EXPENSE_STATUS_LABELS,
} from '../utils/format';

describe('formatCurrency', () => {
  it('formats USD amounts correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency('99.9')).toBe('$99.90');
  });

  it('formats PKR currency', () => {
    const result = formatCurrency(50000, 'PKR');
    expect(result).toContain('50,000');
  });

  it('handles negative amounts', () => {
    expect(formatCurrency(-100)).toContain('100.00');
  });
});

describe('formatDate', () => {
  it('formats ISO date strings', () => {
    const result = formatDate('2026-06-01');
    expect(result).toContain('2026');
    expect(result).toContain('Jun');
    expect(result).toContain('1');
  });

  it('formats Date objects', () => {
    const result = formatDate(new Date(2026, 5, 15)); // June 15 2026
    expect(result).toContain('2026');
  });
});

describe('Category labels and colors', () => {
  it('has a label for every category', () => {
    const expectedCategories = [
      'FOOD_DINING', 'RENT', 'BILLS', 'TRANSPORT', 'ENTERTAINMENT',
      'HEALTHCARE', 'EDUCATION', 'SHOPPING', 'TRAVEL', 'SUBSCRIPTIONS',
      'OTHER',
    ];
    for (const cat of expectedCategories) {
      expect(EXPENSE_CATEGORY_LABELS[cat]).toBeDefined();
      expect(EXPENSE_CATEGORY_LABELS[cat].length).toBeGreaterThan(0);
    }
  });

  it('has a color for every category that has a label', () => {
    for (const key of Object.keys(EXPENSE_CATEGORY_LABELS)) {
      expect(EXPENSE_CATEGORY_COLORS[key]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe('Payment method labels and colors', () => {
  it('covers all payment methods', () => {
    const methods = ['CASH', 'BANK_TRANSFER', 'DEBIT_CARD', 'CREDIT_CARD', 'EASYPAISA', 'JAZZCASH', 'PAYPAL', 'OTHER'];
    for (const m of methods) {
      expect(PAYMENT_METHOD_LABELS[m]).toBeDefined();
      expect(PAYMENT_METHOD_COLORS[m]).toMatch(/^#/);
    }
  });
});

describe('Status labels', () => {
  it('covers PAID, PENDING, CANCELLED', () => {
    expect(EXPENSE_STATUS_LABELS['PAID']).toBe('Paid');
    expect(EXPENSE_STATUS_LABELS['PENDING']).toBe('Pending');
    expect(EXPENSE_STATUS_LABELS['CANCELLED']).toBe('Cancelled');
  });
});

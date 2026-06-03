import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$',    name: 'US Dollar'          },
  { code: 'EUR', symbol: '€',    name: 'Euro'               },
  { code: 'GBP', symbol: '£',    name: 'British Pound'      },
  { code: 'PKR', symbol: '₨',    name: 'Pakistani Rupee'    },
  { code: 'INR', symbol: '₹',    name: 'Indian Rupee'       },
  { code: 'CAD', symbol: 'C$',   name: 'Canadian Dollar'    },
  { code: 'AUD', symbol: 'A$',   name: 'Australian Dollar'  },
  { code: 'AED', symbol: 'د.إ',  name: 'UAE Dirham'         },
  { code: 'SAR', symbol: '﷼',    name: 'Saudi Riyal'        },
  { code: 'JPY', symbol: '¥',    name: 'Japanese Yen'       },
  { code: 'CNY', symbol: '¥',    name: 'Chinese Yuan'       },
  { code: 'CHF', symbol: 'CHF',  name: 'Swiss Franc'        },
  { code: 'SGD', symbol: 'S$',   name: 'Singapore Dollar'   },
  { code: 'MYR', symbol: 'RM',   name: 'Malaysian Ringgit'  },
  { code: 'TRY', symbol: '₺',    name: 'Turkish Lira'       },
  { code: 'BRL', symbol: 'R$',   name: 'Brazilian Real'     },
  { code: 'MXN', symbol: 'MX$',  name: 'Mexican Peso'       },
  { code: 'ZAR', symbol: 'R',    name: 'South African Rand' },
  { code: 'KWD', symbol: 'KD',   name: 'Kuwaiti Dinar'      },
  { code: 'QAR', symbol: 'QR',   name: 'Qatari Riyal'       },
] as const;

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]['code'];

interface CurrencyState {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: 'USD',
      setCurrency: (currency) => set({ currency }),
    }),
    { name: 'svp-currency' },
  ),
);

import { Mail, Globe, Building2 } from 'lucide-react';
import type { EmailProvider } from '../../types';

export const PROVIDER_LABELS: Record<EmailProvider, string> = {
  GMAIL:      'Gmail',
  OUTLOOK:    'Outlook',
  YAHOO:      'Yahoo Mail',
  ZOHO:       'Zoho Mail',
  ICLOUD:     'iCloud Mail',
  PROTONMAIL: 'ProtonMail',
  FASTMAIL:   'Fastmail',
  BUSINESS:   'Business Email',
  CUSTOM:     'Custom',
};

interface ProviderIconProps {
  provider: EmailProvider;
  size?: number | string;
  className?: string;
}

/* SVG inline icons for major providers, lucide fallback for others */
export function ProviderIcon({ provider, size = 18, className = '' }: ProviderIconProps) {
  const s = typeof size === 'number' ? size : parseInt(size as string, 10) || 18;

  switch (provider) {
    case 'GMAIL':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
          <path d="M6 18V8.4L4 7V19h16V7l-2 1.4V18H6z" fill="currentColor" fillOpacity={0.3}/>
          <path d="M4 7l8 6 8-6-8-4-8 4z" fill="currentColor"/>
          <path d="M4 7v12h2V10.5L12 15l6-4.5V19h2V7l-8 6-8-6z" fill="currentColor"/>
        </svg>
      );
    case 'OUTLOOK':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
          <rect x="2" y="5" width="12" height="14" rx="1" fill="currentColor" fillOpacity={0.25}/>
          <path d="M14 9l6-3v12l-6-3V9z" fill="currentColor" fillOpacity={0.5}/>
          <circle cx="8" cy="12" r="3" fill="currentColor"/>
        </svg>
      );
    case 'YAHOO':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
          <path d="M3 5h5l4 7 4-7h5l-6.5 10v6h-5v-6L3 5z" fill="currentColor"/>
        </svg>
      );
    case 'ICLOUD':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
          <path d="M18.5 9.5A5 5 0 0013 5a5 5 0 00-4.9 4 4 4 0 100 8H18.5a3.5 3.5 0 000-7z" fill="currentColor"/>
        </svg>
      );
    case 'PROTONMAIL':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
          <path d="M4 4h10l6 6v10H4V4z" fill="currentColor" fillOpacity={0.25}/>
          <path d="M4 4l8 8 12-8" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
        </svg>
      );
    case 'FASTMAIL':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
          <rect x="3" y="5" width="18" height="14" rx="2" fill="currentColor" fillOpacity={0.25}/>
          <path d="M3 7l9 7 9-7" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
        </svg>
      );
    case 'ZOHO':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
          <rect x="3" y="5" width="18" height="14" rx="2" fill="currentColor" fillOpacity={0.25}/>
          <text x="12" y="15" textAnchor="middle" fill="currentColor" fontSize="9" fontWeight="bold">Z</text>
        </svg>
      );
    case 'BUSINESS':
      return <Building2 size={s} className={className} />;
    default:
      return <Mail size={s} className={className} />;
  }
}

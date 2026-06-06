import type {
  DomainRegistrar, EmailHostProvider, ProjectStatus,
  ClientPaymentStatus, WebProjectService,
} from '../types';

// ─── Expiry helpers ──────────────────────────────────────────────────────────

export function getDaysUntilExpiry(expiryDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.round((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export type ExpiryVariant = 'expired' | 'critical' | 'warning' | 'caution' | 'good';

export function getExpiryVariant(days: number): ExpiryVariant {
  if (days < 0)   return 'expired';
  if (days <= 14) return 'critical';
  if (days <= 30) return 'warning';
  if (days <= 60) return 'caution';
  return 'good';
}

export const EXPIRY_STYLES: Record<ExpiryVariant, { pill: string; dot: string; label: string }> = {
  expired:  { pill: 'bg-red-100 text-red-700 border border-red-200',    dot: 'bg-red-500',    label: 'Expired'   },
  critical: { pill: 'bg-rose-100 text-rose-700 border border-rose-200', dot: 'bg-rose-500',   label: 'Critical'  },
  warning:  { pill: 'bg-amber-100 text-amber-700 border border-amber-200', dot: 'bg-amber-500', label: 'Warning' },
  caution:  { pill: 'bg-yellow-100 text-yellow-700 border border-yellow-200', dot: 'bg-yellow-500', label: 'Caution' },
  good:     { pill: 'bg-green-100 text-green-700 border border-green-200', dot: 'bg-green-500', label: 'Active'  },
};

export function formatDaysLabel(days: number): string {
  if (days < 0)   return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return 'Expires today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

// ─── Project financials ──────────────────────────────────────────────────────

export function calcTotalCost(p: {
  domainCost: number; emailCost: number; hostingCost: number;
  designCost: number; developmentCost: number; maintenanceCost: number; otherCost: number;
}): number {
  return p.domainCost + p.emailCost + p.hostingCost + p.designCost
       + p.developmentCost + p.maintenanceCost + p.otherCost;
}

export function calcProfit(clientCharged: number, totalCost: number): number {
  return clientCharged - totalCost;
}

export function calcProfitMargin(clientCharged: number, totalCost: number): number {
  if (clientCharged === 0) return 0;
  return ((clientCharged - totalCost) / clientCharged) * 100;
}

// ─── Label maps ──────────────────────────────────────────────────────────────

export const REGISTRAR_LABELS: Record<DomainRegistrar, string> = {
  GODADDY:          'GoDaddy',
  NAMECHEAP:        'Namecheap',
  CLOUDFLARE:       'Cloudflare',
  GOOGLE_DOMAINS:   'Google Domains',
  AWS_ROUTE53:      'AWS Route 53',
  PORKBUN:          'Porkbun',
  HOVER:            'Hover',
  NAMESILO:         'NameSilo',
  DYNADOT:          'Dynadot',
  RESELLER_CLUB:    'ResellerClub',
  ENOM:             'eNom',
  NETWORK_SOLUTIONS:'Network Solutions',
  BLUEHOST:         'Bluehost',
  HOSTINGER:        'Hostinger',
  SITEGROUND:       'SiteGround',
  OTHER:            'Other',
};

export const EMAIL_PROVIDER_LABELS: Record<EmailHostProvider, string> = {
  GOOGLE_WORKSPACE:    'Google Workspace',
  MICROSOFT_365:       'Microsoft 365',
  ZOHO_MAIL:           'Zoho Mail',
  NAMECHEAP_EMAIL:     'Namecheap Email',
  CPANEL:              'cPanel / WHM',
  PROTONMAIL_BUSINESS: 'ProtonMail Business',
  FASTMAIL:            'Fastmail',
  RACKSPACE:           'Rackspace Email',
  TITAN_EMAIL:         'Titan Email',
  OTHER:               'Other',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  ACTIVE:    'Active',
  COMPLETED: 'Completed',
  PAUSED:    'Paused',
  ON_HOLD:   'On Hold',
  CANCELLED: 'Cancelled',
};

export const PROJECT_STATUS_STYLES: Record<ProjectStatus, string> = {
  ACTIVE:    'bg-emerald-100 text-emerald-700 border border-emerald-200',
  COMPLETED: 'bg-blue-100 text-blue-700 border border-blue-200',
  PAUSED:    'bg-amber-100 text-amber-700 border border-amber-200',
  ON_HOLD:   'bg-slate-100 text-slate-600 border border-slate-200',
  CANCELLED: 'bg-red-100 text-red-700 border border-red-200',
};

export const PAYMENT_STATUS_LABELS: Record<ClientPaymentStatus, string> = {
  PAID:    'Paid',
  PARTIAL: 'Partial',
  PENDING: 'Pending',
  OVERDUE: 'Overdue',
};

export const PAYMENT_STATUS_STYLES: Record<ClientPaymentStatus, string> = {
  PAID:    'bg-emerald-100 text-emerald-700 border border-emerald-200',
  PARTIAL: 'bg-blue-100 text-blue-700 border border-blue-200',
  PENDING: 'bg-amber-100 text-amber-700 border border-amber-200',
  OVERDUE: 'bg-red-100 text-red-700 border border-red-200',
};

export const SERVICE_LABELS: Record<WebProjectService, string> = {
  DOMAIN:              'Domain',
  EMAIL_HOSTING:       'Email Hosting',
  WEB_HOSTING:         'Web Hosting',
  WEBSITE_DESIGN:      'Website Design',
  WEBSITE_DEVELOPMENT: 'Web Development',
  SEO:                 'SEO',
  MAINTENANCE:         'Maintenance',
  SOCIAL_MEDIA:        'Social Media',
  LOGO_DESIGN:         'Logo Design',
  BRANDING:            'Branding',
  CONTENT_WRITING:     'Content Writing',
  E_COMMERCE:          'E-Commerce',
  CUSTOM:              'Custom Work',
};

export const ALL_SERVICES: WebProjectService[] = [
  'DOMAIN', 'EMAIL_HOSTING', 'WEB_HOSTING', 'WEBSITE_DESIGN',
  'WEBSITE_DEVELOPMENT', 'SEO', 'MAINTENANCE', 'SOCIAL_MEDIA',
  'LOGO_DESIGN', 'BRANDING', 'CONTENT_WRITING', 'E_COMMERCE', 'CUSTOM',
];

export const REGISTRAR_OPTIONS = (Object.keys(REGISTRAR_LABELS) as DomainRegistrar[]).map((k) => ({
  value: k, label: REGISTRAR_LABELS[k],
}));

export const EMAIL_PROVIDER_OPTIONS = (Object.keys(EMAIL_PROVIDER_LABELS) as EmailHostProvider[]).map((k) => ({
  value: k, label: EMAIL_PROVIDER_LABELS[k],
}));

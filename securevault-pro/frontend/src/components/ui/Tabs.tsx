import { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface Tab {
  label: string;
  value: string;
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  badge?: string | number;
}

interface TabsProps {
  tabs: Tab[];
  value?: string;
  onChange?: (value: string) => void;
  variant?: 'line' | 'pill' | 'card';
  children?: ReactNode;
}

export function Tabs({ tabs, value, onChange, variant = 'line' }: TabsProps) {
  const [active, setActive] = useState(value ?? tabs[0]?.value ?? '');
  const current = value ?? active;

  const handleChange = (val: string) => {
    setActive(val);
    onChange?.(val);
  };

  if (variant === 'pill') {
    return (
      <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleChange(tab.value)}
            className={cn(
              'relative px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200',
              current === tab.value
                ? 'text-slate-900 bg-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {tab.label}
            {tab.badge && (
              <span className="ml-1.5 text-2xs bg-blue-100 text-blue-600 rounded-full px-1.5 py-0.5">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Line variant (default)
  return (
    <div className="relative flex gap-0 border-b border-slate-200">
      {tabs.map((tab) => {
        const isActive = current === tab.value;
        const Icon = tab.icon;
        return (
          <button
            key={tab.value}
            onClick={() => handleChange(tab.value)}
            className={cn(
              'relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors',
              'focus-visible:outline-none',
              isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {Icon && <Icon size={14} />}
            {tab.label}
            {tab.badge && (
              <span className="text-2xs bg-slate-100 text-slate-600 rounded-full px-1.5 py-0.5">
                {tab.badge}
              </span>
            )}
            {isActive && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

interface TabPanelProps {
  value: string;
  current: string;
  children: ReactNode;
}

export function TabPanel({ value, current, children }: TabPanelProps) {
  if (value !== current) return null;
  return (
    <motion.div
      key={value}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  const options = [
    { value: 'light'  as const, icon: Sun,     label: 'Light'  },
    { value: 'dark'   as const, icon: Moon,    label: 'Dark'   },
    { value: 'system' as const, icon: Monitor, label: 'System' },
  ];

  const cycleTheme = () => {
    const idx  = options.findIndex((o) => o.value === theme);
    const next = options[(idx + 1) % options.length];
    setTheme(next.value);
  };

  const current = options.find((o) => o.value === theme) ?? options[0];
  const Icon = current.icon;

  return (
    <button
      onClick={cycleTheme}
      title={`Theme: ${current.label}`}
      className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
    >
      <Icon size={16} />
    </button>
  );
}

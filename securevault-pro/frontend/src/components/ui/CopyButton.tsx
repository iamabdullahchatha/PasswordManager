import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '../../utils/cn';

interface CopyButtonProps {
  value: string;
  onCopy?: () => void;
  className?: string;
  size?: 'sm' | 'md';
  label?: string;
}

export function CopyButton({ value, onCopy, className, size = 'md', label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopy?.();

      // Auto-clear clipboard after 30s for security
      setTimeout(async () => {
        try {
          const current = await navigator.clipboard.readText();
          if (current === value) await navigator.clipboard.writeText('');
        } catch { /* ignore */ }
      }, 30_000);

      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = value;
      el.style.cssText = 'position:fixed;left:-9999px;opacity:0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg transition-all duration-150 font-medium text-xs',
        size === 'sm' ? 'p-1.5' : 'px-2.5 py-1.5',
        copied
          ? 'text-emerald-600 bg-emerald-50 border border-emerald-200'
          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent',
        className,
      )}
    >
      {copied ? <Check size={iconSize} /> : <Copy size={iconSize} />}
      {label && <span>{copied ? 'Copied!' : label}</span>}
    </button>
  );
}

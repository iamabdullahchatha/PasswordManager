import { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/cn';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, hint, className, required, ...props }, ref) => {
    const [show, setShow] = useState(false);

    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-slate-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={show ? 'text' : 'password'}
            className={cn(
              'w-full bg-white rounded-lg border text-sm text-slate-900 placeholder:text-slate-400',
              'px-3 py-2.5 pr-10 font-mono',
              'transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
              'disabled:cursor-not-allowed disabled:bg-slate-50',
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20 bg-red-50/30'
                : 'border-slate-200 hover:border-slate-300',
              className,
            )}
            required={required}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
            {error}
          </p>
        )}
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';

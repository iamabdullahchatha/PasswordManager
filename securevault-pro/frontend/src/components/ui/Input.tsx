import { forwardRef, ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { SelectMenu } from './SelectMenu';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ComponentType<{ size?: number | string; className?: string }>;
  rightElement?: ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, leftIcon: Icon, rightElement, wrapperClassName, className, required, ...props }, ref) => {
    return (
      <div className={cn('space-y-1.5', wrapperClassName)}>
        {label && (
          <label className="block text-sm font-semibold text-slate-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Icon size={15} className="text-slate-400" />
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-white rounded-lg border text-sm text-slate-900 placeholder:text-slate-400',
              'py-2.5 transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
              'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
              Icon ? 'pl-9 pr-3' : 'px-3',
              rightElement ? '!pr-10' : '',
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20 bg-red-50/30'
                : 'border-slate-200 hover:border-slate-300',
              className,
            )}
            required={required}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-slate-500">{hint}</p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

/* ── Textarea ──────────────────────────────────────────────────────────────── */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className, required, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-semibold text-slate-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full bg-white rounded-lg border text-sm text-slate-900 placeholder:text-slate-400',
            'px-3 py-2.5 transition-all duration-150 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
            'disabled:cursor-not-allowed disabled:bg-slate-50',
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
              : 'border-slate-200 hover:border-slate-300',
            className,
          )}
          required={required}
          {...props}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

/* ── Select ──────────────────────────────────────────────────────────────────
 * Thin wrapper over the premium SelectMenu, kept for design-system parity.
 * Controlled: pass `value` and `onChange(value)`. */
export interface SelectProps {
  label?: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  name?: string;
  id?: string;
}

export function Select({
  label, hint, error, options, placeholder, value, onChange,
  required, disabled, className, name, id,
}: SelectProps) {
  return (
    <SelectMenu
      label={label}
      hint={hint}
      error={error}
      options={options}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className={className}
      name={name}
      id={id}
    />
  );
}

/* ── Checkbox ──────────────────────────────────────────────────────────────── */
export function Checkbox({
  label, description, checked, onChange, id, disabled,
}: {
  label: string;
  description?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={cn('flex items-start gap-3', disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer')}
    >
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
          className="sr-only peer"
        />
        <div className={cn(
          'w-4 h-4 rounded border-2 transition-all duration-150',
          'peer-checked:bg-blue-600 peer-checked:border-blue-600',
          checked ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300',
        )}>
          {checked && (
            <svg viewBox="0 0 12 12" fill="none" className="absolute inset-0 w-full h-full p-0.5">
              <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
    </label>
  );
}

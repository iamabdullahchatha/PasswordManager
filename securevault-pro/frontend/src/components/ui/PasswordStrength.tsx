import { cn } from '../../utils/cn';
import { assessPasswordStrength } from '../../utils/password';

interface PasswordStrengthProps {
  password: string;
  showFeedback?: boolean;
}

const LEVEL_COLORS = {
  'weak':       { bar: 'bg-red-500',     text: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200' },
  'fair':       { bar: 'bg-orange-400',  text: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-200' },
  'good':       { bar: 'bg-yellow-400',  text: 'text-yellow-600',  bg: 'bg-yellow-50',  border: 'border-yellow-200' },
  'strong':     { bar: 'bg-blue-500',    text: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200' },
  'very-strong':{ bar: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
};

export function PasswordStrength({ password, showFeedback = true }: PasswordStrengthProps) {
  if (!password) return null;

  const { score, level, label, feedback } = assessPasswordStrength(password);
  const c = LEVEL_COLORS[level];
  const segments = 5;
  const filled = Math.ceil((score / 100) * segments);

  return (
    <div className="space-y-2">
      {/* Bars + label */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {Array.from({ length: segments }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all duration-300',
                i < filled ? c.bar : 'bg-slate-100',
              )}
            />
          ))}
        </div>
        <span className={cn('text-xs font-semibold w-20 text-right', c.text)}>{label}</span>
      </div>

      {/* Feedback */}
      {showFeedback && feedback.length > 0 && (
        <div className={cn('rounded-lg border p-2.5 space-y-1', c.bg, c.border)}>
          {feedback.map((tip, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={cn('w-1 h-1 rounded-full flex-shrink-0', c.bar)} />
              <p className="text-xs text-slate-600">{tip}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

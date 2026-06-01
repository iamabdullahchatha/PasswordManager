import { cn } from '../../utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = { sm: 'w-4 h-4 border-[1.5px]', md: 'w-6 h-6 border-2', lg: 'w-8 h-8 border-2' };

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div className={cn(
      'rounded-full border-slate-200 border-t-blue-600 animate-spin flex-shrink-0',
      SIZES[size],
      className,
    )} />
  );
}

export function PageLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}

export function InlineLoader({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 py-4 justify-center">
      <LoadingSpinner size="sm" />
      {text && <p className="text-sm text-slate-500">{text}</p>}
    </div>
  );
}

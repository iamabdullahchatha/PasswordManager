import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
  rounded?: boolean;
  style?: React.CSSProperties;
}

export function Skeleton({ className, rounded, style }: SkeletonProps) {
  return (
    <div
      style={style}
      className={cn(
        'shimmer bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 bg-[length:200%_100%]',
        rounded ? 'rounded-full' : 'rounded-lg',
        className,
      )}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex gap-3">
        <Skeleton className="h-4 w-32" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="divide-y divide-slate-50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" rounded />
            {Array.from({ length: cols - 1 }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" style={{ maxWidth: `${60 + j * 20}px` } as React.CSSProperties} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1,2,3,4].map((i) => <StatCardSkeleton key={i} />)}
      </div>
      <TableSkeleton />
    </div>
  );
}

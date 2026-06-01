import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { formatCurrency } from '../../utils/format';
import type { ExpenseTrend } from '../../types';

interface Props {
  data: ExpenseTrend[];
  height?: number;
  showAverage?: boolean;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-1.5">{label}</p>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-500" />
        <span className="text-slate-600">Total:</span>
        <span className="font-bold text-slate-900">{formatCurrency(payload[0]?.value ?? 0)}</span>
      </div>
      <p className="text-slate-400 mt-1">{payload[0]?.payload?.count ?? 0} transactions</p>
    </div>
  );
}

export function ExpenseTrendChart({ data, height = 280, showAverage }: Props) {
  const avg = data.length > 0
    ? data.reduce((s, d) => s + d.total, 0) / data.length
    : 0;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} dy={6} />
        <YAxis
          tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false}
          tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
          width={44}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }} />
        {showAverage && avg > 0 && (
          <ReferenceLine y={avg} stroke="#CBD5E1" strokeDasharray="4 4"
            label={{ value: 'Avg', position: 'right', fontSize: 10, fill: '#94A3B8' }}
          />
        )}
        <Area type="monotone" dataKey="total" stroke="#2563EB" strokeWidth={2.5}
          fill="url(#blueGradient)" dot={false}
          activeDot={{ r: 5, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

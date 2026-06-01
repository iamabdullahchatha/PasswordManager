import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MONTH_SHORT, formatCurrency } from '../../utils/format';

interface MonthData {
  month: number;
  total: number;
  count: number;
}

interface Props {
  current: MonthData[];
  previous: MonthData[];
  currentYear: number;
  prevYear: number;
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2.5 space-y-1.5">
      <p className="text-xs font-semibold text-slate-700">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.fill }} />
          <span className="text-xs text-slate-600">{p.name}: </span>
          <span className="text-xs font-bold text-slate-900">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function MonthComparisonChart({ current, previous, currentYear, prevYear, height = 280 }: Props) {
  const data = MONTH_SHORT.map((name, i) => ({
    name,
    [currentYear]: current[i]?.total  ?? 0,
    [prevYear]:    previous[i]?.total ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} width={45} />
        <Tooltip content={<CustomTooltip />} />
        <Legend formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} />
        <Bar dataKey={String(currentYear)} fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={20} />
        <Bar dataKey={String(prevYear)}    fill="#c7d2fe" radius={[3, 3, 0, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}

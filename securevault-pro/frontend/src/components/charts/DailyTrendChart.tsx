import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/format';

interface Props {
  data: Record<number, number>;
  daysInMonth: number;
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2.5">
      <p className="text-xs text-slate-500 mb-1">Day {label}</p>
      <p className="text-sm font-bold text-slate-900">{formatCurrency(payload[0]?.value ?? 0)}</p>
    </div>
  );
};

export function DailyTrendChart({ data, daysInMonth, height = 220 }: Props) {
  const chartData = Array.from({ length: daysInMonth }, (_, i) => ({
    day:    i + 1,
    amount: Number(data[i + 1] ?? 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          interval={4}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v}`}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#dailyGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

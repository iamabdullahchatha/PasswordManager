import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_COLORS, formatCurrency } from '../../utils/format';

interface Props {
  data: Record<string, number>;
  height?: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2.5">
      <p className="text-xs font-semibold text-slate-900">{PAYMENT_METHOD_LABELS[name] ?? name}</p>
      <p className="text-sm font-bold text-slate-900">{formatCurrency(value)}</p>
    </div>
  );
};

export function PaymentMethodDonutChart({ data, height = 240 }: Props) {
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  if (entries.length === 0) return <p className="text-sm text-slate-400 text-center py-6">No data</p>;

  const chartData = entries.map(([key, value]) => ({
    name:  key,
    value: Number(value),
    label: PAYMENT_METHOD_LABELS[key] ?? key,
    color: PAYMENT_METHOD_COLORS[key] ?? '#6b7280',
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} stroke="white" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (
            <span className="text-xs text-slate-600">{PAYMENT_METHOD_LABELS[value] ?? value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { formatCurrency } from '../../utils/format';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface Props {
  data: { month: number; total: number; count: number }[];
  height?: number;
  highlightMonth?: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <p className="text-blue-600 font-bold">{formatCurrency(payload[0]?.value ?? 0)}</p>
      <p className="text-slate-400 mt-0.5">{payload[0]?.payload?.count ?? 0} expenses</p>
    </div>
  );
}

export function MonthlyBarChart({ data, height = 280, highlightMonth }: Props) {
  const chartData = data.map((d) => ({ ...d, name: MONTHS[d.month - 1] }));
  const maxVal = Math.max(...data.map((d) => d.total), 1);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} dy={6} />
        <YAxis
          tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false}
          tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
          width={44}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC', radius: 6 }} />
        <Bar dataKey="total" radius={[5, 5, 0, 0]} maxBarSize={44}>
          {chartData.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.month === highlightMonth ? '#2563EB' : '#BFDBFE'}
              opacity={entry.total === 0 ? 0.3 : 1}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

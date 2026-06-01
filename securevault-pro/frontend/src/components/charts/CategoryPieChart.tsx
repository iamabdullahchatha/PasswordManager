import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_COLORS, formatCurrency } from '../../utils/format';

interface Props {
  data: Record<string, { total: number; count: number } | number>;
  height?: number;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-3 text-xs">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full" style={{ background: d.payload.fill }} />
        <span className="font-semibold text-slate-800">{EXPENSE_CATEGORY_LABELS[d.name] ?? d.name}</span>
      </div>
      <p className="text-slate-900 font-bold">{formatCurrency(d.value)}</p>
    </div>
  );
}

export function CategoryPieChart({ data, height = 300 }: Props) {
  const chartData = Object.entries(data).map(([category, val]) => ({
    name: category,
    value: typeof val === 'number' ? val : val.total,
    fill: EXPENSE_CATEGORY_COLORS[category] ?? '#64748B',
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={65}
          outerRadius={95}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.fill} stroke="white" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ fontSize: 11, color: '#64748B' }}>
              {EXPENSE_CATEGORY_LABELS[value] ?? value}
            </span>
          )}
          wrapperStyle={{ paddingTop: 8 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

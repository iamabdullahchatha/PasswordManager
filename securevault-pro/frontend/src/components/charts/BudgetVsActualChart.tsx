import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { EXPENSE_CATEGORY_LABELS, formatCurrency } from '../../utils/format';
import { cn } from '../../utils/cn';

interface BudgetItem {
  id: string;
  category: string | null;
  amount: string;
  spent?: number;
  usedPct?: number;
}

interface Props {
  budgets: BudgetItem[];
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2.5 space-y-1">
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

export function BudgetVsActualChart({ budgets, height = 260 }: Props) {
  if (!budgets.length) return <p className="text-sm text-slate-400 text-center py-6">No budgets set</p>;

  const data = budgets.map((b) => ({
    name:   b.category ? (EXPENSE_CATEGORY_LABELS[b.category] ?? b.category) : 'Overall',
    budget: Number(b.amount),
    spent:  b.spent ?? 0,
    over:   (b.spent ?? 0) > Number(b.amount),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={0} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} width={45} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="budget" name="Budget" fill="#e2e8f0" radius={[3, 3, 0, 0]} maxBarSize={28} />
        <Bar dataKey="spent"  name="Spent"  radius={[3, 3, 0, 0]} maxBarSize={28}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.over ? '#ef4444' : '#22c55e'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { useExpenses } from '../hooks/useExpenses';
import { useCategories } from '../hooks/useCategories';
import { formatINR } from '../lib/format';
import { lastNMonths } from '../lib/dates';
import { startOfMonth, endOfMonth } from 'date-fns';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ink-800 border border-ink-700 rounded-xl px-3 py-2 text-xs">
      <div className="text-ink-300">{payload[0].payload.label}</div>
      <div className="amount text-ink-50 font-medium mt-0.5">{formatINR(payload[0].value)}</div>
    </div>
  );
}

export function Trends() {
  const { user } = useAuth();
  const months = useMemo(() => lastNMonths(6), []);

  // Load all 6 months at once with a broad range
  const broadRange = useMemo(() => ({
    from: startOfMonth(months[0].from),
    to: endOfMonth(new Date()),
  }), [months]);

  const allExpenses = useExpenses(user?.id, broadRange);
  const categories = useCategories(user?.id);

  const monthlyData = useMemo(() => {
    return months.map(m => {
      const key = m.key;
      const total = allExpenses
        .filter(e => e.date.startsWith(key))
        .reduce((s, e) => s + Number(e.amount), 0);
      return { label: m.label, key, total };
    });
  }, [allExpenses, months]);

  const currentMonthTotal = monthlyData[monthlyData.length - 1]?.total ?? 0;
  const prevMonthTotal = monthlyData[monthlyData.length - 2]?.total ?? 0;
  const change = prevMonthTotal > 0 ? ((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100 : 0;

  const categoryTrends = useMemo(() => {
    const byCat = new Map();
    for (const e of allExpenses) {
      const key = `${e.category_id}`;
      byCat.set(key, (byCat.get(key) ?? 0) + Number(e.amount));
    }
    return Array.from(byCat.entries())
      .map(([id, total]) => {
        const cat = categories.find(c => c.id === id);
        return { id, total, name: cat?.name ?? 'Unknown', icon: cat?.icon ?? '•', color: cat?.color ?? '#666' };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [allExpenses, categories]);

  const maxBar = Math.max(...monthlyData.map(m => m.total), 1);
  const currentMonth = months[months.length - 1].key;

  return (
    <div className="max-w-md mx-auto px-5 pt-safe pt-4 pb-10">
      <div className="py-3">
        <div className="text-xs text-ink-400 uppercase tracking-widest">Ledger</div>
        <div className="font-display text-lg text-ink-100">Trends</div>
      </div>

      {/* Month-on-month change */}
      <div className="mt-2 grid grid-cols-2 gap-3">
        <div className="bg-ink-900/60 border border-ink-800 rounded-2xl px-3 py-3">
          <div className="text-[10px] uppercase tracking-widest text-ink-500">This month</div>
          <div className="amount mt-1 text-base font-medium text-ink-100">{formatINR(currentMonthTotal)}</div>
        </div>
        <div className="bg-ink-900/60 border border-ink-800 rounded-2xl px-3 py-3">
          <div className="text-[10px] uppercase tracking-widest text-ink-500">vs last month</div>
          <div className={`amount mt-1 text-base font-medium ${change > 0 ? 'text-danger' : change < 0 ? 'text-ok' : 'text-ink-400'}`}>
            {change === 0 ? '—' : `${change > 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(1)}%`}
          </div>
        </div>
      </div>

      {/* 6-month bar chart */}
      <div className="mt-8">
        <div className="text-[11px] uppercase tracking-widest text-ink-500 mb-4">6-month spend</div>
        {allExpenses.length === 0 ? (
          <div className="text-center py-12 text-ink-500 text-sm">No data yet — log some expenses first</div>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barCategoryGap="30%">
                <XAxis dataKey="label" tick={{ fill: '#78716c', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff08' }} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {monthlyData.map((entry) => (
                    <Cell key={entry.key} fill={entry.key === currentMonth ? '#d4af37' : '#3a3835'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top categories over 6 months */}
      {categoryTrends.length > 0 && (
        <div className="mt-8">
          <div className="text-[11px] uppercase tracking-widest text-ink-500 mb-3">Top categories (6 months)</div>
          <div className="space-y-2">
            {categoryTrends.map((c, i) => {
              const pct = Math.round((c.total / categoryTrends[0].total) * 100);
              return (
                <div key={c.id} className="bg-ink-900/60 border border-ink-800 rounded-2xl px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{c.icon}</span>
                      <span className="text-sm text-ink-100">{c.name}</span>
                    </div>
                    <div className="amount text-ink-50 text-sm font-medium">{formatINR(c.total)}</div>
                  </div>
                  <div className="h-1 bg-ink-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useExpenses } from '../hooks/useExpenses';
import { useIncomes } from '../hooks/useIncomes';
import { useCategories } from '../hooks/useCategories';
import { useAuth } from '../hooks/useAuth';
import { formatINR } from '../lib/format';
import { format } from '../lib/dates';
import { startOfMonth, endOfMonth } from 'date-fns';

function exportCSV(expenses, categories, monthLabel) {
  const catMap = new Map(categories.map(c => [c.id, c]));
  const header = 'Date,Category,Payment Method,Amount,Notes';
  const rows = expenses.map(e => {
    const cat = catMap.get(e.category_id)?.name ?? 'Unknown';
    const notes = (e.notes ?? '').replace(/,/g, ';');
    return `${e.date},${cat},${e.payment_method},${e.amount},${notes}`;
  });
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ledger-${monthLabel}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function Reports() {
  const { user } = useAuth();
  const [monthOffset, setMonthOffset] = useState(0);

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - monthOffset);
    return d;
  }, [monthOffset]);

  const range = useMemo(() => ({ from: startOfMonth(baseDate), to: endOfMonth(baseDate) }), [baseDate]);
  const monthLabel = format(baseDate, 'MMMM yyyy');
  const monthKey = format(baseDate, 'yyyy-MM');

  const expenses = useExpenses(user?.id, range);
  const incomes = useIncomes(user?.id, range);
  const categories = useCategories(user?.id);

  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  const totalSpend = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount), 0), [expenses]);
  const totalIncome = useMemo(() => incomes.reduce((s, e) => s + Number(e.amount), 0), [incomes]);
  const savings = totalIncome - totalSpend;

  const categoryBreakdown = useMemo(() => {
    const byCat = new Map();
    for (const e of expenses) byCat.set(e.category_id, (byCat.get(e.category_id) ?? 0) + Number(e.amount));
    return Array.from(byCat.entries())
      .map(([id, total]) => ({ id, total, cat: catMap.get(id) }))
      .sort((a, b) => b.total - a.total);
  }, [expenses, catMap]);

  const dailyAvg = useMemo(() => {
    const days = new Set(expenses.map(e => e.date)).size;
    return days > 0 ? totalSpend / days : 0;
  }, [expenses]);

  const biggestExpense = useMemo(() =>
    expenses.reduce((max, e) => Number(e.amount) > Number(max?.amount ?? 0) ? e : max, null),
    [expenses]
  );

  return (
    <div className="max-w-md mx-auto px-5 pt-safe pt-4 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between py-3">
        <div>
          <div className="text-xs text-ink-400 uppercase tracking-widest">Ledger</div>
          <div className="font-display text-lg text-ink-100">Reports</div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setMonthOffset(o => o + 1)} className="p-2 text-ink-400 hover:text-ink-100 transition">
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs text-ink-300 w-24 text-center">{monthLabel}</span>
          <button onClick={() => setMonthOffset(o => Math.max(0, o - 1))} disabled={monthOffset === 0} className="p-2 text-ink-400 hover:text-ink-100 disabled:opacity-30">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Export */}
      {expenses.length > 0 && (
        <button onClick={() => exportCSV(expenses, categories, monthKey)}
          className="flex items-center gap-2 h-9 px-4 border border-ink-700 rounded-full text-xs text-ink-300 hover:border-gold-500/50 hover:text-gold-400 transition mt-1">
          <Download size={13} /> Export CSV
        </button>
      )}

      {expenses.length === 0 ? (
        <div className="text-center mt-20">
          <div className="text-4xl mb-3">📋</div>
          <div className="text-sm text-ink-500">No data for {monthLabel}</div>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            <StatCard label="Spent" value={formatINR(totalSpend)} />
            <StatCard label="Income" value={formatINR(totalIncome)} />
            <StatCard label={savings >= 0 ? 'Saved' : 'Over'} value={formatINR(Math.abs(savings))} tone={savings >= 0 ? 'ok' : 'danger'} />
          </div>

          {/* Quick stats */}
          <div className="mt-5 grid grid-cols-2 gap-2">
            <StatCard label="Daily avg" value={formatINR(dailyAvg)} />
            <StatCard label="Transactions" value={`${expenses.length}`} />
          </div>

          {biggestExpense && (
            <div className="mt-3 bg-ink-900/60 border border-ink-800 rounded-2xl px-4 py-3">
              <div className="text-[10px] uppercase tracking-widest text-ink-500">Biggest expense</div>
              <div className="flex items-center justify-between mt-1">
                <div className="text-sm text-ink-100">
                  {catMap.get(biggestExpense.category_id)?.icon} {catMap.get(biggestExpense.category_id)?.name ?? '—'}
                  {biggestExpense.notes && <span className="text-ink-500 ml-1">· {biggestExpense.notes}</span>}
                </div>
                <div className="amount text-ink-50 font-medium">{formatINR(biggestExpense.amount)}</div>
              </div>
            </div>
          )}

          {/* Category breakdown */}
          <div className="mt-7">
            <div className="text-[11px] uppercase tracking-widest text-ink-500 mb-3">Category breakdown</div>
            <div className="space-y-2">
              {categoryBreakdown.map(({ id, total, cat }) => {
                const pct = totalSpend > 0 ? Math.round((total / totalSpend) * 100) : 0;
                return (
                  <div key={id} className="bg-ink-900/60 border border-ink-800 rounded-2xl px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat?.icon ?? '•'}</span>
                        <span className="text-sm text-ink-100">{cat?.name ?? 'Unknown'}</span>
                      </div>
                      <div className="text-right">
                        <div className="amount text-ink-50 font-medium">{formatINR(total)}</div>
                        <div className="text-xs text-ink-500">{pct}%</div>
                      </div>
                    </div>
                    <div className="mt-2 h-1 bg-ink-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat?.color ?? '#d4af37' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, tone = 'muted' }) {
  const colors = { muted: 'text-ink-100', ok: 'text-ok', danger: 'text-danger' };
  return (
    <div className="bg-ink-900/60 border border-ink-800 rounded-2xl px-3 py-3">
      <div className="text-[10px] uppercase tracking-widest text-ink-500">{label}</div>
      <div className={`amount mt-1 text-sm font-medium ${colors[tone]}`}>{value}</div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useExpenses } from '../hooks/useExpenses';
import { useIncomes } from '../hooks/useIncomes';
import { useCategories } from '../hooks/useCategories';
import { useAuth } from '../hooks/useAuth';
import { formatINR } from '../lib/format';
import { thisMonthRange, format, subMonths } from '../lib/dates';
import { startOfMonth, endOfMonth } from 'date-fns';

export function Spend() {
  const { user } = useAuth();
  const [monthOffset, setMonthOffset] = useState(0);

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - monthOffset);
    return d;
  }, [monthOffset]);

  const range = useMemo(() => ({
    from: startOfMonth(baseDate),
    to: endOfMonth(baseDate),
  }), [baseDate]);

  const expenses = useExpenses(user?.id, range);
  const incomes = useIncomes(user?.id, range);
  const categories = useCategories(user?.id);

  const monthLabel = format(baseDate, 'MMMM yyyy');
  const isCurrentMonth = monthOffset === 0;

  const totalSpend = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount), 0), [expenses]);
  const totalIncome = useMemo(() => incomes.reduce((s, e) => s + Number(e.amount), 0), [incomes]);
  const savings = totalIncome - totalSpend;

  const categoryBreakdown = useMemo(() => {
    const byCat = new Map();
    for (const e of expenses) {
      byCat.set(e.category_id, (byCat.get(e.category_id) ?? 0) + Number(e.amount));
    }
    return Array.from(byCat.entries())
      .map(([id, total]) => {
        const cat = categories.find(c => c.id === id);
        return { id, total, name: cat?.name ?? 'Unknown', icon: cat?.icon ?? '•', color: cat?.color ?? '#666' };
      })
      .sort((a, b) => b.total - a.total);
  }, [expenses, categories]);

  const paymentBreakdown = useMemo(() => {
    const byMethod = { UPI: 0, Cash: 0, Card: 0 };
    for (const e of expenses) byMethod[e.payment_method] = (byMethod[e.payment_method] ?? 0) + Number(e.amount);
    return Object.entries(byMethod).filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a);
  }, [expenses]);

  return (
    <div className="max-w-md mx-auto px-5 pt-safe pt-4 pb-10">
      {/* Header with month nav */}
      <div className="flex items-center justify-between py-3">
        <div>
          <div className="text-xs text-ink-400 uppercase tracking-widest">Ledger</div>
          <div className="font-display text-lg text-ink-100">Spend</div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setMonthOffset(o => o + 1)} className="p-2 text-ink-400 hover:text-ink-100 transition">
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs text-ink-300 w-24 text-center">{monthLabel}</span>
          <button onClick={() => setMonthOffset(o => Math.max(0, o - 1))} disabled={isCurrentMonth} className="p-2 text-ink-400 hover:text-ink-100 transition disabled:opacity-30">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Hero spend */}
      <div className="mt-2 mb-1">
        <div className="text-[11px] uppercase tracking-widest text-ink-500">Total spent</div>
        <div className="mt-1 inline-block gold-underline">
          <div className="amount font-display text-4xl font-medium text-ink-50">{formatINR(totalSpend)}</div>
        </div>
      </div>

      {/* Summary row */}
      <div className="mt-7 grid grid-cols-2 gap-3">
        <SummaryCard label="Income" value={formatINR(totalIncome)} tone="muted" />
        <SummaryCard label={savings >= 0 ? 'Saved' : 'Over budget'} value={formatINR(Math.abs(savings))} tone={savings >= 0 ? 'ok' : 'danger'} />
      </div>

      {/* Category breakdown */}
      {categoryBreakdown.length > 0 ? (
        <div className="mt-8">
          <div className="text-[11px] uppercase tracking-widest text-ink-500 mb-3">By category</div>
          <div className="space-y-2">
            {categoryBreakdown.map(c => {
              const pct = totalSpend > 0 ? Math.round((c.total / totalSpend) * 100) : 0;
              return (
                <div key={c.id} className="bg-ink-900/60 border border-ink-800 rounded-2xl p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{c.icon}</span>
                      <span className="text-sm text-ink-100">{c.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="amount text-ink-50 font-medium">{formatINR(c.total)}</div>
                      <div className="text-xs text-ink-500">{pct}%</div>
                    </div>
                  </div>
                  <div className="mt-2.5 h-1.5 bg-ink-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: c.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center mt-16">
          <div className="text-4xl mb-3">📊</div>
          <div className="text-sm text-ink-500">No spend data for {monthLabel}</div>
        </div>
      )}

      {/* Payment method breakdown */}
      {paymentBreakdown.length > 0 && (
        <div className="mt-8">
          <div className="text-[11px] uppercase tracking-widest text-ink-500 mb-3">By payment method</div>
          <div className="grid grid-cols-3 gap-3">
            {[['UPI', '#10b981'], ['Cash', '#eab308'], ['Card', '#3b82f6']].map(([method, color]) => {
              const amount = paymentBreakdown.find(([m]) => m === method)?.[1] ?? 0;
              const pct = totalSpend > 0 ? Math.round((amount / totalSpend) * 100) : 0;
              return (
                <div key={method} className="bg-ink-900/60 border border-ink-800 rounded-2xl p-3">
                  <div className="text-[10px] uppercase tracking-widest text-ink-500">{method}</div>
                  <div className="amount text-sm font-medium text-ink-100 mt-1">{formatINR(amount)}</div>
                  <div className="mt-2 h-1 bg-ink-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                  <div className="text-[10px] text-ink-500 mt-1">{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, tone }) {
  const colors = { muted: 'text-ink-200', ok: 'text-ok', danger: 'text-danger' };
  return (
    <div className="bg-ink-900/60 border border-ink-800 rounded-2xl px-3 py-3">
      <div className="text-[10px] uppercase tracking-widest text-ink-500">{label}</div>
      <div className={`amount mt-1 text-base font-medium ${colors[tone]}`}>{value}</div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { ChevronLeft } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useExpenses } from '../hooks/useExpenses';
import { useCategories } from '../hooks/useCategories';
import { useAuth } from '../hooks/useAuth';
import { formatINR } from '../lib/format';
import { thisMonthRange, lastMonthRange, relativeDay, format, fromISODate } from '../lib/dates';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Fab } from '../components/shell/Fab';
import { AddExpenseModal } from '../components/expense/AddExpenseModal';

const RANGE_OPTIONS = ['This month', 'Last month', 'Last 3 months'];

function getRangeForOption(opt) {
  const now = new Date();
  if (opt === 'This month') return thisMonthRange(now);
  if (opt === 'Last month') return lastMonthRange(now);
  return { from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now) };
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-ink-800 border border-ink-700 rounded-xl px-3 py-2 text-xs">
      <div className="flex items-center gap-1.5 text-ink-300">
        <span>{d.icon}</span><span>{d.name}</span>
      </div>
      <div className="amount text-ink-50 font-medium mt-0.5">{formatINR(d.value)}</div>
      <div className="text-ink-500">{d.pct}% of total</div>
    </div>
  );
}

export function Categories() {
  const { user } = useAuth();
  const [rangeOpt, setRangeOpt] = useState('This month');
  const [drillCatId, setDrillCatId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const range = useMemo(() => getRangeForOption(rangeOpt), [rangeOpt]);
  const expenses = useExpenses(user?.id, range);
  const categories = useCategories(user?.id);

  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  const totalSpend = useMemo(
    () => expenses.filter(e => e._op !== 'delete').reduce((s, e) => s + Number(e.amount), 0),
    [expenses]
  );

  const categoryData = useMemo(() => {
    const byCat = new Map();
    for (const e of expenses) {
      if (e._op === 'delete') continue;
      byCat.set(e.category_id, (byCat.get(e.category_id) ?? 0) + Number(e.amount));
    }
    return Array.from(byCat.entries())
      .map(([id, value]) => {
        const cat = catMap.get(id);
        const pct = totalSpend > 0 ? Math.round((value / totalSpend) * 100) : 0;
        const txCount = expenses.filter(e => e.category_id === id && e._op !== 'delete').length;
        return { id, value, pct, txCount, name: cat?.name ?? 'Unknown', icon: cat?.icon ?? '•', color: cat?.color ?? '#6b7280' };
      })
      .sort((a, b) => b.value - a.value);
  }, [expenses, catMap, totalSpend]);

  const drillExpenses = useMemo(() => {
    if (!drillCatId) return [];
    return expenses.filter(e => e.category_id === drillCatId && e._op !== 'delete').sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, drillCatId]);

  const drillCat = drillCatId ? catMap.get(drillCatId) : null;
  const drillTotal = drillExpenses.reduce((s, e) => s + Number(e.amount), 0);

  if (drillCatId) {
    return (
      <div className="max-w-md mx-auto px-5 pt-safe pt-4 pb-24">
        <div className="flex items-center gap-3 py-3">
          <button onClick={() => setDrillCatId(null)} className="p-1.5 -ml-1.5 text-ink-400 hover:text-ink-100 transition">
            <ChevronLeft size={22} />
          </button>
          <div>
            <div className="text-xs text-ink-400 uppercase tracking-widest">Spend</div>
            <div className="font-display text-lg text-ink-100">{drillCat?.icon} {drillCat?.name ?? 'Category'}</div>
          </div>
          <div className="ml-auto amount text-gold-400 font-medium">{formatINR(drillTotal)}</div>
        </div>
        {drillExpenses.length === 0 ? (
          <div className="text-center mt-20 text-sm text-ink-500">No expenses in this category.</div>
        ) : (
          <div className="space-y-2 mt-3">
            {drillExpenses.map(e => (
              <div key={e.id} className="bg-ink-900/60 border border-ink-800 rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ink-100">{relativeDay(e.date)} · {format(fromISODate(e.date), 'd MMM')}</div>
                  {e.notes && <div className="text-xs text-ink-500 truncate mt-0.5">{e.notes}</div>}
                  <div className="text-[10px] text-ink-600 mt-0.5">{e.payment_method}</div>
                </div>
                <div className="amount text-ink-50 font-medium shrink-0">{formatINR(e.amount)}</div>
              </div>
            ))}
          </div>
        )}
        <Fab onClick={() => setModalOpen(true)} />
        <AddExpenseModal open={modalOpen} onClose={() => setModalOpen(false)} userId={user?.id} />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-safe pt-4 pb-24">
      <div className="py-3">
        <div className="text-xs text-ink-400 uppercase tracking-widest">Ledger</div>
        <div className="font-display text-lg text-ink-100">Spend</div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {RANGE_OPTIONS.map(opt => (
          <button key={opt} onClick={() => setRangeOpt(opt)}
            className={'shrink-0 h-8 px-3.5 rounded-full text-xs border transition ' + (rangeOpt === opt ? 'border-gold-500 bg-gold-500/15 text-gold-400' : 'border-ink-700 text-ink-400')}>
            {opt}
          </button>
        ))}
      </div>

      {categoryData.length === 0 ? (
        <div className="text-center mt-20">
          <div className="text-4xl mb-3">📊</div>
          <div className="text-sm text-ink-500">No expenses for this period.</div>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-col items-center">
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={68} outerRadius={100} paddingAngle={2} dataKey="value" strokeWidth={0}>
                    {categoryData.map((entry) => (
                      <Cell key={entry.id} fill={entry.color} opacity={0.85} style={{ cursor: 'pointer' }} onClick={() => setDrillCatId(entry.id)} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="-mt-4 text-center">
              <div className="text-[11px] uppercase tracking-widest text-ink-500">Total</div>
              <div className="amount font-display text-2xl font-medium text-ink-50 mt-0.5">{formatINR(totalSpend)}</div>
            </div>
          </div>

          <div className="mt-7 space-y-2">
            {categoryData.map(c => (
              <button key={c.id} onClick={() => setDrillCatId(c.id)}
                className="w-full bg-ink-900/60 border border-ink-800 rounded-2xl p-3.5 text-left active:bg-ink-800/60 transition">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{c.icon}</span>
                    <div>
                      <div className="text-sm text-ink-100">{c.name}</div>
                      <div className="text-[10px] text-ink-500 mt-0.5">{c.txCount} transaction{c.txCount !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="amount text-ink-50 font-medium">{formatINR(c.value)}</div>
                    <div className="text-xs text-ink-500">{c.pct}%</div>
                  </div>
                </div>
                <div className="h-1 bg-ink-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: c.pct + '%', backgroundColor: c.color }} />
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      <Fab onClick={() => setModalOpen(true)} />
      <AddExpenseModal open={modalOpen} onClose={() => setModalOpen(false)} userId={user?.id} />
    </div>
  );
}

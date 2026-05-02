import { useState, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { useExpenses, deleteExpense } from '../hooks/useExpenses';
import { useCategories } from '../hooks/useCategories';
import { useAuth } from '../hooks/useAuth';
import { formatINR } from '../lib/format';
import { relativeDay, format, fromISODate } from '../lib/dates';
import { Fab } from '../components/shell/Fab';
import { AddExpenseModal } from '../components/expense/AddExpenseModal';

const DATE_FILTERS = ['All', 'Today', 'This week', 'This month'];
const METHOD_FILTERS = ['All', 'UPI', 'Cash', 'Card'];

function buildRange(f) {
  const now = new Date();
  if (f === 'Today') {
    return { from: new Date(now.getFullYear(), now.getMonth(), now.getDate()), to: now };
  }
  if (f === 'This week') {
    const s = new Date(now); s.setDate(now.getDate() - now.getDay()); s.setHours(0, 0, 0, 0);
    return { from: s, to: now };
  }
  if (f === 'This month') {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
  }
  return {};
}

function groupByDate(expenses) {
  const groups = new Map();
  for (const e of expenses) {
    if (!groups.has(e.date)) groups.set(e.date, []);
    groups.get(e.date).push(e);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a));
}

export function Recent() {
  const { user } = useAuth();
  const [dateFilter, setDateFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);

  const range = useMemo(() => buildRange(dateFilter), [dateFilter]);
  const allExpenses = useExpenses(user?.id, range);
  const categories = useCategories(user?.id);

  const catMap = useMemo(() => {
    const m = new Map();
    for (const c of categories) m.set(c.id, c);
    return m;
  }, [categories]);

  const expenses = useMemo(() => {
    let list = allExpenses.filter(e => e._op !== 'delete');
    if (methodFilter !== 'All') list = list.filter(e => e.payment_method === methodFilter);
    return list;
  }, [allExpenses, methodFilter]);

  const grouped = useMemo(() => groupByDate(expenses), [expenses]);

  const total = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount), 0), [expenses]);

  async function handleDelete(e) {
    if (!window.confirm(`Delete ₹${e.amount} expense?`)) return;
    await deleteExpense(user.id, e.id);
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-safe pt-4 pb-24">
      {/* Header */}
      <div className="flex items-end justify-between py-3">
        <div>
          <div className="text-xs text-ink-400 uppercase tracking-widest">Ledger</div>
          <div className="font-display text-lg text-ink-100">Recent</div>
        </div>
        {expenses.length > 0 && (
          <div className="amount text-ink-400 text-sm">{formatINR(total)}</div>
        )}
      </div>

      {/* Date filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 mt-1" style={{ scrollbarWidth: 'none' }}>
        {DATE_FILTERS.map(f => (
          <button key={f} onClick={() => setDateFilter(f)}
            className={`shrink-0 h-8 px-3.5 rounded-full text-xs border transition ${dateFilter === f ? 'border-gold-500 bg-gold-500/15 text-gold-400' : 'border-ink-700 text-ink-400'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Method filters */}
      <div className="flex gap-2 mt-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {METHOD_FILTERS.map(m => (
          <button key={m} onClick={() => setMethodFilter(m)}
            className={`shrink-0 h-7 px-3 rounded-full text-[11px] border transition ${methodFilter === m ? 'border-gold-500 bg-gold-500/15 text-gold-400' : 'border-ink-700 text-ink-500'}`}>
            {m}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-5 space-y-6">
        {grouped.length === 0 && (
          <div className="text-center mt-20">
            <div className="text-4xl mb-3">🪙</div>
            <div className="text-sm text-ink-500">No expenses found</div>
          </div>
        )}
        {grouped.map(([date, items]) => (
          <div key={date}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] uppercase tracking-widest text-ink-500">
                {relativeDay(date)} · {format(fromISODate(date), 'd MMM')}
              </div>
              <div className="text-xs text-ink-400 amount">
                {formatINR(items.reduce((s, e) => s + Number(e.amount), 0))}
              </div>
            </div>
            <div className="space-y-2">
              {items.map(e => {
                const cat = catMap.get(e.category_id);
                return (
                  <div key={e.id} className="bg-ink-900/60 border border-ink-800 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <span className="text-xl shrink-0">{cat?.icon ?? '•'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-ink-100 truncate">{cat?.name ?? 'Unknown'}</div>
                      {e.notes && <div className="text-xs text-ink-500 truncate mt-0.5">{e.notes}</div>}
                      <div className="text-[10px] text-ink-600 mt-0.5">{e.payment_method}</div>
                    </div>
                    <div className="amount text-ink-50 font-medium shrink-0">{formatINR(e.amount)}</div>
                    <button onClick={() => handleDelete(e)} className="p-1.5 text-ink-700 hover:text-danger transition shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Fab onClick={() => setModalOpen(true)} />
      <AddExpenseModal open={modalOpen} onClose={() => setModalOpen(false)} userId={user?.id} />
    </div>
  );
}

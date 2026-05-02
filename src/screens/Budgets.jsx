import { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useBudgets, addBudget, deleteBudget } from '../hooks/useBudgets';
import { useExpenses } from '../hooks/useExpenses';
import { useCategories } from '../hooks/useCategories';
import { useAuth } from '../hooks/useAuth';
import { formatINR, parseAmount } from '../lib/format';
import { thisMonthRange } from '../lib/dates';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';

function BudgetForm({ onSave, onClose, categories, existingCategoryIds }) {
  const available = categories.filter(c => !existingCategoryIds.includes(c.id));
  const [categoryId, setCategoryId] = useState(null);
  const [limit, setLimit] = useState('');
  const [saving, setSaving] = useState(false);

  const canSave = categoryId && parseAmount(limit) > 0;

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    await onSave({ category_id: categoryId, monthly_limit: parseAmount(limit) });
    setSaving(false);
    onClose();
  }

  return (
    <div className="space-y-5">
      <div>
        <Label>Category</Label>
        {available.length === 0 ? (
          <div className="mt-2 text-sm text-ink-500">All categories have budgets set.</div>
        ) : (
          <div className="flex flex-wrap gap-2 mt-2">
            {available.map(c => (
              <Chip key={c.id} selected={categoryId === c.id} onClick={() => setCategoryId(c.id)} color={c.color}>
                <span className="text-base leading-none">{c.icon}</span>
                <span>{c.name.split(' ')[0]}</span>
              </Chip>
            ))}
          </div>
        )}
      </div>
      <div>
        <Label>Monthly limit</Label>
        <div className="relative mt-2">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 font-display">₹</span>
          <input type="number" value={limit} onChange={e => setLimit(e.target.value)} placeholder="0"
            className="w-full h-12 pl-8 pr-4 bg-ink-800/60 border border-ink-700 rounded-xl text-ink-50 placeholder:text-ink-500 focus:outline-none focus:border-gold-500/50" />
        </div>
      </div>
      <Button onClick={handleSave} disabled={!canSave || saving} size="lg" className="w-full">
        {saving ? 'Saving…' : 'Set budget'}
      </Button>
    </div>
  );
}

export function Budgets() {
  const { user } = useAuth();
  const budgets = useBudgets(user?.id);
  const categories = useCategories(user?.id);
  const range = useMemo(() => thisMonthRange(), []);
  const expenses = useExpenses(user?.id, range);
  const [modalOpen, setModalOpen] = useState(false);

  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  const spendByCat = useMemo(() => {
    const m = new Map();
    for (const e of expenses) m.set(e.category_id, (m.get(e.category_id) ?? 0) + Number(e.amount));
    return m;
  }, [expenses]);

  const enriched = useMemo(() =>
    budgets.map(b => {
      const cat = catMap.get(b.category_id);
      const spent = spendByCat.get(b.category_id) ?? 0;
      const pct = Math.min(Math.round((spent / b.monthly_limit) * 100), 100);
      const overBudget = spent > b.monthly_limit;
      const atAlert = pct >= (b.alert_at_pct ?? 75);
      return { ...b, cat, spent, pct, overBudget, atAlert };
    }).sort((a, b) => b.pct - a.pct),
    [budgets, catMap, spendByCat]
  );

  const overCount = enriched.filter(b => b.overBudget).length;

  return (
    <div className="max-w-md mx-auto px-5 pt-safe pt-4 pb-10">
      <div className="flex items-end justify-between py-3">
        <div>
          <div className="text-xs text-ink-400 uppercase tracking-widest">Ledger</div>
          <div className="font-display text-lg text-ink-100">Budgets</div>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 h-8 px-3 bg-gold-500 text-ink-950 rounded-full text-xs font-medium">
          <Plus size={14} /> Add
        </button>
      </div>

      {overCount > 0 && (
        <div className="bg-danger/10 border border-danger/20 rounded-2xl px-4 py-3 mt-2">
          <div className="text-sm text-danger font-medium">⚠️ {overCount} budget{overCount > 1 ? 's' : ''} exceeded this month</div>
        </div>
      )}

      {enriched.length === 0 ? (
        <div className="text-center mt-20">
          <div className="text-4xl mb-3">🎯</div>
          <div className="text-sm text-ink-500">No budgets set yet</div>
          <div className="text-xs text-ink-600 mt-1">Tap Add to set a monthly limit per category</div>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {enriched.map(b => {
            const barColor = b.overBudget ? '#ef4444' : b.atAlert ? '#eab308' : b.cat?.color ?? '#d4af37';
            return (
              <div key={b.id} className={`bg-ink-900/60 border rounded-2xl p-4 ${b.overBudget ? 'border-danger/30' : 'border-ink-800'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{b.cat?.icon ?? '•'}</span>
                    <div>
                      <div className="text-sm text-ink-100">{b.cat?.name ?? 'Unknown'}</div>
                      <div className="text-xs text-ink-500 mt-0.5 amount">
                        {formatINR(b.spent)} of {formatINR(b.monthly_limit)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className={`text-sm font-medium amount ${b.overBudget ? 'text-danger' : b.atAlert ? 'text-warn' : 'text-ink-300'}`}>
                      {b.pct}%
                    </div>
                    <button onClick={() => { if (window.confirm('Remove this budget?')) deleteBudget(user.id, b.id); }}
                      className="p-1.5 text-ink-700 hover:text-danger transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 h-1.5 bg-ink-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${b.pct}%`, backgroundColor: barColor }} />
                </div>
                {b.overBudget && (
                  <div className="text-xs text-danger mt-2 amount">Over by {formatINR(b.spent - b.monthly_limit)}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Set budget">
        <BudgetForm
          categories={categories}
          existingCategoryIds={budgets.map(b => b.category_id)}
          onClose={() => setModalOpen(false)}
          onSave={data => addBudget(user.id, data)}
        />
      </Modal>
    </div>
  );
}

function Label({ children }) {
  return <div className="text-xs text-ink-400 uppercase tracking-wider">{children}</div>;
}

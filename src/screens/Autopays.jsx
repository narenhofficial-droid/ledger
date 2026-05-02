import { useState, useMemo } from 'react';
import { Plus, Trash2, PauseCircle, PlayCircle } from 'lucide-react';
import { useAutopays, addAutopay, updateAutopay, deleteAutopay } from '../hooks/useAutopays';
import { useCategories } from '../hooks/useCategories';
import { useAuth } from '../hooks/useAuth';
import { formatINR, parseAmount } from '../lib/format';
import { relativeDay, format, fromISODate } from '../lib/dates';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { Fab } from '../components/shell/Fab';
import { AddExpenseModal } from '../components/expense/AddExpenseModal';

function Label({ children }) {
  return <div className="text-xs text-ink-400 uppercase tracking-wider">{children}</div>;
}

function AutopayForm({ onSave, onClose, categories }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [frequency, setFrequency] = useState('monthly');
  const [nextDate, setNextDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [saving, setSaving] = useState(false);

  const canSave = name.trim() && parseAmount(amount) > 0 && categoryId && nextDate;

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    await onSave({ name: name.trim(), amount: parseAmount(amount), category_id: categoryId, frequency, next_charge_date: nextDate });
    setSaving(false);
    onClose();
  }

  return (
    <div className="space-y-5">
      <div>
        <Label>Name</Label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Netflix, Gym"
          className="mt-2 w-full h-12 px-4 bg-ink-800/60 border border-ink-700 rounded-xl text-ink-50 placeholder:text-ink-500 focus:outline-none focus:border-gold-500/50" />
      </div>
      <div>
        <Label>Amount</Label>
        <div className="relative mt-2">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 font-display">₹</span>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0"
            className="w-full h-12 pl-8 pr-4 bg-ink-800/60 border border-ink-700 rounded-xl text-ink-50 placeholder:text-ink-500 focus:outline-none focus:border-gold-500/50" />
        </div>
      </div>
      <div>
        <Label>Frequency</Label>
        <div className="flex gap-2 mt-2">
          {['monthly', 'yearly'].map(f => (
            <Chip key={f} selected={frequency === f} onClick={() => setFrequency(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <Label>Category</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {categories.map(c => (
            <Chip key={c.id} selected={categoryId === c.id} onClick={() => setCategoryId(c.id)} color={c.color}>
              <span className="text-base leading-none">{c.icon}</span>
              <span>{c.name.split(' ')[0]}</span>
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <Label>Next charge date</Label>
        <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)}
          className="mt-2 w-full h-12 px-4 bg-ink-800/60 border border-ink-700 rounded-xl text-ink-50 focus:outline-none focus:border-gold-500/50" />
      </div>
      <Button onClick={handleSave} disabled={!canSave || saving} size="lg" className="w-full">
        {saving ? 'Saving...' : 'Add autopay'}
      </Button>
    </div>
  );
}

function AutopayCard({ autopay: a, cat, userId }) {
  const isActive = a.status === 'active';
  const nextDate = fromISODate(a.next_charge_date);
  const isOverdue = nextDate < new Date() && isActive;
  return (
    <div className={'bg-ink-900/60 border rounded-2xl px-4 py-3 flex items-center gap-3 ' + (isOverdue ? 'border-danger/30' : 'border-ink-800')}>
      <span className="text-xl shrink-0">{cat?.icon ?? '📦'}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-ink-100 font-medium">{a.name}</div>
        <div className={'text-xs mt-0.5 ' + (isOverdue ? 'text-danger' : 'text-ink-500')}>
          {relativeDay(a.next_charge_date)} · {a.frequency === 'yearly' ? 'yearly' : 'monthly'}
        </div>
      </div>
      <div className="amount text-ink-50 font-medium shrink-0">{formatINR(a.amount)}</div>
      <button onClick={() => updateAutopay(userId, a.id, { status: isActive ? 'paused' : 'active' })}
        className="p-1.5 text-ink-500 hover:text-gold-400 transition shrink-0">
        {isActive ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
      </button>
      <button onClick={() => { if (window.confirm('Delete "' + a.name + '"?')) deleteAutopay(userId, a.id); }}
        className="p-1.5 text-ink-700 hover:text-danger transition shrink-0">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export function Autopays() {
  const { user } = useAuth();
  const autopays = useAutopays(user?.id);
  const categories = useCategories(user?.id);
  const [modalOpen, setModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  const active = autopays.filter(a => a.status === 'active');
  const paused = autopays.filter(a => a.status === 'paused');
  const monthlyTotal = active.reduce((s, a) => s + (a.frequency === 'monthly' ? Number(a.amount) : Number(a.amount) / 12), 0);

  return (
    <div className="max-w-md mx-auto px-5 pt-safe pt-4 pb-24">
      <div className="flex items-end justify-between py-3">
        <div>
          <div className="text-xs text-ink-400 uppercase tracking-widest">Ledger</div>
          <div className="font-display text-lg text-ink-100">Autopays</div>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 h-8 px-3 bg-gold-500 text-ink-950 rounded-full text-xs font-medium">
          <Plus size={14} /> Add
        </button>
      </div>

      {active.length > 0 && (
        <div className="bg-ink-900/60 border border-ink-800 rounded-2xl px-4 py-3 mt-2">
          <div className="text-[10px] uppercase tracking-widest text-ink-500">Monthly recurring cost</div>
          <div className="amount font-display text-2xl font-medium text-ink-50 mt-1">{formatINR(monthlyTotal)}</div>
        </div>
      )}

      {active.length > 0 && (
        <div className="mt-7">
          <div className="text-[11px] uppercase tracking-widest text-ink-500 mb-3">Active · {active.length}</div>
          <div className="space-y-2">
            {active.map(a => <AutopayCard key={a.id} autopay={a} cat={catMap.get(a.category_id)} userId={user.id} />)}
          </div>
        </div>
      )}

      {paused.length > 0 && (
        <div className="mt-7">
          <div className="text-[11px] uppercase tracking-widest text-ink-500 mb-3">Paused</div>
          <div className="space-y-2">
            {paused.map(a => <AutopayCard key={a.id} autopay={a} cat={catMap.get(a.category_id)} userId={user.id} />)}
          </div>
        </div>
      )}

      {autopays.length === 0 && (
        <div className="text-center mt-20">
          <div className="text-4xl mb-3">📅</div>
          <div className="text-sm text-ink-500">No recurring payments yet</div>
          <div className="text-xs text-ink-600 mt-1">Add subscriptions, rent, EMIs...</div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New autopay">
        <AutopayForm categories={categories} onClose={() => setModalOpen(false)} onSave={data => addAutopay(user.id, data)} />
      </Modal>

      <Fab onClick={() => setExpenseModalOpen(true)} />
      <AddExpenseModal open={expenseModalOpen} onClose={() => setExpenseModalOpen(false)} userId={user?.id} />
    </div>
  );
}

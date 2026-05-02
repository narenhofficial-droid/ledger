import { useState, useMemo } from 'react';
import { Plus, CheckCircle, Trash2 } from 'lucide-react';
import { useLending, addLending, settleLending, deleteLending } from '../hooks/useLending';
import { useAuth } from '../hooks/useAuth';
import { formatINR, parseAmount } from '../lib/format';
import { format, fromISODate } from '../lib/dates';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';

function LendingForm({ type, onSave, onClose }) {
  const [counterparty, setCounterparty] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const canSave = counterparty.trim() && parseAmount(amount) > 0;

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    await onSave({ type, counterparty: counterparty.trim(), amount: parseAmount(amount), date, due_date: dueDate || null, notes: notes.trim() || null });
    setSaving(false);
    onClose();
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>{type === 'lent' ? 'Lent to' : 'Borrowed from'}</Label>
        <input value={counterparty} onChange={e => setCounterparty(e.target.value)} placeholder="Name"
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Date</Label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="mt-2 w-full h-12 px-3 bg-ink-800/60 border border-ink-700 rounded-xl text-ink-50 focus:outline-none focus:border-gold-500/50" />
        </div>
        <div>
          <Label>Due date <span className="text-ink-600 normal-case font-normal">(opt)</span></Label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
            className="mt-2 w-full h-12 px-3 bg-ink-800/60 border border-ink-700 rounded-xl text-ink-50 focus:outline-none focus:border-gold-500/50" />
        </div>
      </div>
      <div>
        <Label>Note <span className="text-ink-600 normal-case font-normal">(opt)</span></Label>
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="What for?"
          className="mt-2 w-full h-12 px-4 bg-ink-800/60 border border-ink-700 rounded-xl text-ink-50 placeholder:text-ink-500 focus:outline-none focus:border-gold-500/50" />
      </div>
      <Button onClick={handleSave} disabled={!canSave || saving} size="lg" className="w-full">
        {saving ? 'Saving…' : `Save`}
      </Button>
    </div>
  );
}

export function Lending() {
  const { user } = useAuth();
  const all = useLending(user?.id);
  const [tab, setTab] = useState('lent');
  const [modalType, setModalType] = useState(null);

  const lent = all.filter(r => r.type === 'lent');
  const borrowed = all.filter(r => r.type === 'borrowed');
  const items = tab === 'lent' ? lent : borrowed;
  const open = items.filter(r => r.status === 'open');
  const settled = items.filter(r => r.status === 'settled');

  const openTotal = useMemo(() => open.reduce((s, r) => s + Number(r.amount), 0), [open]);

  return (
    <div className="max-w-md mx-auto px-5 pt-safe pt-4 pb-10">
      <div className="flex items-end justify-between py-3">
        <div>
          <div className="text-xs text-ink-400 uppercase tracking-widest">Ledger</div>
          <div className="font-display text-lg text-ink-100">Lending</div>
        </div>
        <button onClick={() => setModalType(tab)} className="flex items-center gap-1.5 h-8 px-3 bg-gold-500 text-ink-950 rounded-full text-xs font-medium">
          <Plus size={14} /> Add
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mt-1">
        {[['lent', `Lent (${lent.filter(r=>r.status==='open').length})`], ['borrowed', `Borrowed (${borrowed.filter(r=>r.status==='open').length})`]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`h-9 px-4 rounded-full text-sm border transition ${tab === key ? 'border-gold-500 bg-gold-500/15 text-gold-400' : 'border-ink-700 text-ink-400'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Open total */}
      {open.length > 0 && (
        <div className="bg-ink-900/60 border border-ink-800 rounded-2xl px-4 py-3 mt-5">
          <div className="text-[10px] uppercase tracking-widest text-ink-500">
            {tab === 'lent' ? 'Outstanding to receive' : 'Outstanding to pay'}
          </div>
          <div className="amount font-display text-2xl font-medium text-ink-50 mt-1">{formatINR(openTotal)}</div>
        </div>
      )}

      {/* Open items */}
      {open.length > 0 && (
        <div className="mt-6">
          <div className="text-[11px] uppercase tracking-widest text-ink-500 mb-3">Open · {open.length}</div>
          <div className="space-y-2">
            {open.map(r => <LendingCard key={r.id} record={r} userId={user.id} />)}
          </div>
        </div>
      )}

      {/* Settled items */}
      {settled.length > 0 && (
        <div className="mt-7">
          <div className="text-[11px] uppercase tracking-widest text-ink-500 mb-3">Settled · {settled.length}</div>
          <div className="space-y-2">
            {settled.map(r => <LendingCard key={r.id} record={r} userId={user.id} settled />)}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center mt-20">
          <div className="text-4xl mb-3">{tab === 'lent' ? '🤝' : '💸'}</div>
          <div className="text-sm text-ink-500">No {tab === 'lent' ? 'lendings' : 'borrowings'} yet</div>
        </div>
      )}

      <Modal open={!!modalType} onClose={() => setModalType(null)} title={modalType === 'lent' ? 'Money lent' : 'Money borrowed'}>
        {modalType && (
          <LendingForm type={modalType} onClose={() => setModalType(null)} onSave={data => addLending(user.id, data)} />
        )}
      </Modal>
    </div>
  );
}

function LendingCard({ record: r, userId, settled }) {
  const dueDate = r.due_date ? fromISODate(r.due_date) : null;
  const isOverdue = dueDate && dueDate < new Date() && r.status === 'open';

  return (
    <div className={`bg-ink-900/60 border rounded-2xl px-4 py-3 flex items-center gap-3 ${isOverdue ? 'border-danger/30' : 'border-ink-800'}`}>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-ink-100 font-medium">{r.counterparty}</div>
        <div className="text-xs text-ink-500 mt-0.5">
          {format(fromISODate(r.date), 'd MMM yyyy')}
          {r.due_date && <span className={`ml-1.5 ${isOverdue ? 'text-danger' : ''}`}>· due {format(fromISODate(r.due_date), 'd MMM')}</span>}
        </div>
        {r.notes && <div className="text-xs text-ink-600 mt-0.5 truncate">{r.notes}</div>}
      </div>
      <div className={`amount font-medium shrink-0 ${settled ? 'text-ink-500 line-through' : 'text-ink-50'}`}>
        {formatINR(r.amount)}
      </div>
      {!settled && (
        <button onClick={() => { if (window.confirm('Mark as settled?')) settleLending(userId, r.id); }}
          className="p-1.5 text-ink-500 hover:text-ok transition shrink-0">
          <CheckCircle size={16} />
        </button>
      )}
      <button onClick={() => { if (window.confirm('Delete this entry?')) deleteLending(userId, r.id); }}
        className="p-1.5 text-ink-700 hover:text-danger transition shrink-0">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function Label({ children }) {
  return <div className="text-xs text-ink-400 uppercase tracking-wider">{children}</div>;
}

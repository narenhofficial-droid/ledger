import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { addIncome } from '../../hooks/useIncomes';
import { toISODate } from '../../lib/dates';
import { parseAmount } from '../../lib/format';

const SOURCES = ['Monthly allowance', 'Stipend', 'Freelance', 'Part-time', 'Gift', 'Other'];

export function AddIncomeModal({ open, onClose, userId }) {
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('Monthly allowance');
  const [customSource, setCustomSource] = useState('');
  const [date, setDate] = useState(toISODate(new Date()));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const finalSource = source === 'Other' ? customSource.trim() || 'Other' : source;
  const canSave = parseAmount(amount) > 0;

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await addIncome(userId, {
        amount: parseAmount(amount),
        source: finalSource,
        date,
        notes: notes.trim() || null,
      });
      setAmount(''); setSource('Monthly allowance');
      setCustomSource(''); setNotes(''); setDate(toISODate(new Date()));
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add income">
      <div className="space-y-5">
        {/* Amount */}
        <div className="text-center py-2">
          <div className="flex items-baseline justify-center gap-1 amount">
            <span className="text-3xl text-ink-400 font-display">₹</span>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              className="bg-transparent text-5xl font-display font-medium text-ink-50 text-center w-44 focus:outline-none placeholder:text-ink-700"
            />
          </div>
        </div>

        {/* Source */}
        <div>
          <Label>Source</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {SOURCES.map(s => (
              <button key={s} onClick={() => setSource(s)}
                className={`h-9 px-3.5 rounded-full text-sm border transition ${
                  source === s
                    ? 'border-gold-500 bg-gold-500/15 text-gold-400'
                    : 'border-ink-700 bg-ink-800/50 text-ink-100'
                }`}>
                {s}
              </button>
            ))}
          </div>
          {source === 'Other' && (
            <input value={customSource} onChange={e => setCustomSource(e.target.value)}
              placeholder="Describe source…"
              className="mt-2 w-full h-11 px-4 bg-ink-800/60 border border-ink-700 rounded-xl text-ink-50 placeholder:text-ink-500 focus:outline-none focus:border-gold-500/50" />
          )}
        </div>

        {/* Date */}
        <div>
          <Label>Date</Label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="mt-2 w-full h-11 px-4 bg-ink-800/60 border border-ink-700 rounded-xl text-ink-50 focus:outline-none focus:border-gold-500/50" />
        </div>

        {/* Notes */}
        <div>
          <Label>Note <span className="text-ink-600 font-normal">(optional)</span></Label>
          <input value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="e.g. April allowance"
            className="mt-2 w-full h-11 px-4 bg-ink-800/60 border border-ink-700 rounded-xl text-ink-50 placeholder:text-ink-500 focus:outline-none focus:border-gold-500/50" />
        </div>

        <Button onClick={handleSave} disabled={!canSave || saving} size="lg" className="w-full">
          {saving ? 'Saving…' : 'Save income'}
        </Button>
      </div>
    </Modal>
  );
}

function Label({ children }) {
  return <div className="text-xs text-ink-400 uppercase tracking-wider">{children}</div>;
}

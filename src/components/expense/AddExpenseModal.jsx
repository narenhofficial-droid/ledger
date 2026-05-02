import { useEffect, useRef, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Chip } from '../ui/Chip';
import { Button } from '../ui/Button';
import { useCategories, useSubcategories } from '../../hooks/useCategories';
import { addExpense } from '../../hooks/useExpenses';
import { PAYMENT_METHODS } from '../../constants/categories';
import { toISODate as dateISO } from '../../lib/dates';
import { parseAmount, formatIndianNumber as fmtNum } from '../../lib/format';

export function AddExpenseModal({ open, onClose, userId }) {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [subcategoryId, setSubcategoryId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(dateISO(new Date()));
  const [saving, setSaving] = useState(false);

  const categories = useCategories(userId);
  const subcategories = useSubcategories(userId, categoryId);
  const inputRef = useRef(null);

  // Auto-focus amount input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      // reset
      setAmount(''); setCategoryId(null); setSubcategoryId(null);
      setPaymentMethod('UPI'); setNotes(''); setDate(dateISO(new Date()));
    }
  }, [open]);

  // Reset subcategory when category changes
  useEffect(() => { setSubcategoryId(null); }, [categoryId]);

  const amountNumber = parseAmount(amount);
  const canSave = amountNumber > 0 && categoryId && paymentMethod;

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await addExpense(userId, {
        date,
        amount: amountNumber,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        payment_method: paymentMethod,
        notes: notes.trim() || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add expense">
      <div className="space-y-5">
        {/* Amount — the hero of this screen */}
        <div className="text-center py-2">
          <div className="flex items-baseline justify-center gap-1 amount">
            <span className="text-3xl text-ink-400 font-display">₹</span>
            <input
              ref={inputRef}
              type="number"
              inputMode="decimal"
              pattern="[0-9]*"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="bg-transparent text-5xl font-display font-medium text-ink-50 text-center w-44 focus:outline-none placeholder:text-ink-700"
            />
          </div>
          {amountNumber > 0 && (
            <div className="mt-1 text-xs text-ink-400 amount">
              {fmtNum(amountNumber)}
            </div>
          )}
        </div>

        {/* Categories */}
        <div>
          <Label>Category</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {categories.map(c => (
              <Chip
                key={c.id}
                selected={categoryId === c.id}
                onClick={() => setCategoryId(c.id)}
                color={c.color}
              >
                <span className="text-base leading-none">{c.icon}</span>
                <span>{c.name.split(' ')[0]}</span>
              </Chip>
            ))}
          </div>
        </div>

        {/* Subcategories — only when category selected */}
        {categoryId && subcategories.length > 0 && (
          <div className="animate-fade-in">
            <Label>Subcategory <span className="text-ink-500 font-normal">(optional)</span></Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {subcategories.map(s => (
                <Chip
                  key={s.id}
                  selected={subcategoryId === s.id}
                  onClick={() => setSubcategoryId(subcategoryId === s.id ? null : s.id)}
                >
                  {s.name}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {/* Payment method */}
        <div>
          <Label>Paid via</Label>
          <div className="flex gap-2 mt-2">
            {PAYMENT_METHODS.map(m => (
              <Chip key={m} selected={paymentMethod === m} onClick={() => setPaymentMethod(m)}>
                {m}
              </Chip>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label>Note <span className="text-ink-500 font-normal">(optional)</span></Label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What was this for?"
            className="mt-2 w-full h-12 px-4 bg-ink-800/60 border border-ink-700 rounded-xl text-ink-50 placeholder:text-ink-500 focus:outline-none focus:border-gold-500/50"
          />
        </div>

        {/* Date — collapsed by default, today */}
        <details className="text-sm">
          <summary className="text-ink-400 cursor-pointer select-none">Change date (today)</summary>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-2 w-full h-12 px-4 bg-ink-800/60 border border-ink-700 rounded-xl text-ink-50 focus:outline-none focus:border-gold-500/50"
          />
        </details>

        {/* Save */}
        <Button
          onClick={handleSave}
          disabled={!canSave || saving}
          size="lg"
          className="w-full"
        >
          {saving ? 'Saving…' : 'Save expense'}
        </Button>
      </div>
    </Modal>
  );
}

function Label({ children }) {
  return <div className="text-xs text-ink-400 uppercase tracking-wider">{children}</div>;
}

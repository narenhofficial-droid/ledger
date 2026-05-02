import { useEffect, useRef, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Chip } from '../ui/Chip';
import { Button } from '../ui/Button';
import { useCategories, useSubcategories } from '../../hooks/useCategories';
import { addExpense, updateExpense } from '../../hooks/useExpenses';
import { PAYMENT_METHODS } from '../../constants/categories';
import { toISODate as dateISO } from '../../lib/dates';
import { parseAmount, formatIndianNumber as fmtNum } from '../../lib/format';

// editData — pass an expense object to switch to edit mode, omit for add mode
export function AddExpenseModal({ open, onClose, userId, editData = null }) {
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

  // Pre-fill form when modal opens; reset when it closes
  useEffect(() => {
    if (open) {
      if (editData) {
        setAmount(String(editData.amount));
        setCategoryId(editData.category_id);
        setSubcategoryId(editData.subcategory_id || null);
        setPaymentMethod(editData.payment_method);
        setNotes(editData.notes || '');
        setDate(editData.date);
      } else {
        setAmount(''); setCategoryId(null); setSubcategoryId(null);
        setPaymentMethod('UPI'); setNotes(''); setDate(dateISO(new Date()));
      }
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setAmount(''); setCategoryId(null); setSubcategoryId(null);
      setPaymentMethod('UPI'); setNotes(''); setDate(dateISO(new Date()));
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset subcategory when category changes
  useEffect(() => { setSubcategoryId(null); }, [categoryId]);

  const amountNumber = parseAmount(amount);
  const canSave = amountNumber > 0 && categoryId && paymentMethod;

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      if (editData) {
        await updateExpense(userId, editData.id, {
          date, amount: amountNumber, category_id: categoryId,
          subcategory_id: subcategoryId, payment_method: paymentMethod,
          notes: notes.trim() || null,
        });
      } else {
        await addExpense(userId, {
          date, amount: amountNumber, category_id: categoryId,
          subcategory_id: subcategoryId, payment_method: paymentMethod,
          notes: notes.trim() || null,
        });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const isEdit = Boolean(editData);

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit expense' : 'Add expense'}>
      <div className="space-y-5">
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
            <div className="mt-1 text-xs text-ink-400 amount">{fmtNum(amountNumber)}</div>
          )}
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

        {categoryId && subcategories.length > 0 && (
          <div className="animate-fade-in">
            <Label>Subcategory <span className="text-ink-500 font-normal">(optional)</span></Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {subcategories.map(s => (
                <Chip key={s.id} selected={subcategoryId === s.id} onClick={() => setSubcategoryId(subcategoryId === s.id ? null : s.id)}>
                  {s.name}
                </Chip>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label>Paid via</Label>
          <div className="flex gap-2 mt-2">
            {PAYMENT_METHODS.map(m => (
              <Chip key={m} selected={paymentMethod === m} onClick={() => setPaymentMethod(m)}>{m}</Chip>
            ))}
          </div>
        </div>

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

        <details className="text-sm" open={isEdit}>
          <summary className="text-ink-400 cursor-pointer select-none">
            {isEdit ? 'Date' : 'Change date (today)'}
          </summary>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-2 w-full h-12 px-4 bg-ink-800/60 border border-ink-700 rounded-xl text-ink-50 focus:outline-none focus:border-gold-500/50"
          />
        </details>

        <Button onClick={handleSave} disabled={!canSave || saving} size="lg" className="w-full">
          {saving ? 'Saving...' : isEdit ? 'Update expense' : 'Save expense'}
        </Button>
      </div>
    </Modal>
  );
}

function Label({ children }) {
  return <div className="text-xs text-ink-400 uppercase tracking-wider">{children}</div>;
}

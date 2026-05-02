import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { syncAll } from '../lib/sync';
import { toISODate } from '../lib/dates';

function uuid() {
  return crypto.randomUUID();
}

export function useExpenses(userId, filter = {}) {
  const expenses = useLiveQuery(async () => {
    if (!userId) return [];
    let coll = db.expenses.where('user_id').equals(userId);
    let arr = await coll.toArray();

    if (filter.from && filter.to) {
      const from = toISODate(filter.from);
      const to = toISODate(filter.to);
      arr = arr.filter(e => e.date >= from && e.date <= to);
    }
    if (filter.categoryId) arr = arr.filter(e => e.category_id === filter.categoryId);
    if (filter.paymentMethod) arr = arr.filter(e => e.payment_method === filter.paymentMethod);

    arr.sort((a, b) => (b.date.localeCompare(a.date) || (b.created_at || '').localeCompare(a.created_at || '')));
    return arr;
  }, [userId, JSON.stringify(filter)]);

  return expenses ?? [];
}

export async function addExpense(userId, data) {
  const now = new Date().toISOString();
  const row = {
    id: uuid(),
    user_id: userId,
    date: data.date,
    amount: Number(data.amount),
    category_id: data.category_id,
    subcategory_id: data.subcategory_id || null,
    payment_method: data.payment_method,
    notes: data.notes || null,
    tag: data.tag || null,
    autopay_id: data.autopay_id || null,
    created_at: now,
    updated_at: now,
    _synced: false,
    _op: 'insert',
  };
  await db.expenses.add(row);
  syncAll(userId);
  return row;
}

export async function updateExpense(userId, id, patch) {
  const existing = await db.expenses.get(id);
  if (!existing) return;
  const updated = {
    ...existing,
    ...patch,
    updated_at: new Date().toISOString(),
    _synced: false,
    _op: existing._op === 'insert' ? 'insert' : 'update',
  };
  await db.expenses.put(updated);
  syncAll(userId);
}

export async function deleteExpense(userId, id) {
  const existing = await db.expenses.get(id);
  if (!existing) return;
  if (existing._op === 'insert' && !existing._synced) {
    // never made it to server, just drop locally
    await db.expenses.delete(id);
  } else {
    await db.expenses.update(id, { _op: 'delete', _synced: false });
  }
  syncAll(userId);
}

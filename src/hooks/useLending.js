import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { syncAll } from '../lib/sync';

export function useLending(userId) {
  const data = useLiveQuery(async () => {
    if (!userId) return [];
    const arr = await db.lending.where('user_id').equals(userId).toArray();
    return arr.filter(r => r._op !== 'delete').sort((a, b) => b.date.localeCompare(a.date));
  }, [userId]);
  return data ?? [];
}

export async function addLending(userId, data) {
  const now = new Date().toISOString();
  const row = {
    id: crypto.randomUUID(),
    user_id: userId,
    type: data.type,
    counterparty: data.counterparty,
    amount: Number(data.amount),
    date: data.date,
    due_date: data.due_date || null,
    status: 'open',
    settled_at: null,
    notes: data.notes || null,
    created_at: now,
    updated_at: now,
    _synced: false,
    _op: 'insert',
  };
  await db.lending.add(row);
  syncAll(userId);
  return row;
}

export async function settleLending(userId, id) {
  const existing = await db.lending.get(id);
  if (!existing) return;
  const updated = { ...existing, status: 'settled', settled_at: new Date().toISOString(), updated_at: new Date().toISOString(), _synced: false, _op: existing._op === 'insert' ? 'insert' : 'update' };
  await db.lending.put(updated);
  syncAll(userId);
}

export async function deleteLending(userId, id) {
  const existing = await db.lending.get(id);
  if (!existing) return;
  if (existing._op === 'insert' && !existing._synced) {
    await db.lending.delete(id);
  } else {
    await db.lending.update(id, { _op: 'delete', _synced: false });
  }
  syncAll(userId);
}

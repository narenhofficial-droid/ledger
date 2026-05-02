import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { syncAll } from '../lib/sync';

export function useAutopays(userId) {
  const data = useLiveQuery(async () => {
    if (!userId) return [];
    const arr = await db.autopays.where('user_id').equals(userId).toArray();
    return arr
      .filter(a => a._op !== 'delete')
      .sort((a, b) => a.next_charge_date.localeCompare(b.next_charge_date));
  }, [userId]);
  return data ?? [];
}

export function useUpcomingAutopays(userId, days = 7) {
  const all = useAutopays(userId);
  const today = new Date();
  const cutoff = new Date(today.getTime() + days * 86400000);
  return all.filter(a => {
    const d = new Date(a.next_charge_date);
    return d >= today && d <= cutoff && a.status === 'active';
  });
}

export async function addAutopay(userId, data) {
  const now = new Date().toISOString();
  const row = {
    id: crypto.randomUUID(),
    user_id: userId,
    name: data.name,
    amount: Number(data.amount),
    category_id: data.category_id,
    frequency: data.frequency,
    next_charge_date: data.next_charge_date,
    status: 'active',
    notes: data.notes || null,
    created_at: now,
    updated_at: now,
    _synced: false,
    _op: 'insert',
  };
  await db.autopays.add(row);
  syncAll(userId);
  return row;
}

export async function updateAutopay(userId, id, patch) {
  const existing = await db.autopays.get(id);
  if (!existing) return;
  const updated = { ...existing, ...patch, updated_at: new Date().toISOString(), _synced: false, _op: existing._op === 'insert' ? 'insert' : 'update' };
  await db.autopays.put(updated);
  syncAll(userId);
}

export async function deleteAutopay(userId, id) {
  const existing = await db.autopays.get(id);
  if (!existing) return;
  if (existing._op === 'insert' && !existing._synced) {
    await db.autopays.delete(id);
  } else {
    await db.autopays.update(id, { _op: 'delete', _synced: false });
  }
  syncAll(userId);
}

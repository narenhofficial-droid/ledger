import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { syncAll } from '../lib/sync';

export function useBudgets(userId) {
  const data = useLiveQuery(async () => {
    if (!userId) return [];
    const arr = await db.budgets.where('user_id').equals(userId).toArray();
    return arr.filter(r => r._op !== 'delete');
  }, [userId]);
  return data ?? [];
}

export async function addBudget(userId, data) {
  const now = new Date().toISOString();
  const row = {
    id: crypto.randomUUID(),
    user_id: userId,
    category_id: data.category_id,
    monthly_limit: Number(data.monthly_limit),
    alert_at_pct: data.alert_at_pct ?? 75,
    created_at: now,
    updated_at: now,
    _synced: false,
    _op: 'insert',
  };
  await db.budgets.add(row);
  syncAll(userId);
  return row;
}

export async function updateBudget(userId, id, patch) {
  const existing = await db.budgets.get(id);
  if (!existing) return;
  const updated = { ...existing, ...patch, updated_at: new Date().toISOString(), _synced: false, _op: existing._op === 'insert' ? 'insert' : 'update' };
  await db.budgets.put(updated);
  syncAll(userId);
}

export async function deleteBudget(userId, id) {
  const existing = await db.budgets.get(id);
  if (!existing) return;
  if (existing._op === 'insert' && !existing._synced) {
    await db.budgets.delete(id);
  } else {
    await db.budgets.update(id, { _op: 'delete', _synced: false });
  }
  syncAll(userId);
}

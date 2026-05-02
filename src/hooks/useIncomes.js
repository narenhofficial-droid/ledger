import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { syncAll } from '../lib/sync';
import { toISODate } from '../lib/dates';

export function useIncomes(userId, range) {
  const data = useLiveQuery(async () => {
    if (!userId) return [];
    let arr = await db.incomes.where('user_id').equals(userId).toArray();
    if (range?.from && range?.to) {
      const from = toISODate(range.from);
      const to = toISODate(range.to);
      arr = arr.filter(r => r.date >= from && r.date <= to);
    }
    return arr.sort((a, b) => b.date.localeCompare(a.date));
  }, [userId, JSON.stringify(range)]);
  return data ?? [];
}

export async function addIncome(userId, data) {
  const now = new Date().toISOString();
  const row = {
    id: crypto.randomUUID(),
    user_id: userId,
    date: data.date,
    amount: Number(data.amount),
    source: data.source || 'Monthly allowance',
    notes: data.notes || null,
    created_at: now,
    updated_at: now,
    _synced: false,
    _op: 'insert',
  };
  await db.incomes.add(row);
  syncAll(userId);
  return row;
}

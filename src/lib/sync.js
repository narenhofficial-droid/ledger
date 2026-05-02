import { supabase } from './supabase';
import { db, TABLES } from './db';

// categories and subcategories have no updated_at column — always pull full set
const NO_UPDATED_AT = new Set(['categories', 'subcategories']);

async function getLastPull(table) {
  const row = await db.meta.get(`lastPull:${table}`);
  return row?.value || '1970-01-01T00:00:00Z';
}
async function setLastPull(table, ts) {
  await db.meta.put({ key: `lastPull:${table}`, value: ts });
}

async function pushTable(table) {
  const pending = await db[table].filter(r => r._op).toArray();
  for (const row of pending) {
    const op = row._op;
    const clean = { ...row };
    delete clean._op; delete clean._synced;

    if (op === 'delete') {
      const { error } = await supabase.from(table).delete().eq('id', row.id);
      if (!error) await db[table].delete(row.id);
      continue;
    }
    if (op === 'insert' || op === 'update') {
      const { error } = await supabase.from(table).upsert(clean);
      if (!error) {
        await db[table].update(row.id ?? row.user_id, { _op: null, _synced: true });
      } else {
        console.warn(`push ${table} failed`, error);
      }
    }
  }
}

async function pullTable(table, userId) {
  let query = supabase.from(table).select('*').eq('user_id', userId);

  // Only filter by updated_at for tables that have that column
  if (!NO_UPDATED_AT.has(table)) {
    const since = await getLastPull(table);
    query = query.gte('updated_at', since).order('updated_at', { ascending: true });
  }

  const { data, error } = await query;
  if (error) { console.warn(`pull ${table} failed`, error); return; }
  if (!data?.length) return;

  const rows = data.map(r => ({ ...r, _synced: true, _op: null }));
  await db[table].bulkPut(rows);

  if (!NO_UPDATED_AT.has(table)) {
    const since = await getLastPull(table);
    const newest = rows.reduce(
      (acc, r) => (r.updated_at && r.updated_at > acc ? r.updated_at : acc),
      since
    );
    await setLastPull(table, newest);
  }
}

export async function syncAll(userId) {
  if (!userId || !navigator.onLine) return;
  for (const t of TABLES) {
    try { await pushTable(t); } catch (e) { console.warn(e); }
  }
  for (const t of TABLES) {
    try { await pullTable(t, userId); } catch (e) { console.warn(e); }
  }
}

export async function fullPull(userId) {
  for (const t of TABLES) {
    await db.meta.delete(`lastPull:${t}`);
  }
  await syncAll(userId);
}

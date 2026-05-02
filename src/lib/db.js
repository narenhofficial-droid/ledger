import Dexie from 'dexie';

// Local IndexedDB cache for offline-first behavior.
// Every row also has _synced flag and _op ('insert' | 'update' | 'delete' | null).
// Sync engine pushes pending ops to Supabase, and pulls remote rows.

export const db = new Dexie('finance_tracker');

db.version(1).stores({
  categories:    'id, user_id, name, sort_order, _synced',
  subcategories: 'id, user_id, category_id, name, _synced',
  incomes:       'id, user_id, date, _synced',
  expenses:      'id, user_id, date, category_id, _synced, [user_id+date]',
  autopays:      'id, user_id, next_charge_date, status, _synced',
  lending:       'id, user_id, status, date, _synced',
  budgets:       'id, user_id, category_id, _synced',
  settings:      'user_id, _synced',
  meta:          'key',
});

export const TABLES = [
  'categories', 'subcategories', 'incomes', 'expenses',
  'autopays', 'lending', 'budgets', 'settings',
];

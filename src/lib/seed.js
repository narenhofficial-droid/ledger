import { supabase } from './supabase';
import { db } from './db';

// Default categories matching the bootstrap_user trigger in schema.sql
const DEFAULTS = [
  {
    name: 'Food & eating out', icon: '🍽️', color: '#f97316', sort_order: 1,
    subs: ['Mess', 'Restaurant', 'Café', 'Snacks', 'Groceries', 'Delivery'],
  },
  {
    name: 'Transport', icon: '🚌', color: '#3b82f6', sort_order: 2,
    subs: ['Auto', 'Bus', 'Train', 'Cab', 'Fuel', 'Metro'],
  },
  {
    name: 'Subscriptions', icon: '📺', color: '#a855f7', sort_order: 3,
    subs: ['Streaming', 'Music', 'AI tools', 'Cloud', 'Other'],
  },
  {
    name: 'Personal care', icon: '💈', color: '#ec4899', sort_order: 4,
    subs: ['Haircut', 'Skincare', 'Laundry', 'Toiletries'],
  },
  {
    name: 'Mobile & internet', icon: '📱', color: '#10b981', sort_order: 5,
    subs: ['Mobile recharge', 'Wifi', 'Data pack'],
  },
  {
    name: 'Books & study', icon: '📚', color: '#eab308', sort_order: 6,
    subs: ['Textbooks', 'Stationery', 'Online course', 'Photocopy'],
  },
  {
    name: 'Health & medicines', icon: '💊', color: '#ef4444', sort_order: 7,
    subs: ['Medicines', 'Doctor', 'Tests', 'OTC'],
  },
  {
    name: 'Miscellaneous', icon: '📦', color: '#6b7280', sort_order: 99,
    subs: ['Gifts', 'Donations', 'Other'],
  },
];

// Called after fullPull — if Supabase still has no categories for this user,
// insert the defaults directly so the trigger gap is covered.
export async function seedDefaultsIfNeeded(userId) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (error || (data && data.length > 0)) return; // already seeded or can't check

    const now = new Date().toISOString();
    for (const cat of DEFAULTS) {
      const catId = crypto.randomUUID();

      const { error: catErr } = await supabase.from('categories').insert({
        id: catId,
        user_id: userId,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        is_custom: false,
        sort_order: cat.sort_order,
        created_at: now,
      });
      if (catErr) { console.warn('seed category failed', catErr); continue; }

      // Also write to local Dexie immediately so UI appears without waiting for sync
      await db.categories.put({
        id: catId, user_id: userId, name: cat.name, icon: cat.icon,
        color: cat.color, is_custom: false, sort_order: cat.sort_order,
        created_at: now, _synced: true, _op: null,
      });

      const subRows = cat.subs.map((name, i) => ({
        id: crypto.randomUUID(),
        user_id: userId,
        category_id: catId,
        name,
        is_custom: false,
        sort_order: i + 1,
        created_at: now,
      }));
      await supabase.from('subcategories').insert(subRows);
      await db.subcategories.bulkPut(
        subRows.map(r => ({ ...r, _synced: true, _op: null }))
      );
    }

    // Also create the settings row if missing
    await supabase.from('settings').upsert({ user_id: userId });

    console.log('Seeded default categories for', userId);
  } catch (e) {
    console.warn('seedDefaultsIfNeeded failed', e);
  }
}

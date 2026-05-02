import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';

export function useCategories(userId) {
  const cats = useLiveQuery(async () => {
    if (!userId) return [];
    const arr = await db.categories.where('user_id').equals(userId).toArray();
    arr.sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99));
    return arr;
  }, [userId]);
  return cats ?? [];
}

export function useSubcategories(userId, categoryId) {
  const subs = useLiveQuery(async () => {
    if (!userId || !categoryId) return [];
    const arr = await db.subcategories
      .where('category_id').equals(categoryId)
      .filter(s => s.user_id === userId)
      .toArray();
    arr.sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99));
    return arr;
  }, [userId, categoryId]);
  return subs ?? [];
}

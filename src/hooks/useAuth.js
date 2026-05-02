import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { fullPull, syncAll } from '../lib/sync';
import { seedDefaultsIfNeeded } from '../lib/seed';
import { db } from '../lib/db';

async function initialise(userId) {
  await fullPull(userId);
  await seedDefaultsIfNeeded(userId);
  // Second pull only needed if seeder just wrote new rows to Supabase
  const catCount = await db.categories.where('user_id').equals(userId).count();
  if (catCount === 0) await fullPull(userId);
}

export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const sess = data.session;
      if (sess?.user?.id) {
        // Pull data BEFORE revealing the app so dashboard isn't empty
        try { await initialise(sess.user.id); } catch (e) { console.warn(e); }
      }
      if (!mounted) return;
      setSession(sess);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      if (!mounted) return;
      if (sess?.user?.id && _event === 'SIGNED_IN') {
        setLoading(true);
        try { await initialise(sess.user.id); } catch (e) { console.warn(e); }
        if (!mounted) return;
        setSession(sess);
        setLoading(false);
      } else {
        setSession(sess);
        if (_event === 'SIGNED_OUT') setLoading(false);
      }
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  // Background sync every 60 s while online
  useEffect(() => {
    if (!session?.user?.id) return;
    const id = setInterval(() => syncAll(session.user.id), 60_000);
    const onOnline = () => syncAll(session.user.id);
    window.addEventListener('online', onOnline);
    return () => { clearInterval(id); window.removeEventListener('online', onOnline); };
  }, [session?.user?.id]);

  async function signInWithEmail(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error };
  }

  async function signOut() {
    await supabase.auth.signOut();
    await Promise.all([
      db.categories.clear(), db.subcategories.clear(), db.incomes.clear(),
      db.expenses.clear(), db.autopays.clear(), db.lending.clear(),
      db.budgets.clear(), db.settings.clear(), db.meta.clear(),
    ]);
  }

  return { session, user: session?.user, loading, signInWithEmail, signOut };
}

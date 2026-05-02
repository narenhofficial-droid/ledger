import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { fullPull, syncAll } from '../lib/sync';
import { seedDefaultsIfNeeded } from '../lib/seed';
import { db } from '../lib/db';

export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
      if (data.session?.user?.id) {
        await fullPull(data.session.user.id);
        await seedDefaultsIfNeeded(data.session.user.id);
        // Pull again to get freshly seeded rows into Dexie
        await fullPull(data.session.user.id);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      if (!mounted) return;
      setSession(sess);
      if (sess?.user?.id && _event === 'SIGNED_IN') {
        await fullPull(sess.user.id);
        await seedDefaultsIfNeeded(sess.user.id);
        await fullPull(sess.user.id);
      }
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    const id = setInterval(() => syncAll(session.user.id), 60_000);
    const onOnline = () => syncAll(session.user.id);
    window.addEventListener('online', onOnline);
    return () => {
      clearInterval(id);
      window.removeEventListener('online', onOnline);
    };
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

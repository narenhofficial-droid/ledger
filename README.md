# Ledger — Personal Finance Tracker

A mobile-first PWA for tracking expenses, autopays, and lending. Built for one user (you), not multi-tenant SaaS.

## Phase 1 + 2 delivered

- ✅ Auth (Google sign-in via Supabase)
- ✅ Postgres schema + RLS + auto-bootstrap of categories on signup
- ✅ Offline-first with Dexie + sync engine
- ✅ Add Expense modal — 2 taps from home, ≤ 5 seconds
- ✅ Home dashboard — month spend, income, left-to-spend, today, top categories, upcoming autopays
- ✅ Bottom nav scaffolding for Recent / Spend / Autopay / Lending tabs
- ⏳ Recent list, Categories chart, Autopay calendar, Lending, Budgets, Trends, Reports — Phases 3–8
- ⏳ Notifications, PWA polish — Phases 9–10

---

## 1. Local setup (5 min)

```bash
cd finance-tracker
npm install
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see step 2)
npm run dev
```

Open http://localhost:5173 on your phone (same Wi-Fi) using your computer's local IP, e.g. `http://192.168.1.5:5173`.

---

## 2. Supabase setup (10 min)

### 2a. Create project
1. Go to https://supabase.com → new project
2. Pick the closest region (Mumbai/Singapore for India)
3. Wait ~2 min for provisioning
4. Project Settings → API → copy `Project URL` and `anon public key` into `.env`

### 2b. Enable Google sign-in
1. Authentication → Providers → Google → enable
2. Follow the Supabase guide to create OAuth credentials in Google Cloud Console
3. **Authorized redirect URI** in Google Cloud: `https://<your-project>.supabase.co/auth/v1/callback`
4. Paste the Google `Client ID` and `Client Secret` into Supabase
5. Authentication → URL Configuration → Site URL: your Vercel URL (and `http://localhost:5173` while developing)

### 2c. Run schema + policies
1. SQL Editor → New query → paste contents of `supabase/schema.sql` → Run
2. Same with `supabase/policies.sql`

That's it for the database. The schema includes a trigger that auto-creates default categories + subcategories + settings the first time you sign in.

### 2d. (Optional) Seed sample data
Sign in to the app once so your `auth.users` row exists, then run `supabase/seed.sql` from the SQL editor while signed in. This populates a month of demo expenses.

---

## 3. Deploy to Vercel (5 min)

1. Push this repo to GitHub
2. https://vercel.com → New project → import the repo
3. Add env vars:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. Vercel auto-detects Vite.
5. Add the deployed URL to Supabase → Authentication → URL Configuration → Site URL

---

## 4. Install as PWA on your phone

After deploying:
1. Open your Vercel URL in **Chrome on Android** or **Safari on iOS**
2. Chrome: tap the ⋮ menu → "Install app" or "Add to Home screen"
3. Safari: tap the share button → "Add to Home Screen"
4. The app now opens fullscreen, no browser chrome, works offline

---

## 5. Architecture notes

**Folder structure**
```
src/
├── lib/         supabase client, Dexie DB, sync engine, formatters, date helpers
├── hooks/       useAuth, useExpenses, useCategories, useIncomes, useAutopays
├── components/  shell (nav, fab), expense (modal), ui (button, modal, chip)
├── screens/     Dashboard, SignIn, placeholder screens for upcoming phases
└── constants/   default categories
```

**Data flow**
- Every write goes to IndexedDB first, then queues for sync
- UI reads from IndexedDB via `dexie-react-hooks` (live queries)
- Sync engine pushes pending ops + pulls remote changes on app open + every 60s + when coming back online
- Conflict policy: last-write-wins by `updated_at`

**Why these tradeoffs**
- IndexedDB → instant UI, works offline, no spinners
- Single user → no need for realtime; polling is enough
- Calendar months only → simpler aggregation queries
- Binary lending → fewer states to track

---

## 6. Adding a custom category later

Settings page (Phase 9) will have a UI for this. For now you can insert directly:

```sql
insert into categories (user_id, name, icon, color, is_custom, sort_order)
values (auth.uid(), 'Travel', '✈️', '#06b6d4', true, 50);
```

---

## 7. Seven-day adoption plan

**Day 1 — Setup day (30 min total)**
Create the Supabase project, deploy to Vercel, install on home screen. Don't try to use it yet. Goal: zero friction tomorrow.

**Day 2 — Log every UPI, late evening review**
Every time you Google Pay something, log it before you put your phone down. At night, open the app once and look at today's number. Don't judge it. Just look.

**Day 3 — Backfill yesterday's gaps**
You'll have missed some. Open Recent (Phase 3, but Dashboard is fine for now) and add the ones you remember from PhonePe history. This builds the habit of "the app is the source of truth."

**Day 4 — Notice the top category**
By now Top Spending will show something. Don't act on it. Just notice. Awareness is the entire point of week 1.

**Day 5 — Add your autopays**
Phase 5 ships next. Until then, you can add Netflix/Spotify/ChatGPT manually as one-off expenses on the day they charge. This trains the muscle.

**Day 6 — Compare to your allowance**
Look at the "Left" stat. Is it positive? Negative? Don't change behavior yet — just sit with the number.

**Day 7 — Review and decide one thing**
Open the app. Look at the top 3 categories. Pick *one* you want to spend less on next week. Set a budget for it (Phase 7). Done.

**The rule for week 2 onwards:** if you haven't logged in 24 hours, the app is failing you, not the other way around. Tell me what's broken and we'll fix it.

---

## License

Single-user personal project. Do whatever you want with the code.

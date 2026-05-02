-- ═══════════════════════════════════════════════════════
-- Row Level Security policies
-- Run AFTER schema.sql
-- ═══════════════════════════════════════════════════════

alter table categories    enable row level security;
alter table subcategories enable row level security;
alter table incomes       enable row level security;
alter table expenses      enable row level security;
alter table autopays      enable row level security;
alter table lending       enable row level security;
alter table budgets       enable row level security;
alter table settings      enable row level security;

-- Drop if re-running
drop policy if exists "own rows" on categories;
drop policy if exists "own rows" on subcategories;
drop policy if exists "own rows" on incomes;
drop policy if exists "own rows" on expenses;
drop policy if exists "own rows" on autopays;
drop policy if exists "own rows" on lending;
drop policy if exists "own rows" on budgets;
drop policy if exists "own rows" on settings;

create policy "own rows" on categories    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on subcategories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on incomes       for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on expenses      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on autopays      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on lending       for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on budgets       for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on settings      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

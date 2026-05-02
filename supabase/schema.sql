-- ═══════════════════════════════════════════════════════
-- Personal Finance Tracker — Schema v1
-- Run this in Supabase SQL editor
-- ═══════════════════════════════════════════════════════

-- 1. Categories
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  icon        text not null,
  color       text not null,
  is_custom   boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  unique (user_id, name)
);

-- 2. Subcategories
create table if not exists subcategories (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  category_id  uuid not null references categories(id) on delete cascade,
  name         text not null,
  is_custom    boolean not null default false,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  unique (user_id, category_id, name)
);
create index if not exists subcategories_user_cat_idx on subcategories (user_id, category_id);

-- 3. Incomes
create table if not exists incomes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  amount      numeric(12,2) not null check (amount > 0),
  source      text not null default 'Monthly allowance',
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 4. Autopays (created before expenses since expenses references it)
create table if not exists autopays (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  name              text not null,
  amount            numeric(12,2) not null check (amount > 0),
  category_id       uuid not null references categories(id),
  frequency         text not null check (frequency in ('monthly','yearly')),
  next_charge_date  date not null,
  status            text not null default 'active' check (status in ('active','paused')),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists autopays_user_next_idx on autopays (user_id, next_charge_date)
  where status = 'active';

-- 5. Expenses
create table if not exists expenses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  date            date not null,
  amount          numeric(12,2) not null check (amount > 0),
  category_id     uuid not null references categories(id) on delete restrict,
  subcategory_id  uuid references subcategories(id) on delete set null,
  payment_method  text not null check (payment_method in ('UPI','Cash','Card')),
  notes           text,
  tag             text,
  autopay_id      uuid references autopays(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists expenses_user_date_idx on expenses (user_id, date desc);
create index if not exists expenses_user_category_idx on expenses (user_id, category_id, date desc);

-- 6. Lending (binary status)
create table if not exists lending (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  type            text not null check (type in ('lent','borrowed')),
  counterparty    text not null,
  amount          numeric(12,2) not null check (amount > 0),
  date            date not null,
  due_date        date,
  status          text not null default 'open' check (status in ('open','settled')),
  settled_at      timestamptz,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists lending_user_status_idx on lending (user_id, status, date desc);

-- 7. Budgets
create table if not exists budgets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  category_id   uuid not null references categories(id) on delete cascade,
  monthly_limit numeric(12,2) not null check (monthly_limit > 0),
  alert_at_pct  int not null default 75 check (alert_at_pct between 1 and 100),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, category_id)
);

-- 8. Settings (one row per user)
create table if not exists settings (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  notify_daily         boolean not null default true,
  notify_weekly        boolean not null default true,
  notify_autopay       boolean not null default true,
  notify_budget        boolean not null default true,
  daily_summary_hour   int not null default 21 check (daily_summary_hour between 0 and 23),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ─── updated_at trigger ───────────────────────────────
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_expenses_updated  on expenses;
drop trigger if exists trg_incomes_updated   on incomes;
drop trigger if exists trg_autopays_updated  on autopays;
drop trigger if exists trg_lending_updated   on lending;
drop trigger if exists trg_budgets_updated   on budgets;
drop trigger if exists trg_settings_updated  on settings;

create trigger trg_expenses_updated  before update on expenses  for each row execute function set_updated_at();
create trigger trg_incomes_updated   before update on incomes   for each row execute function set_updated_at();
create trigger trg_autopays_updated  before update on autopays  for each row execute function set_updated_at();
create trigger trg_lending_updated   before update on lending   for each row execute function set_updated_at();
create trigger trg_budgets_updated   before update on budgets   for each row execute function set_updated_at();
create trigger trg_settings_updated  before update on settings  for each row execute function set_updated_at();

-- ─── Seed defaults on new signup ──────────────────────
-- Auto-create default categories + subcategories + settings row when a new auth user is created
create or replace function bootstrap_user() returns trigger as $$
declare
  cat_food uuid; cat_trans uuid; cat_subs uuid; cat_pers uuid;
  cat_mob uuid; cat_book uuid; cat_health uuid; cat_misc uuid;
begin
  insert into categories (user_id, name, icon, color, sort_order) values
    (new.id, 'Food & eating out',  '🍽️', '#f97316', 1) returning id into cat_food;
  insert into categories (user_id, name, icon, color, sort_order) values
    (new.id, 'Transport',          '🚌', '#3b82f6', 2) returning id into cat_trans;
  insert into categories (user_id, name, icon, color, sort_order) values
    (new.id, 'Subscriptions',      '📺', '#a855f7', 3) returning id into cat_subs;
  insert into categories (user_id, name, icon, color, sort_order) values
    (new.id, 'Personal care',      '💈', '#ec4899', 4) returning id into cat_pers;
  insert into categories (user_id, name, icon, color, sort_order) values
    (new.id, 'Mobile & internet',  '📱', '#10b981', 5) returning id into cat_mob;
  insert into categories (user_id, name, icon, color, sort_order) values
    (new.id, 'Books & study',      '📚', '#eab308', 6) returning id into cat_book;
  insert into categories (user_id, name, icon, color, sort_order) values
    (new.id, 'Health & medicines', '💊', '#ef4444', 7) returning id into cat_health;
  insert into categories (user_id, name, icon, color, sort_order) values
    (new.id, 'Miscellaneous',      '📦', '#6b7280', 99) returning id into cat_misc;

  insert into subcategories (user_id, category_id, name, sort_order) values
    (new.id, cat_food, 'Mess', 1), (new.id, cat_food, 'Restaurant', 2),
    (new.id, cat_food, 'Café', 3), (new.id, cat_food, 'Snacks', 4),
    (new.id, cat_food, 'Groceries', 5), (new.id, cat_food, 'Delivery', 6),
    (new.id, cat_trans, 'Auto', 1), (new.id, cat_trans, 'Bus', 2),
    (new.id, cat_trans, 'Train', 3), (new.id, cat_trans, 'Cab', 4),
    (new.id, cat_trans, 'Fuel', 5), (new.id, cat_trans, 'Metro', 6),
    (new.id, cat_subs, 'Streaming', 1), (new.id, cat_subs, 'Music', 2),
    (new.id, cat_subs, 'AI tools', 3), (new.id, cat_subs, 'Cloud', 4),
    (new.id, cat_subs, 'Other', 5),
    (new.id, cat_pers, 'Haircut', 1), (new.id, cat_pers, 'Skincare', 2),
    (new.id, cat_pers, 'Laundry', 3), (new.id, cat_pers, 'Toiletries', 4),
    (new.id, cat_mob, 'Mobile recharge', 1), (new.id, cat_mob, 'Wifi', 2),
    (new.id, cat_mob, 'Data pack', 3),
    (new.id, cat_book, 'Textbooks', 1), (new.id, cat_book, 'Stationery', 2),
    (new.id, cat_book, 'Online course', 3), (new.id, cat_book, 'Photocopy', 4),
    (new.id, cat_health, 'Medicines', 1), (new.id, cat_health, 'Doctor', 2),
    (new.id, cat_health, 'Tests', 3), (new.id, cat_health, 'OTC', 4),
    (new.id, cat_misc, 'Gifts', 1), (new.id, cat_misc, 'Donations', 2),
    (new.id, cat_misc, 'Other', 3);

  insert into settings (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_bootstrap_user on auth.users;
create trigger trg_bootstrap_user after insert on auth.users
  for each row execute function bootstrap_user();

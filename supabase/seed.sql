-- ═══════════════════════════════════════════════════════
-- Seed sample data for the currently authenticated user
-- Run from SQL editor while signed in, OR replace auth.uid()
-- with your user_id manually.
-- ═══════════════════════════════════════════════════════

do $$
declare
  uid uuid := auth.uid();
  cat_food uuid; cat_trans uuid; cat_subs uuid; cat_mob uuid; cat_book uuid;
  sub_mess uuid; sub_auto uuid; sub_streaming uuid; sub_recharge uuid;
begin
  if uid is null then
    raise exception 'Run this while signed in.';
  end if;

  select id into cat_food   from categories where user_id = uid and name = 'Food & eating out';
  select id into cat_trans  from categories where user_id = uid and name = 'Transport';
  select id into cat_subs   from categories where user_id = uid and name = 'Subscriptions';
  select id into cat_mob    from categories where user_id = uid and name = 'Mobile & internet';
  select id into cat_book   from categories where user_id = uid and name = 'Books & study';

  select id into sub_mess      from subcategories where user_id = uid and category_id = cat_food and name = 'Mess';
  select id into sub_auto      from subcategories where user_id = uid and category_id = cat_trans and name = 'Auto';
  select id into sub_streaming from subcategories where user_id = uid and category_id = cat_subs and name = 'Streaming';
  select id into sub_recharge  from subcategories where user_id = uid and category_id = cat_mob and name = 'Mobile recharge';

  -- Income
  insert into incomes (user_id, date, amount, source, notes) values
    (uid, current_date - 20, 8000, 'Monthly allowance', 'Allowance from dad'),
    (uid, current_date - 50, 7500, 'Monthly allowance', null);

  -- Expenses (last 25 days, varied)
  insert into expenses (user_id, date, amount, category_id, subcategory_id, payment_method, notes) values
    (uid, current_date,       80,   cat_food, sub_mess,      'UPI',  'Lunch at mess'),
    (uid, current_date,       40,   cat_trans, sub_auto,     'Cash', 'Auto to college'),
    (uid, current_date - 1,  299,   cat_subs, sub_streaming, 'UPI',  'Netflix'),
    (uid, current_date - 1,  120,   cat_food, null,          'UPI',  'Café'),
    (uid, current_date - 2,  239,   cat_mob,  sub_recharge,  'UPI',  'Jio recharge'),
    (uid, current_date - 3,  450,   cat_book, null,          'UPI',  'Anatomy notes photocopy'),
    (uid, current_date - 4,  60,    cat_trans, null,         'UPI',  'Bus to Krishnagiri'),
    (uid, current_date - 5,  220,   cat_food, null,          'UPI',  'Dinner with friends'),
    (uid, current_date - 7,  150,   cat_food, sub_mess,      'UPI',  null),
    (uid, current_date - 9,  1200,  cat_book, null,          'UPI',  'Guyton textbook'),
    (uid, current_date - 12, 320,   cat_food, null,          'UPI',  'Restaurant'),
    (uid, current_date - 15, 80,    cat_trans, sub_auto,     'Cash', null);

  -- Autopays
  insert into autopays (user_id, name, amount, category_id, frequency, next_charge_date) values
    (uid, 'Netflix',     299,  cat_subs, 'monthly', date_trunc('month', current_date + interval '1 month')::date + 4),
    (uid, 'Spotify',     119,  cat_subs, 'monthly', date_trunc('month', current_date + interval '1 month')::date + 9),
    (uid, 'ChatGPT Plus', 1700, cat_subs, 'monthly', date_trunc('month', current_date + interval '1 month')::date + 14);

  -- Lending
  insert into lending (user_id, type, counterparty, amount, date, status, notes) values
    (uid, 'lent',     'Arjun',  500, current_date - 5,  'open', 'Mess fees split'),
    (uid, 'lent',     'Priya',  200, current_date - 12, 'open', null),
    (uid, 'borrowed', 'Karthik',300, current_date - 8,  'open', 'For textbook');

  -- Budgets
  insert into budgets (user_id, category_id, monthly_limit, alert_at_pct) values
    (uid, cat_food,  3000, 75),
    (uid, cat_trans, 1000, 80),
    (uid, cat_subs,  2500, 90);
end $$;

-- Run this ONCE in Supabase → SQL Editor → New query → Run.
-- Creates the table that tracks who has an active ₹119/month membership.

create table if not exists subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  status text not null default 'inactive',          -- 'active' or 'inactive'
  current_period_end timestamptz,                    -- when the current month's access expires
  razorpay_payment_id text,
  razorpay_order_id text,
  updated_at timestamptz default now()
);

alter table subscriptions enable row level security;

-- Readers can check their OWN subscription status (needed by the paywall).
create policy "Users can read own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);

-- Deliberately no insert/update policy for readers — only the server
-- (using the service_role key in api/verify-payment.js) can activate a
-- subscription. This is what makes it impossible for someone to unlock
-- articles by editing browser JavaScript.

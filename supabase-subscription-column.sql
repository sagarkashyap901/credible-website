-- Run ONCE in Supabase → SQL Editor.
-- Adds the column that links each member to their Razorpay subscription,
-- so monthly renewal webhooks can find and extend the right account.

alter table subscriptions
  add column if not exists razorpay_subscription_id text;

create index if not exists subscriptions_rzp_sub_idx
  on subscriptions (razorpay_subscription_id);

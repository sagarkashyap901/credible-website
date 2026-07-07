-- Run ONCE in Supabase → SQL Editor (safe to re-run).
-- Guarantees at the database level that one payment can never
-- activate more than one subscription, even if the API is bypassed.

create unique index if not exists subscriptions_payment_unique
  on subscriptions (razorpay_payment_id)
  where razorpay_payment_id is not null;

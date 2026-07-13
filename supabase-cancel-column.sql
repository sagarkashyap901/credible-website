-- supabase-cancel-column.sql
-- RUN THIS ONCE in Supabase → SQL Editor → New query → paste → Run.
--
-- Adds the flag that powers the "Cancel membership" button on account.html.
--
-- Why a separate column instead of just setting status = 'cancelled'?
-- Because the Refund Policy promises members keep access until the end of the
-- period they already paid for. If we flipped status to 'cancelled' straight
-- away, the paywall would lock them out instantly — and they'd have paid for
-- time they can't use.
--
-- So: cancel_at_period_end = true  →  "cancellation scheduled", still readable
--     status = 'cancelled'         →  set later by the Razorpay webhook, when
--                                     the cycle actually ends. Access lapses then.

alter table public.subscriptions
  add column if not exists cancel_at_period_end boolean not null default false;

-- Optional sanity check — should list the new column:
-- select column_name, data_type, column_default
-- from information_schema.columns
-- where table_name = 'subscriptions';

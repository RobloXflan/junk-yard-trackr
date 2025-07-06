-- Clear all cash management data only
-- This will NOT affect vehicles, inventory, releases, or any other data

-- Delete all cash transactions
DELETE FROM public.cash_transactions;

-- Delete all workers
DELETE FROM public.workers;

-- Delete all daily summaries
DELETE FROM public.daily_summaries;
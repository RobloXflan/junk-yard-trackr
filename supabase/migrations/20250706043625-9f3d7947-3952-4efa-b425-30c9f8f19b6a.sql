-- Add starting_balance as a new transaction type
-- Update the check constraint to include the new transaction type
ALTER TABLE public.cash_transactions 
DROP CONSTRAINT IF EXISTS cash_transactions_transaction_type_check;

ALTER TABLE public.cash_transactions 
ADD CONSTRAINT cash_transactions_transaction_type_check 
CHECK (transaction_type IN ('turn_in', 'give_money', 'starting_balance'));

-- Create an index for efficient lookups by worker and date
CREATE INDEX IF NOT EXISTS idx_cash_transactions_worker_date_type 
ON public.cash_transactions(worker_id, transaction_date, transaction_type);
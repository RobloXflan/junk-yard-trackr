
-- Modify the worker_checkins table to support cash reporting
-- Drop the existing response column and add cash-related columns
ALTER TABLE public.worker_checkins 
DROP COLUMN response;

-- Add new columns for cash reporting
ALTER TABLE public.worker_checkins 
ADD COLUMN starting_cash DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN money_added DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN money_subtracted DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN final_total DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Add a check constraint to ensure final_total matches the calculation
ALTER TABLE public.worker_checkins 
ADD CONSTRAINT check_final_total_calculation 
CHECK (final_total = starting_cash + money_added - money_subtracted);

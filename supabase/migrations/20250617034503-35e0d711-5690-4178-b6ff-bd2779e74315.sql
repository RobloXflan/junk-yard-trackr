
-- Remove DMV-related columns from vehicles table
ALTER TABLE public.vehicles 
DROP COLUMN IF EXISTS dmv_status,
DROP COLUMN IF EXISTS dmv_confirmation_number,
DROP COLUMN IF EXISTS dmv_submitted_at;

-- Drop DMV-related indexes
DROP INDEX IF EXISTS idx_vehicles_dmv_status;
DROP INDEX IF EXISTS idx_vehicles_dmv_ready;

-- Drop DMV automation logs table completely
DROP TABLE IF EXISTS public.dmv_automation_logs;

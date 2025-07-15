-- Remove customer fields from appointment_notes table
ALTER TABLE public.appointment_notes 
DROP COLUMN IF EXISTS customer_name,
DROP COLUMN IF EXISTS customer_phone,
DROP COLUMN IF EXISTS customer_email;
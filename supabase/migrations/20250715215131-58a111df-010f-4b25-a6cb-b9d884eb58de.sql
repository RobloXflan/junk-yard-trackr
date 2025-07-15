-- Add customer_address and paperwork columns to appointment_notes table
ALTER TABLE public.appointment_notes 
ADD COLUMN customer_address text,
ADD COLUMN paperwork text;
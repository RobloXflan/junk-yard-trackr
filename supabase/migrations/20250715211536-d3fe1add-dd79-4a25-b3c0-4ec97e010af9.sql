-- Add assigned_worker_id column to appointment_notes table
ALTER TABLE public.appointment_notes 
ADD COLUMN assigned_worker_id UUID REFERENCES public.workers(id);

-- Add customer contact fields that were missing from the original migration
ALTER TABLE public.appointment_notes 
ADD COLUMN customer_name TEXT,
ADD COLUMN customer_phone TEXT,
ADD COLUMN customer_email TEXT;
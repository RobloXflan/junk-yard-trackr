
-- Add paperwork columns to the vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN paperwork text,
ADD COLUMN paperwork_other text;

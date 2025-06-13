
-- Add documents column to the vehicles table to store uploaded files
ALTER TABLE public.vehicles 
ADD COLUMN documents JSONB DEFAULT '[]'::jsonb;


-- Add buyer address fields to the vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN buyer_address text,
ADD COLUMN buyer_city text,
ADD COLUMN buyer_state text DEFAULT 'CA',
ADD COLUMN buyer_zip text;

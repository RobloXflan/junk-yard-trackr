
-- Add new columns to the buyers table for city, state, and zip code
ALTER TABLE public.buyers 
ADD COLUMN city TEXT,
ADD COLUMN state TEXT,
ADD COLUMN zip_code TEXT;

-- Update the unique constraint to include the new fields
DROP INDEX buyers_name_address_idx;
CREATE UNIQUE INDEX buyers_name_location_idx ON public.buyers (first_name, last_name, address, city, state, zip_code);

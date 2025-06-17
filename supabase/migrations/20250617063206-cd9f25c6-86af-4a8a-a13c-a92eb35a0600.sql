
-- Add car_images column to vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN car_images jsonb DEFAULT '[]'::jsonb;

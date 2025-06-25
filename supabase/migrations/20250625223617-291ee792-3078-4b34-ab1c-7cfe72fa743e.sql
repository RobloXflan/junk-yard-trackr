
-- Add the is_released column to the vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN is_released BOOLEAN DEFAULT FALSE;

-- Update any existing sold vehicles to have is_released = false by default
UPDATE public.vehicles 
SET is_released = FALSE 
WHERE status = 'sold' AND is_released IS NULL;

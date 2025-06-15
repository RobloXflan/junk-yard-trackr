
-- Add DMV tracking columns to the vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN dmv_status text DEFAULT 'pending',
ADD COLUMN dmv_confirmation_number text,
ADD COLUMN dmv_submitted_at timestamp with time zone;

-- Add index for better performance when querying by DMV status
CREATE INDEX idx_vehicles_dmv_status ON public.vehicles(dmv_status);

-- Add index for vehicles ready for DMV submission (sold status with buyer info)
CREATE INDEX idx_vehicles_dmv_ready ON public.vehicles(status, buyer_first_name, buyer_last_name) 
WHERE status = 'sold' AND buyer_first_name IS NOT NULL AND buyer_last_name IS NOT NULL;

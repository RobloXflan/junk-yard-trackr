
-- Add indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_vehicles_make ON public.vehicles (make);
CREATE INDEX IF NOT EXISTS idx_vehicles_model ON public.vehicles (model);
CREATE INDEX IF NOT EXISTS idx_vehicles_year ON public.vehicles (year);
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON public.vehicles (license_plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_id ON public.vehicles (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles (status);
CREATE INDEX IF NOT EXISTS idx_vehicles_created_at ON public.vehicles (created_at DESC);

-- Create a composite index for common search patterns
CREATE INDEX IF NOT EXISTS idx_vehicles_search ON public.vehicles (make, model, year);

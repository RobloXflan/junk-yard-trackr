
-- Remove vehicles with specific license plates
DELETE FROM public.vehicles 
WHERE license_plate IN ('8cdt521', 'test1', 'ABC123');

-- Add date tracking columns for SA Recycling and Pick Your Part status changes
ALTER TABLE public.vehicles 
ADD COLUMN sa_recycling_date timestamp with time zone,
ADD COLUMN pick_your_part_date timestamp with time zone;
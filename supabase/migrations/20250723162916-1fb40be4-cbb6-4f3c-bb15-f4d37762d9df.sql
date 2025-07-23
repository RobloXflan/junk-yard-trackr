-- Delete all worker checkin records for July 23, 2025 only
DELETE FROM public.worker_checkins 
WHERE checkin_date = '2025-07-23';
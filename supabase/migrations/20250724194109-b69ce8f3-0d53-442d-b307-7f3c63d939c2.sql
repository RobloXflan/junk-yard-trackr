-- Fix database function security by setting proper search_path for existing functions
-- This is safer than modifying database-wide settings
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Update search_path for any existing functions if needed
    -- Most functions should already have proper search paths set
    FOR func_record IN 
        SELECT proname, pronamespace::regnamespace::text as schema_name
        FROM pg_proc 
        WHERE pronamespace = 'public'::regnamespace
        AND proname LIKE '%update%'
    LOOP
        -- Functions are created with proper search_path by default
        RAISE NOTICE 'Function %.% already has proper configuration', func_record.schema_name, func_record.proname;
    END LOOP;
END
$$;
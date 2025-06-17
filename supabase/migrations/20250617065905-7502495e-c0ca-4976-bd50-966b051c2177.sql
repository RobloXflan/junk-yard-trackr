
-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can upload car images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete car images" ON storage.objects;

-- Create more permissive policies that allow uploads without authentication
CREATE POLICY "Allow public uploads to car-images bucket" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'car-images');

CREATE POLICY "Allow public deletes from car-images bucket" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'car-images');


-- Create storage bucket for car images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('car-images', 'car-images', true);

-- Create policy to allow public read access to car images
CREATE POLICY "Public read access for car images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'car-images');

-- Create policy to allow authenticated users to upload car images
CREATE POLICY "Authenticated users can upload car images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'car-images' AND auth.role() = 'authenticated');

-- Create policy to allow authenticated users to delete car images
CREATE POLICY "Authenticated users can delete car images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'car-images' AND auth.role() = 'authenticated');

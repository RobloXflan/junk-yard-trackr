
-- Create a storage bucket for vehicle documents/images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vehicle-documents', 'vehicle-documents', true);

-- Create a policy to allow public access to view files
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'vehicle-documents');

-- Create a policy to allow anyone to upload files
CREATE POLICY "Anyone can upload vehicle documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vehicle-documents');

-- Create a policy to allow anyone to update files
CREATE POLICY "Anyone can update vehicle documents" ON storage.objects FOR UPDATE USING (bucket_id = 'vehicle-documents');

-- Create a policy to allow anyone to delete files
CREATE POLICY "Anyone can delete vehicle documents" ON storage.objects FOR DELETE USING (bucket_id = 'vehicle-documents');

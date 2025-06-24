
-- Create storage bucket for PDF documents and thumbnails
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pdf-documents', 'pdf-documents', true);

-- Create policy to allow public read access to PDF documents
CREATE POLICY "Public read access for PDF documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'pdf-documents');

-- Create policy to allow public uploads to PDF documents
CREATE POLICY "Allow public uploads to PDF documents bucket" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'pdf-documents');

-- Create policy to allow public deletes from PDF documents
CREATE POLICY "Allow public deletes from PDF documents bucket" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'pdf-documents');

-- Create policy to allow public updates to PDF documents
CREATE POLICY "Allow public updates to PDF documents bucket" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'pdf-documents');

-- Update pdf_batches table to store file path
ALTER TABLE pdf_batches ADD COLUMN file_path TEXT;

-- Update pdf_pages table to improve URLs and add delete functionality
ALTER TABLE pdf_pages ADD COLUMN file_size INTEGER DEFAULT 0;

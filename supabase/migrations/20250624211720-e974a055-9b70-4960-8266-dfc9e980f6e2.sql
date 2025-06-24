
-- Create table for PDF batch tracking
CREATE TABLE public.pdf_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_pages INTEGER NOT NULL DEFAULT 0,
  processed_pages INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'uploaded',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for individual PDF pages
CREATE TABLE public.pdf_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.pdf_batches(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  thumbnail_url TEXT,
  full_page_url TEXT,
  assigned_vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'unassigned',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for OCR results
CREATE TABLE public.page_ocr_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.pdf_pages(id) ON DELETE CASCADE,
  extracted_text TEXT,
  confidence_score INTEGER DEFAULT 0,
  parsed_fields JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_pdf_pages_batch_id ON public.pdf_pages(batch_id);
CREATE INDEX idx_pdf_pages_status ON public.pdf_pages(status);
CREATE INDEX idx_pdf_pages_assigned_vehicle ON public.pdf_pages(assigned_vehicle_id);
CREATE INDEX idx_page_ocr_results_page_id ON public.page_ocr_results(page_id);

-- Enable RLS (Row Level Security) - for now, make it accessible to all authenticated users
ALTER TABLE public.pdf_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_ocr_results ENABLE ROW LEVEL SECURITY;

-- Create policies for full access (you can restrict these later based on user roles)
CREATE POLICY "Allow all operations on pdf_batches" ON public.pdf_batches FOR ALL USING (true);
CREATE POLICY "Allow all operations on pdf_pages" ON public.pdf_pages FOR ALL USING (true);
CREATE POLICY "Allow all operations on page_ocr_results" ON public.page_ocr_results FOR ALL USING (true);

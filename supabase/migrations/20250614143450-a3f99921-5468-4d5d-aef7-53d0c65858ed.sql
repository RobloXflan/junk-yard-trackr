
-- Create table for pending intakes from emails
CREATE TABLE public.pending_intakes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_from TEXT NOT NULL,
  email_subject TEXT,
  email_body TEXT,
  email_received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confidence_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  documents JSONB DEFAULT '[]'::jsonb,
  extracted_info JSONB DEFAULT '{}'::jsonb,
  processed_by UUID REFERENCES auth.users,
  processed_at TIMESTAMP WITH TIME ZONE,
  vehicle_id UUID REFERENCES vehicles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for email processing logs
CREATE TABLE public.email_processing_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_from TEXT NOT NULL,
  email_subject TEXT,
  processing_status TEXT NOT NULL CHECK (processing_status IN ('filtered_out', 'processed', 'error')),
  filter_reason TEXT,
  error_message TEXT,
  pending_intake_id UUID REFERENCES pending_intakes(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_pending_intakes_status ON pending_intakes(status);
CREATE INDEX idx_pending_intakes_email_received_at ON pending_intakes(email_received_at DESC);
CREATE INDEX idx_email_processing_logs_created_at ON email_processing_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.pending_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_processing_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for pending_intakes (public access for now, can be restricted later)
CREATE POLICY "Allow all operations on pending_intakes" ON public.pending_intakes FOR ALL USING (true);

-- Create policies for email_processing_logs (public access for now, can be restricted later)
CREATE POLICY "Allow all operations on email_processing_logs" ON public.email_processing_logs FOR ALL USING (true);

-- Create storage bucket for email attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('email-attachments', 'email-attachments', true);

-- Create policy for email attachments bucket
CREATE POLICY "Allow all operations on email attachments" ON storage.objects FOR ALL USING (bucket_id = 'email-attachments');

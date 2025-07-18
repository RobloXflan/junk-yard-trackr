-- Create table for storing call transcripts
CREATE TABLE public.call_transcripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_note_id UUID REFERENCES public.appointment_notes(id) ON DELETE CASCADE,
  transcript_text TEXT NOT NULL,
  audio_duration INTEGER, -- duration in seconds
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for AI extracted data with confidence scores
CREATE TABLE public.extracted_data_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transcript_id UUID REFERENCES public.call_transcripts(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL, -- e.g., 'vehicle_year', 'customer_address'
  extracted_value TEXT,
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  ai_reasoning TEXT, -- why AI chose this value
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.call_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_data_log ENABLE ROW LEVEL SECURITY;

-- Create policies for call_transcripts
CREATE POLICY "Users can view their own transcripts" 
ON public.call_transcripts 
FOR SELECT 
USING (true); -- Public for now, can be restricted later

CREATE POLICY "Users can create transcripts" 
ON public.call_transcripts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own transcripts" 
ON public.call_transcripts 
FOR UPDATE 
USING (true);

-- Create policies for extracted_data_log
CREATE POLICY "Users can view extracted data" 
ON public.extracted_data_log 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create extracted data" 
ON public.extracted_data_log 
FOR INSERT 
WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX idx_call_transcripts_appointment_note_id ON public.call_transcripts(appointment_note_id);
CREATE INDEX idx_extracted_data_log_transcript_id ON public.extracted_data_log(transcript_id);
CREATE INDEX idx_extracted_data_log_field_name ON public.extracted_data_log(field_name);

-- Add trigger for timestamps
CREATE TRIGGER update_call_transcripts_updated_at
BEFORE UPDATE ON public.call_transcripts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create appointment_notes table for storing customer call notes
CREATE TABLE public.appointment_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  vehicle_year TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  estimated_price NUMERIC,
  appointment_booked BOOLEAN DEFAULT FALSE,
  notes TEXT,
  telegram_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointment_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for appointment notes
CREATE POLICY "Allow all operations on appointment_notes" 
ON public.appointment_notes 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_appointment_notes_updated_at
BEFORE UPDATE ON public.appointment_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
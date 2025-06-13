
-- Create a table for vehicle inventory
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year TEXT NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  vehicle_id TEXT NOT NULL,
  license_plate TEXT,
  seller_name TEXT,
  purchase_date TEXT,
  purchase_price TEXT,
  title_present BOOLEAN DEFAULT false,
  bill_of_sale BOOLEAN DEFAULT false,
  destination TEXT,
  buyer_name TEXT,
  buyer_first_name TEXT,
  buyer_last_name TEXT,
  sale_date TEXT,
  sale_price TEXT,
  notes TEXT,
  status TEXT DEFAULT 'yard',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) - for now we'll make it public access
-- You can add authentication later if needed
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Create policy that allows anyone to do everything (since no auth yet)
CREATE POLICY "Allow all access to vehicles" 
  ON public.vehicles 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

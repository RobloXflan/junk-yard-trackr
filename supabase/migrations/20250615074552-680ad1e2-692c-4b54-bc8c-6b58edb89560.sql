
-- Create a table for buyers
CREATE TABLE public.buyers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create a unique constraint to prevent duplicate buyers
CREATE UNIQUE INDEX buyers_name_address_idx ON public.buyers (first_name, last_name, address);

-- Add RLS policies (making it public for now since this seems to be an internal business tool)
ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can restrict later if needed)
CREATE POLICY "Allow all operations on buyers" 
  ON public.buyers 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

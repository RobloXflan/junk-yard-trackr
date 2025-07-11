-- Create business_purchases table for tracking business expenses
CREATE TABLE public.business_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  purchase_date DATE NOT NULL,
  purchase_price NUMERIC(10,2) NOT NULL,
  vendor_store TEXT NOT NULL,
  category TEXT NOT NULL,
  receipt_url TEXT,
  payment_method TEXT NOT NULL,
  notes_purpose TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.business_purchases ENABLE ROW LEVEL SECURITY;

-- Create policy for all operations (since this is admin-only app)
CREATE POLICY "Allow all operations on business_purchases" 
ON public.business_purchases 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create storage bucket for business receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('business-receipts', 'business-receipts', true);

-- Create storage policies for business receipts
CREATE POLICY "Anyone can view business receipts" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'business-receipts');

CREATE POLICY "Anyone can upload business receipts" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'business-receipts');

CREATE POLICY "Anyone can update business receipts" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'business-receipts');

CREATE POLICY "Anyone can delete business receipts" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'business-receipts');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_business_purchases_updated_at
BEFORE UPDATE ON public.business_purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
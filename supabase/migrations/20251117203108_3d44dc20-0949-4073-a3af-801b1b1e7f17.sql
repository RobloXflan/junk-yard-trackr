-- Create support_messages table
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can submit support messages" 
ON public.support_messages 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view support messages" 
ON public.support_messages 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update support messages" 
ON public.support_messages 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_support_messages_updated_at
BEFORE UPDATE ON public.support_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
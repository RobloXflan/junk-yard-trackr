
-- Create worker_checkins table to store daily check-in responses
CREATE TABLE public.worker_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  response TEXT NOT NULL CHECK (response IN ('yes', 'no')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(worker_id, checkin_date)
);

-- Enable Row Level Security
ALTER TABLE public.worker_checkins ENABLE ROW LEVEL SECURITY;

-- Create policies for worker_checkins
CREATE POLICY "Allow all operations on worker_checkins" 
ON public.worker_checkins 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_worker_checkins_date ON public.worker_checkins(checkin_date);
CREATE INDEX idx_worker_checkins_worker_date ON public.worker_checkins(worker_id, checkin_date);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_worker_checkins_updated_at
  BEFORE UPDATE ON public.worker_checkins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- Create dmv_automation_logs table to store DMV automation process logs and screenshots
CREATE TABLE public.dmv_automation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  step TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'error', 'in-progress')),
  screenshot_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX idx_dmv_automation_logs_vehicle_id ON public.dmv_automation_logs(vehicle_id);
CREATE INDEX idx_dmv_automation_logs_status ON public.dmv_automation_logs(status);
CREATE INDEX idx_dmv_automation_logs_created_at ON public.dmv_automation_logs(created_at DESC);

-- Enable Row Level Security (though for admin dashboard, we might not need strict policies)
ALTER TABLE public.dmv_automation_logs ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now (you can restrict this later if needed)
CREATE POLICY "Allow all operations on dmv_automation_logs" 
  ON public.dmv_automation_logs 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);
